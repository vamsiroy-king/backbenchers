import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface TrendingOffer {
    id: string;
    offerId: string;
    section: 'online' | 'offline';
    position: number;
    createdAt: string;
    // Joined offer data
    offer?: {
        id: string;
        title: string;
        discountValue: number;
        type: string;
        merchantName?: string;
        merchantId: string;
        merchantCity?: string;
    };
}

const transformTrendingOffer = (row: any): TrendingOffer => ({
    id: row.id,
    offerId: row.offer_id,
    section: row.section,
    position: row.position,
    createdAt: row.created_at,
    offer: row.offers ? {
        id: row.offers.id,
        title: row.offers.title,
        discountValue: row.offers.discount_value,
        type: row.offers.type,
        merchantName: row.offers.merchants?.business_name,
        merchantId: row.offers.merchant_id,
        merchantCity: row.offers.merchants?.city,
    } : undefined,
});

export const trendingService = {
    // Get all trending offers
    async getAll(): Promise<ApiResponse<TrendingOffer[]>> {
        try {
            console.log('[Trending] Fetching all trending offers...');
            const { data, error } = await supabase
                .from('trending_offers')
                .select(`
                    *,
                    offers (
                        id,
                        title,
                        discount_value,
                        type,
                        merchant_id,
                        merchants (
                            business_name,
                            city
                        )
                    )
                `)
                .order('position', { ascending: true });

            if (error) {
                console.error('[Trending] Error fetching:', error);
                return { success: false, data: null, error: error.message };
            }

            console.log('[Trending] Fetched:', data?.length, 'offers');
            return {
                success: true,
                data: (data || []).map(transformTrendingOffer),
                error: null
            };
        } catch (error: any) {
            console.error('[Trending] Exception:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    // Get trending by section
    async getBySection(section: 'online' | 'offline'): Promise<ApiResponse<TrendingOffer[]>> {
        try {
            const { data, error } = await supabase
                .from('trending_offers')
                .select(`
                    *,
                    offers (
                        id,
                        title,
                        discount_value,
                        type,
                        merchant_id,
                        merchants (
                            business_name,
                            city
                        )
                    )
                `)
                .eq('section', section)
                .order('position', { ascending: true });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformTrendingOffer),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Add offer to trending
    async add(offerId: string, section: 'online' | 'offline', position: number): Promise<ApiResponse<TrendingOffer>> {
        try {
            const { data, error } = await supabase
                .from('trending_offers')
                .insert({
                    offer_id: offerId,
                    section,
                    position,
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: transformTrendingOffer(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Remove from trending
    async remove(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('trending_offers')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Save all trending offers (replace all)
    async saveAll(offers: { offerId: string; section: 'online' | 'offline'; position: number }[]): Promise<ApiResponse<void>> {
        try {
            console.log('[Trending] Saving', offers.length, 'offers...');

            // First, get all existing IDs
            const { data: existing } = await supabase
                .from('trending_offers')
                .select('id');

            // Delete each existing entry
            if (existing && existing.length > 0) {
                console.log('[Trending] Deleting', existing.length, 'existing entries...');
                for (const item of existing) {
                    await supabase.from('trending_offers').delete().eq('id', item.id);
                }
            }

            // Insert new entries
            if (offers.length > 0) {
                console.log('[Trending] Inserting new entries...');
                const { data, error } = await supabase
                    .from('trending_offers')
                    .insert(offers.map(o => ({
                        offer_id: o.offerId,
                        section: o.section,
                        position: o.position,
                    })))
                    .select();

                if (error) {
                    console.error('[Trending] Insert error:', error);
                    return { success: false, data: null, error: error.message };
                }

                console.log('[Trending] Inserted:', data?.length, 'entries');
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            console.error('[Trending] Exception in saveAll:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    // Update positions
    async updatePositions(positions: { id: string; position: number }[]): Promise<ApiResponse<void>> {
        try {
            for (const item of positions) {
                await supabase
                    .from('trending_offers')
                    .update({ position: item.position })
                    .eq('id', item.id);
            }
            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
