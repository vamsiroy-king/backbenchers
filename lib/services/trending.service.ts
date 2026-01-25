import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface TrendingOffer {
    id: string;
    offerId: string;
    section: 'online' | 'offline';
    position: number;
    createdAt: string;
    // Joined offer data
    // Joined offer data
    offer?: {
        id: string;
        title: string;
        discountValue: number;
        type: string;
        merchantName?: string;
        merchantId: string;
        merchantCity?: string;
        merchantLogo?: string;
    };
}

const transformTrendingOffer = (row: any): TrendingOffer => {
    // Check if it's an online offer (New System)
    if (row.online_offers) {
        // Try to find discount in title if not present
        const extractDiscount = (title: string): number => {
            const text = title.toLowerCase();
            const percentMatch = text.match(/(\d+)\s*%/);
            if (percentMatch) return parseInt(percentMatch[1]);
            const amountMatch = text.match(/(?:rs\.?|₹)\s*(\d+)/);
            if (amountMatch) return parseInt(amountMatch[1]);
            const flatMatch = text.match(/flat\s*(\d+)/);
            if (flatMatch) return parseInt(flatMatch[1]);
            return 0; // Fallback
        };

        const discountVal = extractDiscount(row.online_offers.title);

        return {
            id: row.id,
            offerId: row.online_offer_id,
            section: row.section || 'online',
            position: row.position,
            createdAt: row.created_at,
            offer: {
                id: row.online_offers.id,
                title: row.online_offers.title,
                discountValue: discountVal > 0 ? discountVal : (row.online_offers.title.includes('Free') ? 100 : 0),
                type: 'online_coupon',
                merchantName: row.online_offers.brand?.name || 'Online Brand',
                merchantId: row.online_offers.brand_id,
                merchantCity: 'Online',
                merchantLogo: row.online_offers.brand?.logo_url,
            }
        };
    }

    // Offline offer
    if (row.offers) {
        return {
            id: row.id,
            offerId: row.offer_id,
            section: row.section || 'offline',
            position: row.position,
            createdAt: row.created_at,
            offer: {
                id: row.offers.id,
                title: row.offers.title,
                discountValue: row.offers.discount_value || 0,
                type: row.offers.type,
                merchantName: row.offers.merchants?.business_name,
                merchantId: row.offers.merchant_id,
                merchantCity: row.offers.merchants?.city,
                merchantLogo: row.offers.merchants?.logo_url,
            }
        };
    }

    // Fallback for broken/missing relations
    return {
        id: row.id,
        offerId: 'missing',
        section: 'offline',
        position: row.position,
        createdAt: row.created_at,
        offer: undefined
    };
};

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
                            city,
                            logo_url
                        )
                    ),
                    online_offers (
                        id,
                        title,
                        code,
                        brand_id,
                        brand:online_brands (
                            name,
                            logo_url
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
                            city,
                            logo_url
                        )
                    ),
                    online_offers (
                        id,
                        title,
                        code,
                        brand_id,
                        brand:online_brands (
                            name,
                            logo_url
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
            const payload: any = {
                section,
                position,
            };

            if (section === 'online') {
                payload.online_offer_id = offerId;
                payload.offer_id = null; // Explicitly null
            } else {
                payload.offer_id = offerId;
                payload.online_offer_id = null;
            }

            const { data, error } = await supabase
                .from('trending_offers')
                .insert(payload)
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
                const payload = offers.map(o => ({
                    offer_id: o.section === 'offline' ? o.offerId : null,
                    online_offer_id: o.section === 'online' ? o.offerId : null,
                    section: o.section,
                    position: o.position,
                }));

                const { data, error } = await supabase
                    .from('trending_offers')
                    .insert(payload)
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

    // Get merged trending: admin picks FIRST, then fill with top redemptions (up to 10)
    async getMergedTrending(
        section: 'online' | 'offline',
        maxTotal: number = 10,
        studentCity?: string,
        studentState?: string
    ): Promise<{
        id: string;
        title: string;
        discountValue: number;
        type: string;
        merchantName?: string;
        merchantId: string;
        merchantCity?: string;
        isAdminPick: boolean;
        merchantLogo?: string;
        avgRating?: number;
        totalRatings?: number;
    }[]> {
        try {
            // 1. Get admin picks first
            const adminResult = await this.getBySection(section);
            const adminOffers = (adminResult.data || [])
                .filter(t => t.offer)
                .map(t => ({
                    id: t.offer!.id,
                    title: t.offer!.title,
                    discountValue: t.offer!.discountValue,
                    type: t.offer!.type,
                    merchantName: t.offer!.merchantName,
                    merchantId: t.offer!.merchantId,
                    merchantCity: t.offer!.merchantCity,
                    isAdminPick: true,
                }));

            // If admin picks already fill the limit, return them
            if (adminOffers.length >= maxTotal) {
                return adminOffers.slice(0, maxTotal);
            }

            const slotsRemaining = maxTotal - adminOffers.length;
            let algoOffers: any[] = [];

            if (section === 'online') {
                // ONLINE: Fetch from BOTH 'offers' (legacy online) AND 'online_offers' (new)

                // A. New Online Offers (Fetch active ones)
                const { data: newOnlineData, error: newOnlineError } = await supabase
                    .from('online_offers')
                    .select('id, title, code, link, brand_id, location_scope, location_values')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(slotsRemaining + 20);

                if (newOnlineError) {
                    console.error('[Trending] online_offers query error:', newOnlineError);
                }

                // Fetch brand details separately if we have offers
                let brandMap: Record<string, { name: string; logo_url: string | null; rating?: number }> = {};
                const brandIds = [...new Set((newOnlineData || []).map((o: any) => o.brand_id).filter(Boolean))];
                if (brandIds.length > 0) {
                    const { data: brandsData } = await supabase
                        .from('online_brands')
                        // Join with trending columns for sorting
                        .select('id, name, logo_url, average_rating, category, trending_score, is_trending_override')
                        .in('id', brandIds);
                    (brandsData || []).forEach((b: any) => {
                        brandMap[b.id] = { name: b.name, logo_url: b.logo_url, rating: b.average_rating };
                    });
                }

                // Filter by Location
                const filteredNewOffers = (newOnlineData || []).filter((o: any) => {
                    const scope = (o.location_scope || 'PAN_INDIA').toUpperCase();
                    const values = o.location_values || [];

                    if (scope === 'PAN_INDIA') return true;

                    if ((scope === 'STATE' || scope === 'STATES') && studentState) {
                        return values.some((v: string) => v.trim().toLowerCase() === studentState.toLowerCase());
                    }

                    if ((scope === 'CITY' || scope === 'CITIES') && studentCity) {
                        return values.some((v: string) => v.trim().toLowerCase() === studentCity.trim().toLowerCase());
                    }

                    // If no student location provided, show only PAN_INDIA
                    return false;
                });

                const extractDiscount = (title: string, desc?: string): number => {
                    const text = (title + ' ' + (desc || '')).toLowerCase();
                    const percentMatch = text.match(/(\d+)\s*%/);
                    if (percentMatch) return parseInt(percentMatch[1]);
                    const amountMatch = text.match(/(?:rs\.?|₹)\s*(\d+)/);
                    if (amountMatch) return parseInt(amountMatch[1]);
                    const flatMatch = text.match(/flat\s*(\d+)/);
                    if (flatMatch) return parseInt(flatMatch[1]);
                    return 0;
                };

                const newMapped = filteredNewOffers.map((o: any) => {
                    const brand = brandMap[o.brand_id] || { name: 'Online Brand', logo_url: null };
                    const discountVal = extractDiscount(o.title, o.link);

                    return {
                        id: o.id,
                        title: o.title,
                        // Ensure valid fallback if 0
                        discountValue: discountVal > 0 ? discountVal : (o.title?.toLowerCase().includes('free') ? 100 : 0),
                        type: 'coupon', // Default type for coupon-based offers
                        merchantName: brand.name,
                        merchantId: o.brand_id, // Use brand_id as merchantId
                        merchantCity: 'Online',
                        merchantLogo: brand.logo_url,
                        isAdminPick: false,
                        isNewSystem: true,
                        // Default to 0 if no rating column exists yet for online brands
                        avgRating: brand.rating || 0,
                        totalRatings: 0
                    };
                });

                // B. Legacy Online Offers (if any)
                const { data: legacyOnlineData } = await supabase
                    .from('offers')
                    .select(`
                        id, title, discount_value, type, merchant_id,
                        merchants!inner (business_name, city, online_store, status, average_rating, total_ratings)
                    `)
                    .eq('status', 'active')
                    .eq('merchants.status', 'approved')
                    .eq('merchants.online_store', true)
                    .order('created_at', { ascending: false })
                    .limit(slotsRemaining);

                const legacyMapped = (legacyOnlineData || []).map((o: any) => ({
                    id: o.id,
                    title: o.title,
                    discountValue: o.discount_value,
                    type: o.type,
                    merchantName: o.merchants?.business_name,
                    merchantId: o.merchant_id,
                    merchantCity: o.merchants?.city,
                    isAdminPick: false,
                    avgRating: o.merchants?.average_rating,
                    totalRatings: o.merchants?.total_ratings
                }));

                // Merge New + Legacy
                algoOffers = [...newMapped, ...legacyMapped];

            } else {
                // OFFLINE: Fetch from 'offers' using NEW trending_score logic
                const { data: offlineData } = await supabase
                    .from('offers')
                    .select(`
                        id, title, discount_value, type, merchant_id,
                        merchants!inner (business_name, city, online_store, status, trending_score, is_trending_override, logo_url, average_rating, total_ratings)
                    `)
                    .eq('status', 'active')
                    .eq('merchants.status', 'approved')
                    .eq('merchants.online_store', false)
                    // ORDER BY: 1. Manual Override, 2. Trending Score, 3. Redemptions
                    .order('merchants(is_trending_override)', { ascending: false })
                    .order('merchants(trending_score)', { ascending: false })
                    .limit(slotsRemaining);

                algoOffers = (offlineData || []).map((o: any) => ({
                    id: o.id,
                    title: o.title,
                    discountValue: o.discount_value,
                    type: o.type,
                    merchantName: o.merchants?.business_name,
                    merchantId: o.merchant_id,
                    merchantCity: o.merchants?.city,
                    merchantLogo: o.merchants?.logo_url,
                    isAdminPick: false,
                    avgRating: o.merchants?.average_rating,
                    totalRatings: o.merchants?.total_ratings
                }));
            }

            const adminOfferIds = new Set(adminOffers.map(o => o.id));
            const uniqueAlgoOffers = algoOffers
                .filter(o => !adminOfferIds.has(o.id))
                .slice(0, slotsRemaining);

            // 3. Merge: admin first, then algorithm
            const merged = [...adminOffers, ...uniqueAlgoOffers];
            return merged;
        } catch (error) {
            console.error('[Trending] getMergedTrending error:', error);
            return [];
        }
    },
};
