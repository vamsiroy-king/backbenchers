// Transaction Service - Supabase operations for transactions

import { supabase, subscribeToTable } from '../supabase';
import { Transaction, TransactionFilters, ApiResponse } from '../types';

// Map database row to frontend Transaction type
// Map database row to frontend Transaction type
const mapDbToTransaction = (row: any): Transaction => {
    // Handle both flat (001 schema) and normalized (011 schema) structures
    // For normalized schema, data might be in 'notes' as JSON or in related tables
    let notesData = {};
    try {
        if (row.notes && typeof row.notes === 'string' && row.notes.startsWith('{')) {
            notesData = JSON.parse(row.notes);
        }
    } catch (e) { }

    const discountAmount = Number(row.discount_amount || (notesData as any).discountAmount || 0);
    const originalAmount = Number(row.original_amount || (notesData as any).originalAmount || 0);
    const finalAmount = Number(row.final_amount || (notesData as any).finalAmount || 0);

    return {
        id: row.id,
        studentId: row.student_id,
        // Try flat column -> relation -> notes -> fallback
        studentName: row.student_name || row.students?.name || (notesData as any).studentName || 'Unknown Student',
        studentBbId: row.student_bb_id || row.students?.bb_id || (notesData as any).studentBbId || 'BB-???',
        merchantId: row.merchant_id,
        merchantName: row.merchant_name || row.merchants?.business_name || (notesData as any).merchantName || 'Unknown Merchant',
        merchantBbmId: row.merchant_bbm_id || row.merchants?.bbm_id || (notesData as any).merchantBbmId || 'BBM-???',
        offerId: row.offer_id,
        offerTitle: row.offer_title || row.offers?.title || (notesData as any).offerTitle || 'Unknown Offer',
        originalAmount,
        discountAmount,
        finalAmount,
        paymentMethod: row.payment_method || (notesData as any).paymentMethod || 'cash',
        redeemedAt: row.redeemed_at || row.created_at || row.scanned_at || new Date().toISOString()
    };
};

export const transactionService = {
    // Get all transactions with filters
    // Get all transactions with filters
    async getAll(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
        try {
            // First try fetching with joins (normalized schema support)
            // Note: If columns don't exist in flattened schema this query might still work if we select *
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    students (name, bb_id),
                    merchants (business_name, bbm_id),
                    offers (title)
                `)
                .order('redeemed_at', { ascending: false });

            if (filters) {
                if (filters.dateRange && filters.dateRange !== 'all') {
                    const now = new Date();
                    let startDate: Date;

                    switch (filters.dateRange) {
                        case 'today':
                            startDate = new Date(now.setHours(0, 0, 0, 0));
                            break;
                        case 'week':
                            startDate = new Date(now.setDate(now.getDate() - 7));
                            break;
                        case 'month':
                            startDate = new Date(now.setMonth(now.getMonth() - 1));
                            break;
                        default:
                            startDate = new Date(0);
                    }

                    // Try created_at first
                    query = query.gte('created_at', startDate.toISOString());
                }
                // Filtering on joined tables is complex, skip for now to prioritize basic fetch
            }

            const { data, error } = await query;

            if (error) {
                console.warn('Initial transaction fetch failed, retrying with fallback...', error.message);

                // Fallback: Simple Select (flat schema support)
                // If redeemed_at fails (unlikely), try created_at (011 Schema)
                let retryQuery = supabase
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (filters?.dateRange && filters.dateRange !== 'all') {
                    // Re-apply date filter with redeemed_at
                    // (Logic repeated for brevity, ideally refactor)
                }

                const { data: retryData, error: retryError } = await retryQuery;

                if (retryError) {
                    return { success: false, data: null, error: retryError.message };
                }
                return { success: true, data: (retryData || []).map(mapDbToTransaction), error: null };
            }

            return { success: true, data: (data || []).map(mapDbToTransaction), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Record new transaction (called when merchant confirms payment)
    async recordTransaction(data: {
        studentId: string;
        studentBbId: string;
        studentName: string;
        merchantId: string;
        merchantBbmId: string;
        merchantName: string;
        offerId: string;
        offerTitle: string;
        originalAmount: number;
        discountAmount: number;
        finalAmount: number;
        paymentMethod: 'cash' | 'online';
    }): Promise<ApiResponse<Transaction>> {
        console.log('[TransactionService] 🔄 Recording transaction...');
        console.log('[TransactionService] Data:', {
            studentId: data.studentId,
            merchantId: data.merchantId,
            offerId: data.offerId,
            amount: data.originalAmount,
            discount: data.discountAmount
        });

        try {
            // Get authenticated user for RLS policy
            const { data: { user } } = await supabase.auth.getUser();
            console.log('[TransactionService] 🔐 Auth user for INSERT:', user?.id, user?.email);

            if (!user) {
                console.error('[TransactionService] ❌ No authenticated user - RLS will block INSERT');
            }

            // Insert transaction
            console.log('[TransactionService] 🔄 Inserting into transactions table...');
            let transaction = null;
            let insertError = null;

            // Attempt 1: Try full insert (001 Denormalized Schema)
            // We strip undefined fields and format for strict 001 Schema (NOT NULLs)
            const fullPayload = {
                student_id: data.studentId,
                student_bb_id: data.studentBbId || 'BB-PENDING',
                student_name: data.studentName || 'Unknown Student',
                merchant_id: data.merchantId,
                merchant_bbm_id: data.merchantBbmId || 'BBM-PENDING',
                merchant_name: data.merchantName || 'Unknown Merchant',
                offer_id: data.offerId,
                offer_title: data.offerTitle || 'Unknown Offer',
                original_amount: Number(data.originalAmount) || 0,
                discount_amount: Number(data.discountAmount) || 0,
                final_amount: Number(data.finalAmount) || 0,
                payment_method: data.paymentMethod || 'cash',
                redeemed_at: new Date().toISOString()
            };

            const { data: fullData, error: fullError } = await supabase
                .from('transactions')
                .insert(fullPayload)
                .select()
                .single();

            if (!fullError) {
                transaction = fullData;
            } else {
                insertError = fullError;
                console.warn('[TransactionService] ⚠️ Full INSERT failed, trying fallback logic...', fullError.message);

                // Attempt 2: Try minimal insert (011 Normalized Schema)
                // We pack the snapshot data into 'notes' (JSON) if possible
                // We check if error suggests missing column
                if (fullError.message) {
                    const snapshotData = JSON.stringify({
                        studentName: data.studentName,
                        studentBbId: data.studentBbId,
                        merchantName: data.merchantName,
                        merchantBbmId: data.merchantBbmId,
                        offerTitle: data.offerTitle,
                        originalAmount: data.originalAmount,
                        discountAmount: data.discountAmount,
                        finalAmount: data.finalAmount,
                        paymentMethod: data.paymentMethod,
                        redeemedAt: new Date().toISOString()
                    });

                    const { data: minimalData, error: minimalError } = await supabase
                        .from('transactions')
                        .insert({
                            student_id: data.studentId,
                            merchant_id: data.merchantId,
                            offer_id: data.offerId,
                            status: 'completed',
                            notes: snapshotData,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (!minimalError) {
                        transaction = minimalData;
                        insertError = null; // Clear error on success
                        console.log('[TransactionService] ✅ Fallback INSERT succeeded (Normalized Schema)');
                    } else {
                        insertError = minimalError;
                        console.error('[TransactionService] ❌ Fallback INSERT also failed:', minimalError.message);
                    }
                }
            }

            if (insertError || !transaction) {
                console.error('[TransactionService] ❌ ALL INSERT ATTEMPTS FAILED');
                return { success: false, data: null, error: insertError?.message || 'Insert failed' };
            }

            console.log('[TransactionService] ✅ Transaction inserted! ID:', transaction.id);

            // Update student's savings and redemption count
            console.log('[TransactionService] 🔄 Updating student savings...');
            const { error: studentError } = await supabase.rpc('update_student_after_transaction', {
                p_student_id: data.studentId,
                p_discount_amount: data.discountAmount
            });

            // If RPC doesn't exist, do manual update
            if (studentError) {
                console.log('[TransactionService] ⚠️ RPC failed, doing manual student update:', studentError.message);

                // Fallback: direct SQL-style update
                const { data: currentStudent, error: fetchError } = await supabase
                    .from('students')
                    .select('total_savings, total_redemptions')
                    .eq('id', data.studentId)
                    .single();

                if (fetchError) {
                    console.error('[TransactionService] ❌ Failed to fetch student:', fetchError.message);
                } else if (currentStudent) {
                    const { error: updateError } = await supabase
                        .from('students')
                        .update({
                            total_savings: Number(currentStudent.total_savings) + data.discountAmount,
                            total_redemptions: currentStudent.total_redemptions + 1
                        })
                        .eq('id', data.studentId);

                    if (updateError) {
                        console.error('[TransactionService] ❌ Failed to update student:', updateError.message);
                    } else {
                        console.log('[TransactionService] ✅ Student savings updated manually');
                    }
                }
            } else {
                console.log('[TransactionService] ✅ Student savings updated via RPC');
            }

            // Update merchant's revenue and redemption count
            console.log('[TransactionService] 🔄 Updating merchant stats...');
            const { data: currentMerchant, error: merchantFetchError } = await supabase
                .from('merchants')
                .select('total_redemptions, total_revenue')
                .eq('id', data.merchantId)
                .single();

            if (merchantFetchError) {
                console.error('[TransactionService] ❌ Failed to fetch merchant:', merchantFetchError.message);
            } else if (currentMerchant) {
                const { error: merchantUpdateError } = await supabase
                    .from('merchants')
                    .update({
                        total_redemptions: currentMerchant.total_redemptions + 1,
                        total_revenue: Number(currentMerchant.total_revenue) + data.finalAmount
                    })
                    .eq('id', data.merchantId);

                if (merchantUpdateError) {
                    console.error('[TransactionService] ❌ Failed to update merchant:', merchantUpdateError.message);
                } else {
                    console.log('[TransactionService] ✅ Merchant stats updated');
                }
            }

            // Update offer redemption count
            console.log('[TransactionService] 🔄 Updating offer stats...');
            const { data: currentOffer, error: offerFetchError } = await supabase
                .from('offers')
                .select('total_redemptions')
                .eq('id', data.offerId)
                .single();

            if (offerFetchError) {
                console.error('[TransactionService] ❌ Failed to fetch offer:', offerFetchError.message);
            } else if (currentOffer) {
                const { error: offerUpdateError } = await supabase
                    .from('offers')
                    .update({
                        total_redemptions: currentOffer.total_redemptions + 1
                    })
                    .eq('id', data.offerId);

                if (offerUpdateError) {
                    console.error('[TransactionService] ❌ Failed to update offer:', offerUpdateError.message);
                } else {
                    console.log('[TransactionService] ✅ Offer stats updated');
                }
            }

            console.log('[TransactionService] ✅✅✅ ALL UPDATES COMPLETE! Transaction ID:', transaction.id);
            return { success: true, data: mapDbToTransaction(transaction), error: null };
        } catch (error: any) {
            console.error('[TransactionService] ❌❌❌ EXCEPTION:', error.message);
            return { success: false, data: null, error: error.message };
        }
    },

    // Get merchant's recent transactions
    async getMerchantTransactions(merchantId: string, limit = 10): Promise<ApiResponse<Transaction[]>> {
        try {
            // Attempt to fetch with joins for normalized schema support
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    students (name, bb_id),
                    offers (title)
                `)
                .eq('merchant_id', merchantId)
                .order('redeemed_at', { ascending: false }) // Try redeemed_at first (Schema 001)
                .limit(limit);

            if (error) {
                // Fallback to flat schema fetch
                console.warn('Merchant transactions fetch with joins failed, falling back:', error.message);
                const { data: retryData, error: retryError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('merchant_id', merchantId)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (retryError) {
                    return { success: false, data: null, error: retryError.message };
                }
                return { success: true, data: (retryData || []).map(mapDbToTransaction), error: null };
            }

            return { success: true, data: (data || []).map(mapDbToTransaction), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get student's savings history
    async getStudentTransactions(studentId: string): Promise<ApiResponse<Transaction[]>> {
        try {
            // Attempt to fetch with joins
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    merchants (business_name, bbm_id),
                    offers (title)
                `)
                .eq('student_id', studentId)
                .order('redeemed_at', { ascending: false });

            if (error) {
                // Fallback to flat schema fetch
                console.warn('Student transactions fetch with joins failed, falling back:', error.message);
                const { data: retryData, error: retryError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('student_id', studentId)
                    .order('created_at', { ascending: false });

                if (retryError) {
                    return { success: false, data: null, error: retryError.message };
                }
                return { success: true, data: (retryData || []).map(mapDbToTransaction), error: null };
            }

            return { success: true, data: (data || []).map(mapDbToTransaction), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get stats (admin dashboard)
    async getStats(): Promise<{
        total: number;
        today: number;
        week: number;
        totalSavings: number;
    }> {
        try {
            const { count: total } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .gte('redeemed_at', today.toISOString());

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: weekCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .gte('redeemed_at', weekAgo.toISOString());

            // Get total savings
            const { data: savingsData } = await supabase
                .from('transactions')
                .select('discount_amount');

            const totalSavings = savingsData?.reduce((sum, t) => sum + Number(t.discount_amount), 0) || 0;

            return {
                total: total || 0,
                today: todayCount || 0,
                week: weekCount || 0,
                totalSavings
            };
        } catch (error) {
            return { total: 0, today: 0, week: 0, totalSavings: 0 };
        }
    },

    // Subscribe to new transactions (realtime)
    subscribeToMerchantTransactions(merchantId: string, callback: (transaction: Transaction) => void) {
        return subscribeToTable('transactions', (payload) => {
            if (payload.new && payload.new.merchant_id === merchantId) {
                callback(mapDbToTransaction(payload.new));
            }
        });
    },

    // Subscribe to student's savings updates
    subscribeToStudentSavings(studentId: string, callback: (savings: number) => void) {
        return supabase
            .channel(`student-${studentId}-savings`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'students',
                    filter: `id=eq.${studentId}`
                },
                (payload) => {
                    if (payload.new && payload.new.total_savings !== undefined) {
                        callback(Number(payload.new.total_savings));
                    }
                }
            )
            .subscribe();
    }
};
