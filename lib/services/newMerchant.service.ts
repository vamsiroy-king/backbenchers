// New Merchants Service - Get newly onboarded merchants for "New on BackBenchers" section

import { supabase } from '../supabase';
import { Merchant, ApiResponse } from '../types';

export interface NewMerchant {
    id: string;
    businessName: string;
    category: string;
    city: string;
    logoUrl?: string;
    createdAt: string;
    daysOld: number;
    hasOffers: boolean;
}

export const newMerchantService = {
    // Get new merchants (registered within last N days, optionally filtered by city)
    async getNewMerchants(days: number = 7, limit: number = 10, city?: string): Promise<ApiResponse<NewMerchant[]>> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            let query = supabase
                .from('merchants')
                .select(`
                    id, business_name, category, city, logo_url, created_at,
                    offers!left (id)
                `)
                .eq('status', 'approved')
                .gte('created_at', cutoffDate.toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            // Filter by city if provided (case-insensitive match)
            if (city && city.trim() !== '') {
                query = query.ilike('city', city);
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const merchants: NewMerchant[] = data.map((row: any) => {
                const createdDate = new Date(row.created_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    id: row.id,
                    businessName: row.business_name,
                    category: row.category,
                    city: row.city,
                    logoUrl: row.logo_url,
                    createdAt: row.created_at,
                    daysOld: diffDays,
                    hasOffers: row.offers && row.offers.length > 0
                };
            });

            return { success: true, data: merchants, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Check if a merchant is "new" (registered within X days)
    isNewMerchant(createdAt: string, days: number = 7): boolean {
        const createdDate = new Date(createdAt);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return createdDate >= cutoffDate;
    }
};
