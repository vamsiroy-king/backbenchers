// Favorite Service - CRUD operations for student favorites

import { supabase } from '../supabase';
import { ApiResponse, Offer } from '../types';

export interface Favorite {
    id: string;
    studentId: string;
    offerId: string;
    createdAt: string;
    offer?: Offer;
}

export const favoriteService = {
    // Get all favorites for current student
    async getMyFavorites(): Promise<ApiResponse<Offer[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Get student ID
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) {
                return { success: false, data: null, error: 'Student not found' };
            }

            // Get favorites with offer details
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    id,
                    offer_id,
                    created_at,
                    offers (
                        id,
                        merchant_id,
                        title,
                        description,
                        type,
                        original_price,
                        discount_value,
                        final_price,
                        discount_amount,
                        valid_until,
                        status,
                        total_redemptions,
                        created_at,
                        merchants (
                            id,
                            bbm_id,
                            business_name,
                            logo,
                            category,
                            city
                        )
                    )
                `)
                .eq('student_id', student.id)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            // Map to Offer type
            const offers = data?.map((fav: any) => ({
                id: fav.offers.id,
                merchantId: fav.offers.merchant_id,
                merchantName: fav.offers.merchants?.business_name,
                merchantBbmId: fav.offers.merchants?.bbm_id,
                merchantLogo: fav.offers.merchants?.logo,
                merchantCategory: fav.offers.merchants?.category,
                merchantCity: fav.offers.merchants?.city,
                title: fav.offers.title,
                description: fav.offers.description,
                type: fav.offers.type,
                discountValue: fav.offers.discount_value,
                originalPrice: fav.offers.original_price,
                finalPrice: fav.offers.final_price,
                discountAmount: fav.offers.discount_amount,
                validFrom: fav.offers.created_at,
                validUntil: fav.offers.valid_until,
                status: fav.offers.status,
                totalRedemptions: fav.offers.total_redemptions,
                createdAt: fav.offers.created_at,
            })) || [];

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Check if offer is favorited
    async isFavorite(offerId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return false;

            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('student_id', student.id)
                .eq('offer_id', offerId)
                .single();

            return !!data;
        } catch {
            return false;
        }
    },

    // Get favorite IDs (for batch checking)
    async getFavoriteIds(): Promise<string[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!student) return [];

            const { data } = await supabase
                .from('favorites')
                .select('offer_id')
                .eq('student_id', student.id);

            return data?.map(f => f.offer_id) || [];
        } catch {
            return [];
        }
    },

    // Add to favorites
    async addFavorite(offerId: string): Promise<ApiResponse<void>> {
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

            const { error } = await supabase
                .from('favorites')
                .insert({
                    student_id: student.id,
                    offer_id: offerId
                });

            if (error) {
                // Handle duplicate
                if (error.code === '23505') {
                    return { success: true, data: null, error: null, message: 'Already in favorites' };
                }
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Remove from favorites
    async removeFavorite(offerId: string): Promise<ApiResponse<void>> {
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

            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('student_id', student.id)
                .eq('offer_id', offerId);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Toggle favorite
    async toggleFavorite(offerId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
        const isFav = await this.isFavorite(offerId);

        if (isFav) {
            const result = await this.removeFavorite(offerId);
            if (result.success) {
                return { success: true, data: { isFavorite: false }, error: null };
            }
            return { success: false, data: null, error: result.error };
        } else {
            const result = await this.addFavorite(offerId);
            if (result.success) {
                return { success: true, data: { isFavorite: true }, error: null };
            }
            return { success: false, data: null, error: result.error };
        }
    }
};
