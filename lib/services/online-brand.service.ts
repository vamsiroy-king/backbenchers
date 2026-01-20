import { supabase } from "@/lib/supabase";
import { OnlineBrand, OnlineOffer } from "@/lib/types";

export const onlineBrandService = {
    // ==================== BRANDS ====================

    /**
     * Get all active online brands, optionally filtered by category and student location.
     * Location filtering logic:
     * - PAN_INDIA offers: Show to ALL students
     * - STATES offers: Only show if student's state is in location_values
     * - CITIES offers: Only show if student's city is in location_values
     * 
     * @param category - Optional category filter (e.g., "Food")
     * @param studentLocation - Optional { city, state } of the student
     */
    async getAllBrands(category?: string, studentLocation?: { city?: string; state?: string }) {
        let query = supabase
            .from('online_brands')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (category) {
            // Use wildcard pattern for partial matching (e.g., "Food" matches "Food & Beverages")
            query = query.ilike('category', `%${category}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const brands = (data || []).map(mapBrandFromDb);

        // If no location filter specified, return all brands
        if (!studentLocation?.city && !studentLocation?.state) {
            return brands;
        }

        // Filter brands that have at least one offer available for this location
        const brandsWithOffers = await Promise.all(
            brands.map(async (brand) => {
                const offers = await this.getOffersForLocation(brand.id, studentLocation);
                return offers.length > 0 ? brand : null;
            })
        );

        const result = brandsWithOffers.filter((b): b is OnlineBrand => b !== null);
        return result;
    },

    /**
     * Get offers for a brand that are available for the student's location.
     * PAN_INDIA offers are always included.
     */
    async getOffersForLocation(brandId: string, studentLocation?: { city?: string; state?: string }) {
        const { data, error } = await supabase
            .from('online_offers')
            .select('*')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const offers = data || [];

        // If no location filter, return all offers
        if (!studentLocation?.city && !studentLocation?.state) {
            return offers.map(mapOfferFromDb);
        }

        // Filter based on location_scope
        const filteredOffers = offers.filter(offer => {
            const scope = (offer.location_scope || 'PAN_INDIA').toUpperCase();
            const locationValues: string[] = offer.location_values || [];

            // PAN_INDIA: Available to everyone - ALWAYS return true
            if (scope === 'PAN_INDIA' || !offer.location_scope) {
                return true;
            }

            // STATES: Check if student's state is in the list
            if ((scope === 'STATES' || scope === 'STATE') && studentLocation.state) {
                return locationValues.some(
                    v => v.toLowerCase() === studentLocation.state!.toLowerCase()
                );
            }

            // CITIES: Check if student's city is in the list (Robust matching)
            if ((scope === 'CITIES' || scope === 'CITY') && studentLocation.city) {
                const match = locationValues.some(
                    v => v.trim().toLowerCase() === studentLocation.city!.trim().toLowerCase()
                );
                return match;
            }

            return false;
        });

        return filteredOffers.map(mapOfferFromDb);
    },

    async getBrandById(id: string) {
        const { data, error } = await supabase
            .from('online_brands')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapBrandFromDb(data);
    },

    async createBrand(brand: Partial<OnlineBrand>) {
        // Map to DB columns (snake_case)
        const dbBrand = {
            name: brand.name,
            category: brand.category,
            logo_url: brand.logoUrl,
            cover_image_url: brand.coverImageUrl,
            description: brand.description,
            website_url: brand.websiteUrl,
            app_url: brand.appUrl, // App deep link
            prefer_app: brand.preferApp ?? false, // Prefer app toggle
            playstore_url: brand.playstoreUrl, // Google Play Store URL
            appstore_url: brand.appstoreUrl, // Apple App Store URL
            is_active: brand.isActive ?? true
        };

        // Use Admin API to bypass RLS (since admin might be in guest mode on localhost)
        // Use origin to support both main domain and admin subdomain
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/admin/online-brands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbBrand)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to create brand');
        }

        return result.data;
    },

    // ==================== OFFERS ====================

    async getOffersByBrandId(brandId: string, includeInactive: boolean = false) {
        let query = supabase
            .from('online_offers')
            .select('*')
            .eq('brand_id', brandId)
            .order('created_at', { ascending: false });

        // Only filter by is_active if not including inactive (for admin views)
        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapOfferFromDb);
    },

    async createOffer(offer: Partial<OnlineOffer>) {
        // Map frontend fields to actual Database columns found in supabase_online_brands.sql
        // Cast to any because frontend form sends camelCase properties that might not be in the strict Type
        const input: any = offer;
        const dbOffer = {
            brand_id: input.brandId,
            title: input.title,
            description: input.description,
            code: input.couponCode || input.code, // Map couponCode or code to code
            link: input.offerLink || input.link,  // Map offerLink or link to link
            expiry_date: input.validUntil, // Map validUntil to expiry_date
            location_scope: input.locationScope || 'PAN_INDIA',
            location_values: input.locationValues || [],
            redemption_type: input.redemptionType || 'CODE_REVEAL',
            is_active: offer.isActive ?? true
        };

        // Use Admin API to bypass RLS
        // Use origin to support both main domain and admin subdomain
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/admin/online-offers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbOffer)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to create offer');
        }

        return mapOfferFromDb(result.data);
    },

    async deleteOffer(offerId: string) {
        const { error } = await supabase
            .from('online_offers')
            .delete()
            .eq('id', offerId);

        if (error) throw error;
    },

    async toggleOfferStatus(offerId: string, isActive: boolean) {
        const { error } = await supabase
            .from('online_offers')
            .update({ is_active: isActive })
            .eq('id', offerId);

        if (error) throw error;
    },

    async uploadImage(file: File, path: 'logo' | 'cover'): Promise<string> {
        const fileExt = file.name.split('.').pop();
        // Use 'merchant-stores' bucket which is guaranteed to exist
        // We use the admin API so we can bypass RLS restrictions
        const uniqueId = Math.random().toString(36).substring(7);
        const fileName = `online-brands/${path}-${Date.now()}-${uniqueId}.${fileExt}`;

        // Prepare FormData for API
        const formData = new FormData();
        formData.append('file', file);
        // CRITICAL FIX: Use the existing bucket
        formData.append('bucket', 'merchant-stores');
        formData.append('path', fileName);

        // Use API Route to bypass Client RLS
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload failed via Admin API');
        }

        return result.url;
    },

    // ==================== TRACKING ====================

    /**
     * Track when a student reveals a coupon code
     */
    async trackReveal(params: {
        studentId?: string;
        offerId: string;
        brandId?: string;
        code: string;
        source?: 'APP' | 'WEBSITE';
        deviceType?: 'MOBILE' | 'DESKTOP';
    }) {
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const response = await fetch(`${baseUrl}/api/tracking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    action: 'reveal'
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Track reveal error:', error);
            return false;
        }
    },

    /**
     * Track copy, click-through, or self-reported redemption
     */
    async trackAction(params: {
        studentId?: string;
        offerId: string;
        code: string;
        action: 'copy' | 'click' | 'redeem';
    }) {
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const response = await fetch(`${baseUrl}/api/tracking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Track action error:', error);
            return false;
        }
    },

    /**
     * Get all offer IDs that the current user has revealed (from database)
     * Returns empty array if not logged in
     */
    async getMyRevealedOffers(): Promise<string[]> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return [];

            // Get student ID
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (!student?.id) return [];

            // Get all reveals for this student from coupon_redemptions table
            // FIXED: Was querying 'coupon_tracking' which doesn't exist - data is in 'coupon_redemptions'
            const { data: reveals, error } = await supabase
                .from('coupon_redemptions')
                .select('offer_id')
                .eq('student_id', student.id);

            if (error) {
                console.error('Error fetching reveals:', error);
                return [];
            }

            return (reveals || []).map(r => r.offer_id);
        } catch (error) {
            console.error('getMyRevealedOffers error:', error);
            return [];
        }
    }
};

// Mappers
function mapBrandFromDb(row: any): OnlineBrand {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        logoUrl: row.logo_url,
        coverImageUrl: row.cover_image_url,
        description: row.description,
        websiteUrl: row.website_url,
        appUrl: row.app_url, // App deep link
        preferApp: row.prefer_app ?? false, // Prefer app toggle
        playstoreUrl: row.playstore_url, // Google Play Store URL
        appstoreUrl: row.appstore_url, // Apple App Store URL
        isActive: row.is_active,
        createdAt: row.created_at
    };
}

function mapOfferFromDb(row: any): OnlineOffer {
    return {
        id: row.id,
        brandId: row.brand_id,
        title: row.title,
        description: row.description,
        code: row.code,
        link: row.link,
        expiryDate: row.expiry_date,
        redemptionType: row.redemption_type || 'CODE_REVEAL',
        isActive: row.is_active,
        createdAt: row.created_at,
        // Tracking fields
        revealCount: row.reveal_count || 0,
        redemptionCount: row.redemption_count || 0,
        termsConditions: row.terms_conditions,
        minOrderValue: row.min_order_value,
        maxDiscount: row.max_discount,
        perUserLimit: row.per_user_limit || 1
    };
}
