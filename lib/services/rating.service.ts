// Rating Service - Supabase operations for merchant ratings and reviews

import { supabase } from '../supabase';
import { ApiResponse } from '../types';

export interface Rating {
    id: string;
    studentId: string;
    studentName?: string;
    merchantId: string;
    transactionId?: string;
    stars: number;
    reviewText?: string;
    createdAt: string;
}

export interface MerchantRatingStats {
    avgRating: number;
    totalReviews: number;
}

// Map database row to Rating type
function mapDbToRating(row: any): Rating {
    return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.students?.name,
        merchantId: row.merchant_id,
        transactionId: row.transaction_id,
        stars: row.stars,
        reviewText: row.review_text,
        createdAt: row.created_at
    };
}

export const ratingService = {
    // Submit a rating after redemption
    async submitRating(data: {
        studentId: string;
        merchantId: string;
        transactionId: string;
        stars: number;
        reviewText?: string;
    }): Promise<ApiResponse<Rating>> {
        try {
            const { data: rating, error } = await supabase
                .from('ratings')
                .insert({
                    student_id: data.studentId,
                    merchant_id: data.merchantId,
                    transaction_id: data.transactionId,
                    stars: data.stars,
                    review_text: data.reviewText || null
                })
                .select()
                .single();

            if (error) {
                // Handle duplicate rating
                if (error.code === '23505') {
                    return { success: false, data: null, error: 'You have already rated this transaction' };
                }
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToRating(rating), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get all ratings for a merchant
    async getMerchantRatings(merchantId: string, limit = 20): Promise<ApiResponse<Rating[]>> {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select(`
                    *,
                    students (name)
                `)
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data.map(mapDbToRating), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get average rating and total count for a merchant
    async getMerchantRatingStats(merchantId: string): Promise<MerchantRatingStats> {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select('stars')
                .eq('merchant_id', merchantId);

            if (error || !data || data.length === 0) {
                return { avgRating: 0, totalReviews: 0 };
            }

            const total = data.length;
            const sum = data.reduce((acc, r) => acc + r.stars, 0);
            const avg = Math.round((sum / total) * 10) / 10; // Round to 1 decimal

            return { avgRating: avg, totalReviews: total };
        } catch (error) {
            console.error('Error getting rating stats:', error);
            return { avgRating: 0, totalReviews: 0 };
        }
    },

    // Check if student has already rated a transaction
    async hasRatedTransaction(transactionId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select('id')
                .eq('transaction_id', transactionId)
                .maybeSingle();

            return !!data;
        } catch (error) {
            return false;
        }
    },

    // Get rating for a specific transaction
    async getRatingByTransaction(transactionId: string): Promise<Rating | null> {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select(`
                    *,
                    students (name)
                `)
                .eq('transaction_id', transactionId)
                .maybeSingle();

            if (error || !data) {
                return null;
            }

            return mapDbToRating(data);
        } catch (error) {
            return null;
        }
    }
};
