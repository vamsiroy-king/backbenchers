// Favorites/Saved Service - Real-time save/unsave for merchants and offers

import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface Favorite {
    id: string;
    userId: string;
    merchantId?: string;
    offerId?: string;
    createdAt: string;
    // Joined data
    merchant?: {
        id: string;
        businessName: string;
        logo: string;
        category: string;
        city: string;
    };
    offer?: {
        id: string;
        title: string;
        discountValue: number;
        type: string;
        merchantId: string;
        merchantName?: string;
    };
}

const transformFavorite = (row: any): Favorite => ({
    id: row.id,
    userId: row.user_id,
    merchantId: row.merchant_id,
    offerId: row.offer_id,
    createdAt: row.created_at,
    merchant: row.merchants ? {
        id: row.merchants.id,
        businessName: row.merchants.business_name,
        logo: row.merchants.logo_url,
        category: row.merchants.category,
        city: row.merchants.city,
    } : undefined,
    offer: row.offers ? {
        id: row.offers.id,
        title: row.offers.title,
        discountValue: row.offers.discount_value,
        type: row.offers.type,
        merchantId: row.offers.merchant_id,
        merchantName: row.offers.merchants?.business_name,
    } : undefined,
});

export const favoritesService = {
    // Get all saved items for current user
    async getAll(): Promise<ApiResponse<Favorite[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    merchants (id, business_name, logo_url, category, city),
                    offers (
                        id, title, discount_value, type, merchant_id,
                        merchants (business_name)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: (data || []).map(transformFavorite), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Check if merchant is saved
    async isMerchantSaved(merchantId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('merchant_id', merchantId)
                .single();

            return !!data;
        } catch {
            return false;
        }
    },

    // Check if offer is saved
    async isOfferSaved(offerId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('offer_id', offerId)
                .single();

            return !!data;
        } catch {
            return false;
        }
    },

    // Get saved status for multiple offers (for list views)
    async getSavedOfferIds(): Promise<string[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data } = await supabase
                .from('favorites')
                .select('offer_id')
                .eq('user_id', user.id)
                .not('offer_id', 'is', null);

            return (data || []).map(f => f.offer_id).filter(Boolean);
        } catch {
            return [];
        }
    },

    // Toggle save merchant
    async toggleMerchant(merchantId: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Check if already saved
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('merchant_id', merchantId)
                .single();

            if (existing) {
                // Unsave
                await supabase.from('favorites').delete().eq('id', existing.id);
                return { success: true, data: false, error: null }; // false = unsaved
            } else {
                // Save
                await supabase.from('favorites').insert({
                    user_id: user.id,
                    merchant_id: merchantId,
                });
                return { success: true, data: true, error: null }; // true = saved
            }
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Toggle save offer
    async toggleOffer(offerId: string): Promise<ApiResponse<boolean>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Check if already saved
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('offer_id', offerId)
                .single();

            if (existing) {
                // Unsave
                await supabase.from('favorites').delete().eq('id', existing.id);
                return { success: true, data: false, error: null };
            } else {
                // Save
                await supabase.from('favorites').insert({
                    user_id: user.id,
                    offer_id: offerId,
                });
                return { success: true, data: true, error: null };
            }
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Remove saved item
    async remove(favoriteId: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('id', favoriteId);

            if (error) {
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Get saved merchants only
    async getSavedMerchants(): Promise<ApiResponse<Favorite[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    merchants (id, business_name, logo_url, category, city)
                `)
                .eq('user_id', user.id)
                .not('merchant_id', 'is', null)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: (data || []).map(transformFavorite), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get saved offers only
    async getSavedOffers(): Promise<ApiResponse<Favorite[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    offers (
                        id, title, discount_value, type, merchant_id,
                        merchants (business_name, logo_url)
                    )
                `)
                .eq('user_id', user.id)
                .not('offer_id', 'is', null)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: (data || []).map(transformFavorite), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
