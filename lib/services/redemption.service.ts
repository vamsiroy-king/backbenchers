// Redemption Service - Complete transaction tracking and validation

import { supabase } from '../supabase';
import { ApiResponse } from '../types';

export interface Transaction {
    id: string;
    studentId: string;
    offerId: string;
    merchantId: string;
    scannedAt: string;
    status: 'completed' | 'cancelled' | 'failed';
    notes?: string;
    student?: {
        name: string;
        bbmId: string;
        collegeName: string;
    };
    offer?: {
        title: string;
        discountValue: number;
        type: string;
    };
}

export interface RedemptionResult {
    allowed: boolean;
    reason: string;
    remainingUses?: number | null;
    transactionId?: string;
}

export const redemptionService = {
    // Check if student can redeem an offer
    async canRedeem(studentId: string, offerId: string): Promise<RedemptionResult> {
        try {
            const { data, error } = await supabase
                .rpc('can_student_redeem_offer', {
                    p_student_id: studentId,
                    p_offer_id: offerId
                });

            if (error) {
                return { allowed: false, reason: error.message };
            }

            return data as RedemptionResult;
        } catch (error: any) {
            return { allowed: false, reason: error.message };
        }
    },

    // Record a redemption (called by merchant when scanning)
    async recordRedemption(
        studentId: string,
        offerId: string,
        merchantId: string
    ): Promise<RedemptionResult> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .rpc('record_redemption', {
                    p_student_id: studentId,
                    p_offer_id: offerId,
                    p_merchant_id: merchantId,
                    p_scanned_by: user?.id || null
                });

            if (error) {
                return { allowed: false, reason: error.message };
            }

            return data as RedemptionResult;
        } catch (error: any) {
            return { allowed: false, reason: error.message };
        }
    },

    // Get student's transaction history
    async getStudentTransactions(limit = 50): Promise<ApiResponse<Transaction[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) {
                return { success: false, data: null, error: 'Student not found' };
            }

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id,
                    student_id,
                    offer_id,
                    merchant_id,
                    scanned_at,
                    status,
                    notes,
                    offers (
                        title,
                        discount_value,
                        type,
                        merchants (
                            business_name,
                            logo
                        )
                    )
                `)
                .eq('student_id', student.id)
                .order('scanned_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const transactions = data?.map((t: any) => ({
                id: t.id,
                studentId: t.student_id,
                offerId: t.offer_id,
                merchantId: t.merchant_id,
                scannedAt: t.scanned_at,
                status: t.status,
                notes: t.notes,
                offer: {
                    title: t.offers?.title,
                    discountValue: t.offers?.discount_value,
                    type: t.offers?.type,
                    merchantName: t.offers?.merchants?.business_name,
                    merchantLogo: t.offers?.merchants?.logo
                }
            })) || [];

            return { success: true, data: transactions, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get merchant's transaction history (all scans)
    async getMerchantTransactions(limit = 100): Promise<ApiResponse<Transaction[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data: merchant } = await supabase
                .from('merchants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!merchant) {
                return { success: false, data: null, error: 'Merchant not found' };
            }

            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id,
                    student_id,
                    offer_id,
                    merchant_id,
                    scanned_at,
                    status,
                    notes,
                    students (
                        name,
                        bbm_id,
                        college_name
                    ),
                    offers (
                        title,
                        discount_value,
                        type
                    )
                `)
                .eq('merchant_id', merchant.id)
                .order('scanned_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const transactions = data?.map((t: any) => ({
                id: t.id,
                studentId: t.student_id,
                offerId: t.offer_id,
                merchantId: t.merchant_id,
                scannedAt: t.scanned_at,
                status: t.status,
                notes: t.notes,
                student: {
                    name: t.students?.name,
                    bbmId: t.students?.bbm_id,
                    collegeName: t.students?.college_name
                },
                offer: {
                    title: t.offers?.title,
                    discountValue: t.offers?.discount_value,
                    type: t.offers?.type
                }
            })) || [];

            return { success: true, data: transactions, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Find student by BB-ID (for merchant scanner fallback)
    async findStudentByBbmId(bbmId: string): Promise<ApiResponse<{
        id: string;
        name: string;
        collegeName: string;
        bbmId: string;
        photoUrl?: string;
    }>> {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, name, bbm_id, college_name, photo_url')
                .eq('bbm_id', bbmId.toUpperCase())
                .single();

            if (error) {
                return { success: false, data: null, error: 'Student not found with this BB-ID' };
            }

            return {
                success: true,
                data: {
                    id: data.id,
                    name: data.name,
                    collegeName: data.college_name,
                    bbmId: data.bbm_id,
                    photoUrl: data.photo_url
                },
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get redemption count for an offer (for display)
    async getStudentRedemptionCount(studentId: string, offerId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .rpc('get_student_redemption_count', {
                    p_student_id: studentId,
                    p_offer_id: offerId
                });

            if (error) return 0;
            return data || 0;
        } catch {
            return 0;
        }
    }
};
