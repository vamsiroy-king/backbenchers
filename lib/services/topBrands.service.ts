import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface TopBrand {
    id: string;
    merchantId: string;
    logoUrl: string | null;
    position: number;
    isActive: boolean;
    createdAt: string;
    // Joined merchant data
    // Joined merchant data
    merchant?: {
        id: string;
        businessName: string;
        category: string;
        city: string;
        logo: string | null;
        isOnline?: boolean;
    };
}

const transformTopBrand = (row: any): TopBrand => {
    // Check for online brand
    if (row.online_brands) {
        return {
            id: row.id,
            merchantId: row.online_brand_id,
            logoUrl: row.online_brands.logo_url,
            position: row.display_order,
            isActive: row.is_active,
            createdAt: row.created_at,
            merchant: {
                id: row.online_brands.id,
                businessName: row.online_brands.name,
                category: row.online_brands.category || 'Online',
                city: 'Online',
                logo: row.online_brands.logo_url,
                isOnline: true
            }
        };
    }

    // Default to offline merchant
    return {
        id: row.id,
        merchantId: row.merchant_id,
        logoUrl: row.logo_url,
        position: row.display_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        merchant: row.merchants ? {
            id: row.merchants.id,
            businessName: row.merchants.business_name,
            category: row.merchants.category,
            city: row.merchants.city,
            logo: row.merchants.logo_url,
            isOnline: false
        } : undefined,
    };
};

export const topBrandsService = {
    // Get all top brands
    async getAll(): Promise<ApiResponse<TopBrand[]>> {
        try {
            console.log('[TopBrands] Fetching all top brands...');
            const { data, error } = await supabase
                .from('featured_brands')
                .select(`
                    *,
                    merchants (
                        id,
                        business_name,
                        category,
                        city,
                        logo_url
                    ),
                    online_brands (
                        id,
                        name,
                        category,
                        logo_url
                    )
                `)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                console.error('[TopBrands] Error fetching:', JSON.stringify(error, null, 2));
                return { success: false, data: null, error: error.message || 'Unknown error' };
            }

            console.log('[TopBrands] Fetched:', data?.length, 'brands');
            return {
                success: true,
                data: (data || []).map(transformTopBrand),
                error: null
            };
        } catch (error: any) {
            console.error('[TopBrands] Exception:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    // Add merchant to top brands
    async add(merchantId: string, position: number, isOnline: boolean = false): Promise<ApiResponse<TopBrand>> {
        try {
            const payload: any = {
                display_order: position,
                is_active: true
            };

            if (isOnline) {
                payload.online_brand_id = merchantId;
                payload.merchant_id = null;
            } else {
                payload.merchant_id = merchantId;
                payload.online_brand_id = null;
            }

            const { data, error } = await supabase
                .from('featured_brands')
                .insert(payload)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: transformTopBrand(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Remove from top brands
    async remove(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('featured_brands')
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

    // Save all top brands (replace all)
    // Updated to accept an array of objects that include isOnline flag
    async saveAll(brands: { merchantId: string; position: number; isOnline?: boolean }[]): Promise<ApiResponse<void>> {
        try {
            console.log('[TopBrands] Saving', brands.length, 'brands...');

            // First, get all existing IDs
            const { data: existing } = await supabase
                .from('featured_brands')
                .select('id');

            // Delete each existing entry
            if (existing && existing.length > 0) {
                console.log('[TopBrands] Deleting', existing.length, 'existing entries...');
                for (const item of existing) {
                    await supabase.from('featured_brands').delete().eq('id', item.id);
                }
            }

            // Insert new entries
            if (brands.length > 0) {
                console.log('[TopBrands] Inserting new entries...');
                const payload = brands.map(b => ({
                    merchant_id: b.isOnline ? null : b.merchantId,
                    online_brand_id: b.isOnline ? b.merchantId : null,
                    display_order: b.position,
                    is_active: true,
                }));

                const { data, error } = await supabase
                    .from('featured_brands')
                    .insert(payload)
                    .select();

                if (error) {
                    console.error('[TopBrands] Insert error:', error);
                    return { success: false, data: null, error: error.message };
                }

                console.log('[TopBrands] Inserted:', data?.length, 'entries');
            }

            return { success: true, data: null, error: null };
        } catch (error: any) {
            console.error('[TopBrands] Exception in saveAll:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    // Update positions
    async updatePositions(positions: { id: string; position: number }[]): Promise<ApiResponse<void>> {
        try {
            for (const item of positions) {
                await supabase
                    .from('featured_brands')
                    .update({ display_order: item.position })
                    .eq('id', item.id);
            }
            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
