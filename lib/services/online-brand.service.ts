import { supabase } from "@/lib/supabase";
import { OnlineBrand, OnlineOffer } from "@/lib/types";

export const onlineBrandService = {
    // ==================== BRANDS ====================

    /**
     * Get all active online brands, optionally filtered by category and student location.
     */
    async getAllBrands(category?: string, studentLocation?: { city?: string; state?: string }) {
        let query = supabase
            .from('online_brands')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (category) {
            query = query.ilike('category', `%${category}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const brands = (data || []).map(mapBrandFromDb);

        if (!studentLocation?.city && !studentLocation?.state) {
            return brands;
        }

        const brandsWithOffers = await Promise.all(
            brands.map(async (brand) => {
                const offers = await this.getOffersForLocation(brand.id, studentLocation);
                return offers.length > 0 ? brand : null;
            })
        );

        return brandsWithOffers.filter((b): b is OnlineBrand => b !== null);
    },

    async getOffersForLocation(brandId: string, studentLocation?: { city?: string; state?: string }) {
        const { data, error } = await supabase
            .from('online_offers')
            .select('*')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const offers = data || [];

        if (!studentLocation?.city && !studentLocation?.state) {
            return offers.map(mapOfferFromDb);
        }

        const filteredOffers = offers.filter(offer => {
            const scope = (offer.location_scope || 'PAN_INDIA').toUpperCase();
            const locationValues: string[] = offer.location_values || [];

            if (scope === 'PAN_INDIA' || !offer.location_scope) return true;

            if ((scope === 'STATES' || scope === 'STATE') && studentLocation.state) {
                return locationValues.some(v => v.toLowerCase() === studentLocation.state!.toLowerCase());
            }

            if ((scope === 'CITIES' || scope === 'CITY') && studentLocation.city) {
                return locationValues.some(v => v.trim().toLowerCase() === studentLocation.city!.trim().toLowerCase());
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
        const dbBrand = {
            name: brand.name,
            category: brand.category,
            logo_url: brand.logoUrl,
            cover_image_url: brand.coverImageUrl,
            description: brand.description,
            website_url: brand.websiteUrl,
            app_url: brand.appUrl,
            prefer_app: brand.preferApp ?? false,
            playstore_url: brand.playstoreUrl,
            appstore_url: brand.appstoreUrl,
            is_active: brand.isActive ?? true
        };

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

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(mapOfferFromDb);
    },

    async createOffer(offer: Partial<OnlineOffer>) {
        const input: any = offer;
        const dbOffer = {
            brand_id: input.brandId,
            title: input.title,
            description: input.description,
            code: input.couponCode || input.code,
            link: input.offerLink || input.link,
            expiry_date: input.validUntil,
            location_scope: input.locationScope || 'PAN_INDIA',
            location_values: input.locationValues || [],
            redemption_type: input.redemptionType || 'CODE_REVEAL',
            is_active: offer.isActive ?? true
        };

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
        const { error } = await supabase.from('online_offers').delete().eq('id', offerId);
        if (error) throw error;
    },

    async toggleOfferStatus(offerId: string, isActive: boolean) {
        const { error } = await supabase.from('online_offers').update({ is_active: isActive }).eq('id', offerId);
        if (error) throw error;
    },

    async uploadImage(file: File, path: 'logo' | 'cover'): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const uniqueId = Math.random().toString(36).substring(7);
        const fileName = `online-brands/${path}-${Date.now()}-${uniqueId}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'merchant-stores');
        formData.append('path', fileName);

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
                body: JSON.stringify({ ...params, action: 'reveal' })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Track reveal error:', error);
            return false;
        }
    },

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

    async getMyRevealedOffers(): Promise<string[]> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return [];
            const { data: student } = await supabase.from('students').select('id').eq('user_id', session.user.id).maybeSingle();
            if (!student?.id) return [];
            const { data: reveals, error } = await supabase.from('coupon_redemptions').select('offer_id').eq('student_id', student.id);
            if (error) { console.error('Error fetching reveals:', error); return []; }
            return (reveals || []).map(r => r.offer_id);
        } catch (error) {
            console.error('getMyRevealedOffers error:', error);
            return [];
        }
    },

    async getStudentRedemptions(studentId: string) {
        const { data, error } = await supabase
            .from('coupon_redemptions')
            .select(`
                *,
                offer:online_offers (
                    title,
                    code,
                    description,
                    brand:online_brands (
                        name,
                        logo_url
                    )
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching student redemptions:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            offerId: item.offer_id,
            codeUsed: item.code_used,
            revealedAt: item.revealed_at,
            status: item.status,
            offerTitle: item.offer?.title,
            offerCode: item.offer?.code,
            brandName: item.offer?.brand?.name,
            brandLogo: item.offer?.brand?.logo_url
        }));
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
        appUrl: row.app_url,
        preferApp: row.prefer_app ?? false,
        playstoreUrl: row.playstore_url,
        appstoreUrl: row.appstore_url,
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
        revealCount: row.reveal_count || 0,
        redemptionCount: row.redemption_count || 0,
        termsConditions: row.terms_conditions,
        minOrderValue: row.min_order_value,
        maxDiscount: row.max_discount,
        perUserLimit: row.per_user_limit || 1
    };
}
