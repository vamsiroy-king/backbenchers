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
                if (error.code === '23505') {
                    return { success: false, data: null, error: 'You have already rated this transaction' };
                }
                return { success: false, data: null, error: error.message };
            }

            // Update Merchant's Average Rating & Total Count
            // We calculate freshly from ratings table to be accurate
            const { count, error: countError } = await supabase
                .from('ratings')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', data.merchantId);

            const { data: ratingData, error: avgError } = await supabase
                .from('ratings')
                .select('stars')
                .eq('merchant_id', data.merchantId);

            if (!countError && !avgError && ratingData) {
                const totalRating = ratingData.reduce((sum, r) => sum + r.stars, 0);
                const average = count ? totalRating / count : 0;

                await supabase
                    .from('merchants')
                    .update({
                        average_rating: average,
                        total_ratings: count
                    })
                    .eq('id', data.merchantId);
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

    // Get average rating and total count for a merchant (now reads from cached columns!)
    async getMerchantRatingStats(merchantId: string): Promise<MerchantRatingStats> {
        try {
            // First try to get from merchants table (fast - cached values)
            const { data: merchant, error } = await supabase
                .from('merchants')
                .select('average_rating, total_ratings')
                .eq('id', merchantId)
                .single();

            if (!error && merchant) {
                return {
                    avgRating: merchant.average_rating || 0,
                    totalReviews: merchant.total_ratings || 0
                };
            }

            // Fallback: calculate from ratings table
            const { data } = await supabase
                .from('ratings')
                .select('stars')
                .eq('merchant_id', merchantId);

            if (!data || data.length === 0) {
                return { avgRating: 0, totalReviews: 0 };
            }

            const total = data.length;
            const sum = data.reduce((acc, r) => acc + r.stars, 0);
            const avg = Math.round((sum / total) * 10) / 10;

            return { avgRating: avg, totalReviews: total };
        } catch (error) {
            console.error('Error getting rating stats:', error);
            return { avgRating: 0, totalReviews: 0 };
        }
    },

    // Get rating breakdown percentages (5★, 4★, 3★, 2★, 1★)
    async getRatingBreakdown(merchantId: string): Promise<{
        star5: number;
        star4: number;
        star3: number;
        star2: number;
        star1: number;
    }> {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select('stars')
                .eq('merchant_id', merchantId);

            if (error || !data || data.length === 0) {
                return { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 };
            }

            const total = data.length;
            const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

            data.forEach(r => {
                if (r.stars >= 1 && r.stars <= 5) {
                    counts[r.stars as keyof typeof counts]++;
                }
            });

            return {
                star5: Math.round((counts[5] / total) * 100),
                star4: Math.round((counts[4] / total) * 100),
                star3: Math.round((counts[3] / total) * 100),
                star2: Math.round((counts[2] / total) * 100),
                star1: Math.round((counts[1] / total) * 100),
            };
        } catch (error) {
            console.error('Error getting rating breakdown:', error);
            return { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 };
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

