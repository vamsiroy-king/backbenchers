// Offer Service - Supabase CRUD operations for offers

import { supabase } from '../supabase';
import { Offer, OfferFilters, ApiResponse } from '../types';

// Map database row to frontend Offer type
const mapDbToOffer = (row: any): Offer => ({
    id: row.id,
    merchantId: row.merchant_id,
    merchantName: row.merchant_name,
    merchantBbmId: row.merchant_bbm_id,
    title: row.title,
    description: row.description,
    type: row.type,
    discountValue: Number(row.discount_value),
    originalPrice: Number(row.original_price),
    finalPrice: Number(row.final_price),
    discountAmount: Number(row.discount_amount),
    minPurchase: row.min_order_value ? Number(row.min_order_value) : undefined,
    maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    terms: row.terms ? (Array.isArray(row.terms) ? row.terms.join('\n') : row.terms) : undefined,
    status: row.status,
    totalRedemptions: row.total_redemptions || 0,
    createdAt: row.created_at,
    freeItemName: row.free_item_name,
    // Creator tracking
    createdByType: row.created_by_type || 'merchant',
    createdById: row.created_by_id
});

export const offerService = {
    // Get all offers with filters
    async getAll(filters?: OfferFilters): Promise<ApiResponse<Offer[]>> {
        try {
            let query = supabase
                .from('offers')
                .select(`
                    *,
                    merchants!inner (business_name, bbm_id, status, state, city)
                `)
                // CRITICAL: Only show offers from APPROVED merchants in student app
                .eq('merchants.status', 'approved')
                // Only show active offers
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (filters) {
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                if (filters.merchantId) {
                    query = query.eq('merchant_id', filters.merchantId);
                }
                if (filters.bbmIdSearch) {
                    query = query.ilike('merchants.bbm_id', `%${filters.bbmIdSearch}%`);
                }
                if (filters.merchantBbmId) {
                    query = query.eq('merchants.bbm_id', filters.merchantBbmId);
                }
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,merchants.business_name.ilike.%${filters.search}%`);
                }
                // Filter by merchant state
                if (filters.state && filters.state !== 'All States') {
                    query = query.eq('merchants.state', filters.state);
                }
                // Filter by merchant city
                if (filters.city && filters.city !== 'All Cities') {
                    query = query.eq('merchants.city', filters.city);
                }
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const offers = data.map((row: any) => ({
                ...mapDbToOffer(row),
                merchantName: row.merchants?.business_name,
                merchantBbmId: row.merchants?.bbm_id,
                merchantState: row.merchants?.state,
                merchantCity: row.merchants?.city
            }));

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get active offers for students (explore page)
    async getActiveOffers(): Promise<ApiResponse<Offer[]>> {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    merchants!inner (id, business_name, bbm_id, logo_url, category, city, status)
                `)
                .eq('status', 'active')
                .eq('merchants.status', 'approved') // ONLY approved merchants shown to students
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const offers = data.map((row: any) => ({
                ...mapDbToOffer(row),
                merchantName: row.merchants?.business_name,
                merchantBbmId: row.merchants?.bbm_id,
                merchantLogo: row.merchants?.logo_url,
                merchantCategory: row.merchants?.category,
                merchantCity: row.merchants?.city
            }));

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get active offers filtered by city
    async getOffersByCity(city: string): Promise<ApiResponse<Offer[]>> {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    merchants!inner (id, business_name, bbm_id, logo_url, category, city, status)
                `)
                .eq('status', 'active')
                .eq('merchants.city', city)
                .in('merchants.status', ['approved', 'pending'])
                .order('created_at', { ascending: false });

            if (error) {
                // If error, fallback to all offers
                console.log('[Offers] City filter error, returning all:', error.message);
                return this.getActiveOffers();
            }

            const offers = data.map((row: any) => ({
                ...mapDbToOffer(row),
                merchantName: row.merchants?.business_name,
                merchantBbmId: row.merchants?.bbm_id,
                merchantLogo: row.merchants?.logo_url,
                merchantCategory: row.merchants?.category,
                merchantCity: row.merchants?.city
            }));

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get offers by category
    async getByCategory(category: string): Promise<ApiResponse<Offer[]>> {
        try {
            // Use ILIKE for flexible category matching (e.g., "Food" matches "Food & Beverages")
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    merchants!inner (id, business_name, bbm_id, logo_url, category, city, status)
                `)
                .eq('status', 'active')
                .in('merchants.status', ['approved', 'pending']) // Include pending for testing
                .ilike('merchants.category', `%${category}%`)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const offers = data.map((row: any) => ({
                ...mapDbToOffer(row),
                merchantName: row.merchants?.business_name,
                merchantBbmId: row.merchants?.bbm_id,
                merchantLogo: row.merchants?.logo_url,
                merchantCategory: row.merchants?.category,
                merchantCity: row.merchants?.city
            }));

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get offers for a specific merchant (by merchant ID)
    async getByMerchantId(merchantId: string): Promise<ApiResponse<Offer[]>> {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    merchants!inner (id, business_name, bbm_id, logo_url, category, city)
                `)
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const offers = data.map((row: any) => ({
                ...mapDbToOffer(row),
                merchantName: row.merchants?.business_name,
                merchantBbmId: row.merchants?.bbm_id,
                merchantLogo: row.merchants?.logo_url,
                merchantCategory: row.merchants?.category,
                merchantCity: row.merchants?.city
            }));

            return { success: true, data: offers, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get single offer
    async getById(id: string): Promise<ApiResponse<Offer>> {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    merchants (business_name, bbm_id, logo_url, category, city, address)
                `)
                .eq('id', id)
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const offer = {
                ...mapDbToOffer(data),
                merchantName: data.merchants?.business_name,
                merchantBbmId: data.merchants?.bbm_id
            };

            return { success: true, data: offer, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get merchant's own offers
    async getMyOffers(): Promise<ApiResponse<Offer[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Get merchant ID
            const { data: merchant } = await supabase
                .from('merchants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!merchant) {
                return { success: false, data: null, error: 'Merchant not found' };
            }

            const { data, error } = await supabase
                .from('offers')
                .select('*')
                .eq('merchant_id', merchant.id)
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: data.map(mapDbToOffer), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Create new offer
    async create(offerData: {
        title: string;
        description?: string;
        type: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
        originalPrice: number;
        discountValue: number;
        finalPrice: number;
        discountAmount: number;
        minOrderValue?: number;
        maxDiscount?: number;
        validUntil?: string;
        terms?: string[];
        freeItemName?: string;
    }): Promise<ApiResponse<Offer>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            // Get merchant ID
            const { data: merchant } = await supabase
                .from('merchants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!merchant) {
                return { success: false, data: null, error: 'Merchant not found' };
            }

            const { data, error } = await supabase
                .from('offers')
                .insert({
                    merchant_id: merchant.id,
                    title: offerData.title,
                    description: offerData.description,
                    type: offerData.type,
                    original_price: offerData.originalPrice,
                    discount_value: offerData.discountValue,
                    final_price: offerData.finalPrice,
                    discount_amount: offerData.discountAmount,
                    min_order_value: offerData.minOrderValue,
                    max_discount: offerData.maxDiscount,
                    valid_until: offerData.validUntil,
                    terms: offerData.terms || [],
                    free_item_name: offerData.freeItemName,
                    status: 'active'
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            // Update merchant's offer count
            await supabase.rpc('increment_merchant_offers', { merchant_id: merchant.id });

            return { success: true, data: mapDbToOffer(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Create offer for a specific merchant (used during onboarding)
    async createForMerchant(merchantId: string, offerData: {
        title: string;
        type: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
        discountValue: number;
        originalPrice?: number;
        finalPrice?: number;
        discountAmount?: number;
        minOrderValue?: number;
        freeItemName?: string;
        terms?: string[];
        status?: string;
        validUntil?: string;
    }): Promise<ApiResponse<Offer>> {
        try {
            // Calculate prices if not provided
            const originalPrice = offerData.originalPrice || offerData.minOrderValue || 100;
            let discountAmount = offerData.discountAmount || 0;
            let finalPrice = offerData.finalPrice || 0;

            if (!discountAmount || !finalPrice) {
                if (offerData.type === 'percentage') {
                    discountAmount = (originalPrice * offerData.discountValue) / 100;
                } else if (offerData.type === 'flat') {
                    discountAmount = offerData.discountValue;
                } else if (offerData.type === 'bogo') {
                    discountAmount = originalPrice;
                }
                finalPrice = Math.max(0, originalPrice - discountAmount);
            }

            const { data, error } = await supabase
                .from('offers')
                .insert({
                    merchant_id: merchantId,
                    title: offerData.title,
                    description: `${offerData.type === 'percentage' ? offerData.discountValue + '% OFF' : offerData.type === 'flat' ? '₹' + offerData.discountValue + ' OFF' : 'Special Offer'}`,
                    type: offerData.type,
                    original_price: originalPrice,
                    discount_value: offerData.discountValue,
                    final_price: finalPrice,
                    discount_amount: discountAmount,
                    min_order_value: offerData.minOrderValue || originalPrice,
                    terms: offerData.terms || [],
                    free_item_name: offerData.freeItemName,
                    status: offerData.status || 'pending',
                    valid_until: offerData.validUntil || null
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToOffer(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Update offer
    async update(id: string, offerData: Partial<Offer>): Promise<ApiResponse<Offer>> {
        try {
            const dbData: any = {};
            if (offerData.title) dbData.title = offerData.title;
            if (offerData.description) dbData.description = offerData.description;
            if (offerData.status) dbData.status = offerData.status;
            if (offerData.validUntil) dbData.valid_until = offerData.validUntil;

            const { data, error } = await supabase
                .from('offers')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToOffer(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Toggle offer status
    async toggleStatus(id: string): Promise<ApiResponse<Offer>> {
        try {
            // Get current status
            const { data: current } = await supabase
                .from('offers')
                .select('status')
                .eq('id', id)
                .single();

            const newStatus = current?.status === 'active' ? 'paused' : 'active';

            const { data, error } = await supabase
                .from('offers')
                .update({ status: newStatus })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToOffer(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Delete offer
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('offers')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Get stats (admin dashboard)
    async getStats(): Promise<{
        total: number;
        active: number;
        paused: number;
    }> {
        try {
            const { count: total } = await supabase
                .from('offers')
                .select('*', { count: 'exact', head: true });

            const { count: active } = await supabase
                .from('offers')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: paused } = await supabase
                .from('offers')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'paused');

            return {
                total: total || 0,
                active: active || 0,
                paused: paused || 0
            };
        } catch (error) {
            return { total: 0, active: 0, paused: 0 };
        }
    }
};
