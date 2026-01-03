// Transaction Service - Supabase operations for transactions

import { supabase, subscribeToTable } from '../supabase';
import { Transaction, TransactionFilters, ApiResponse } from '../types';

// Map database row to frontend Transaction type
const mapDbToTransaction = (row: any): Transaction => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentBbId: row.student_bb_id,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name,
    merchantBbmId: row.merchant_bbm_id,
    offerId: row.offer_id,
    offerTitle: row.offer_title,
    originalAmount: Number(row.original_amount),
    discountAmount: Number(row.discount_amount),
    finalAmount: Number(row.final_amount),
    paymentMethod: row.payment_method,
    redeemedAt: row.redeemed_at
});

export const transactionService = {
    // Get all transactions with filters
    async getAll(filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
        try {
            let query = supabase
                .from('transactions')
                .select('*')
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

                    query = query.gte('redeemed_at', startDate.toISOString());
                }
                if (filters.studentBbId) {
                    query = query.ilike('student_bb_id', `%${filters.studentBbId}%`);
                }
                if (filters.merchantBbmId) {
                    query = query.ilike('merchant_bbm_id', `%${filters.merchantBbmId}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data.map(mapDbToTransaction), error: null };
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
            const { data: transaction, error } = await supabase
                .from('transactions')
                .insert({
                    student_id: data.studentId,
                    student_bb_id: data.studentBbId,
                    student_name: data.studentName,
                    merchant_id: data.merchantId,
                    merchant_bbm_id: data.merchantBbmId,
                    merchant_name: data.merchantName,
                    offer_id: data.offerId,
                    offer_title: data.offerTitle,
                    original_amount: data.originalAmount,
                    discount_amount: data.discountAmount,
                    final_amount: data.finalAmount,
                    payment_method: data.paymentMethod,
                    redeemed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('[TransactionService] ❌ INSERT FAILED:', error.message, error.code, error.details);
                return { success: false, data: null, error: error.message };
            }

            console.log('[TransactionService] ✅ Transaction inserted! ID:', transaction.id);

            // Update student's savings and redemption count
            const { error: studentError } = await supabase.rpc('update_student_after_transaction', {
                p_student_id: data.studentId,
                p_discount_amount: data.discountAmount
            });

            // If RPC doesn't exist, do manual update
            if (studentError) {
                await supabase
                    .from('students')
                    .update({
                        total_savings: supabase.rpc('increment_savings', { amount: data.discountAmount }),
                        total_redemptions: supabase.rpc('increment_redemptions')
                    })
                    .eq('id', data.studentId);

                // Fallback: direct SQL-style update
                const { data: currentStudent } = await supabase
                    .from('students')
                    .select('total_savings, total_redemptions')
                    .eq('id', data.studentId)
                    .single();

                if (currentStudent) {
                    await supabase
                        .from('students')
                        .update({
                            total_savings: Number(currentStudent.total_savings) + data.discountAmount,
                            total_redemptions: currentStudent.total_redemptions + 1
                        })
                        .eq('id', data.studentId);
                }
            }

            // Update merchant's revenue and redemption count
            const { data: currentMerchant } = await supabase
                .from('merchants')
                .select('total_redemptions, total_revenue')
                .eq('id', data.merchantId)
                .single();

            if (currentMerchant) {
                await supabase
                    .from('merchants')
                    .update({
                        total_redemptions: currentMerchant.total_redemptions + 1,
                        total_revenue: Number(currentMerchant.total_revenue) + data.finalAmount
                    })
                    .eq('id', data.merchantId);
            }

            // Update offer redemption count
            const { data: currentOffer } = await supabase
                .from('offers')
                .select('total_redemptions')
                .eq('id', data.offerId)
                .single();

            if (currentOffer) {
                await supabase
                    .from('offers')
                    .update({
                        total_redemptions: currentOffer.total_redemptions + 1
                    })
                    .eq('id', data.offerId);
            }

            return { success: true, data: mapDbToTransaction(transaction), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get merchant's recent transactions
    async getMerchantTransactions(merchantId: string, limit = 10): Promise<ApiResponse<Transaction[]>> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('redeemed_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data.map(mapDbToTransaction), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get student's savings history
    async getStudentTransactions(studentId: string): Promise<ApiResponse<Transaction[]>> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('student_id', studentId)
                .order('redeemed_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data.map(mapDbToTransaction), error: null };
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
