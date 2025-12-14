import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface OnlinePartner {
    id: string;
    name: string;
    logo: string;
    discount: string;
    category: string;
    couponCode: string | null;
    partnerLink: string | null;
    tier: 'premium' | 'standard';
    position: number;
    isActive: boolean;
    createdAt: string;
}

// Transform database row to camelCase
const transformPartner = (row: any): OnlinePartner => ({
    id: row.id,
    name: row.name,
    logo: row.logo,
    discount: row.discount,
    category: row.category,
    couponCode: row.coupon_code,
    partnerLink: row.partner_link,
    tier: row.tier,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at,
});

export const onlinePartnerService = {
    // Get all active online partners
    async getAll(): Promise<ApiResponse<OnlinePartner[]>> {
        try {
            const { data, error } = await supabase
                .from('online_partners')
                .select('*')
                .eq('is_active', true)
                .order('position', { ascending: true });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformPartner),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get premium partners only
    async getPremium(): Promise<ApiResponse<OnlinePartner[]>> {
        try {
            const { data, error } = await supabase
                .from('online_partners')
                .select('*')
                .eq('is_active', true)
                .eq('tier', 'premium')
                .order('position', { ascending: true });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformPartner),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Create new online partner
    async create(partner: Omit<OnlinePartner, 'id' | 'createdAt' | 'isActive'>): Promise<ApiResponse<OnlinePartner>> {
        try {
            const { data, error } = await supabase
                .from('online_partners')
                .insert({
                    name: partner.name,
                    logo: partner.logo,
                    discount: partner.discount,
                    category: partner.category,
                    coupon_code: partner.couponCode,
                    partner_link: partner.partnerLink,
                    tier: partner.tier,
                    position: partner.position,
                })
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: transformPartner(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Update partner
    async update(id: string, updates: Partial<OnlinePartner>): Promise<ApiResponse<OnlinePartner>> {
        try {
            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
            if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
            if (updates.category !== undefined) dbUpdates.category = updates.category;
            if (updates.couponCode !== undefined) dbUpdates.coupon_code = updates.couponCode;
            if (updates.partnerLink !== undefined) dbUpdates.partner_link = updates.partnerLink;
            if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
            if (updates.position !== undefined) dbUpdates.position = updates.position;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

            const { data, error } = await supabase
                .from('online_partners')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: transformPartner(data), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Delete partner
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('online_partners')
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

    // Update positions (for reordering)
    async updatePositions(positions: { id: string; position: number }[]): Promise<ApiResponse<void>> {
        try {
            for (const item of positions) {
                await supabase
                    .from('online_partners')
                    .update({ position: item.position })
                    .eq('id', item.id);
            }
            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
