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
    merchant?: {
        id: string;
        businessName: string;
        category: string;
        city: string;
        logo: string | null;
    };
}

const transformTopBrand = (row: any): TopBrand => ({
    id: row.id,
    merchantId: row.merchant_id,
    logoUrl: row.logo_url,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at,
    merchant: row.merchants ? {
        id: row.merchants.id,
        businessName: row.merchants.business_name,
        category: row.merchants.category,
        city: row.merchants.city,
        logo: row.merchants.logo_url, // Fixed: use logo_url not logo
    } : undefined,
});

export const topBrandsService = {
    // Get all top brands
    async getAll(): Promise<ApiResponse<TopBrand[]>> {
        try {
            console.log('[TopBrands] Fetching all top brands...');
            const { data, error } = await supabase
                .from('top_brands')
                .select(`
                    *,
                    merchants (
                        id,
                        business_name,
                        category,
                        city,
                        logo_url
                    )
                `)
                .eq('is_active', true)
                .order('position', { ascending: true });

            if (error) {
                console.error('[TopBrands] Error fetching:', error);
                return { success: false, data: null, error: error.message };
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
    async add(merchantId: string, position: number): Promise<ApiResponse<TopBrand>> {
        try {
            const { data, error } = await supabase
                .from('top_brands')
                .insert({
                    merchant_id: merchantId,
                    position,
                })
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
                .from('top_brands')
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
    async saveAll(brands: { merchantId: string; position: number }[]): Promise<ApiResponse<void>> {
        try {
            console.log('[TopBrands] Saving', brands.length, 'brands...');

            // First, get all existing IDs
            const { data: existing } = await supabase
                .from('top_brands')
                .select('id');

            // Delete each existing entry
            if (existing && existing.length > 0) {
                console.log('[TopBrands] Deleting', existing.length, 'existing entries...');
                for (const item of existing) {
                    await supabase.from('top_brands').delete().eq('id', item.id);
                }
            }

            // Insert new entries
            if (brands.length > 0) {
                console.log('[TopBrands] Inserting new entries...');
                const { data, error } = await supabase
                    .from('top_brands')
                    .insert(brands.map(b => ({
                        merchant_id: b.merchantId,
                        position: b.position,
                        is_active: true,
                    })))
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
                    .from('top_brands')
                    .update({ position: item.position })
                    .eq('id', item.id);
            }
            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
