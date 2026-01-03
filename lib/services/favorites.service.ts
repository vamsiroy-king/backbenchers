// Favorites/Saved Service - Real-time save/unsave for merchants and offers
// Uses student_id to work with existing RLS policies

import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

// DEV MODE flag
const IS_DEV = process.env.NODE_ENV === 'development';

export interface Favorite {
    id: string;
    studentId: string;
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
    studentId: row.student_id,
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

// Helper to get current student's ID and user_id
interface StudentAuth {
    studentId: string;
    userId: string | null;
}

async function getStudentAuth(): Promise<StudentAuth | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: student } = await supabase
                .from('students')
                .select('id, user_id')
                .eq('user_id', user.id)
                .single();

            if (student) {
                return { studentId: student.id, userId: user.id };
            }
        }

        // DEV MODE: Get real student from DB (already cached by student.service)
        if (IS_DEV && typeof window !== 'undefined') {
            const devStudentId = localStorage.getItem('dev_student_id');
            if (devStudentId) {
                // Fetch the user_id for this student from DB
                const { data: devStudent } = await supabase
                    .from('students')
                    .select('id, user_id')
                    .eq('id', devStudentId)
                    .single();

                if (devStudent) {
                    console.log('DEV MODE: Using student auth:', devStudent.id, 'user_id:', devStudent.user_id);
                    return { studentId: devStudent.id, userId: devStudent.user_id };
                }
            }
            console.warn('DEV MODE: No valid student found for favorites');
        }

        return null;
    } catch {
        return null;
    }
}

// Legacy helper for backward compatibility (read operations)
async function getStudentId(): Promise<string | null> {
    const auth = await getStudentAuth();
    return auth?.studentId || null;
}

export const favoritesService = {
    // Get all saved items for current student
    async getAll(): Promise<ApiResponse<Favorite[]>> {
        try {
            const studentId = await getStudentId();
            if (!studentId) {
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
                .eq('student_id', studentId)
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
            const studentId = await getStudentId();
            if (!studentId) return false;

            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('student_id', studentId)
                .eq('merchant_id', merchantId)
                .maybeSingle();

            return !!data;
        } catch {
            return false;
        }
    },

    // Check if offer is saved
    async isOfferSaved(offerId: string): Promise<boolean> {
        try {
            const studentId = await getStudentId();
            if (!studentId) return false;

            const { data } = await supabase
                .from('favorites')
                .select('id')
                .eq('student_id', studentId)
                .eq('offer_id', offerId)
                .maybeSingle();

            return !!data;
        } catch {
            return false;
        }
    },

    // Get saved status for multiple offers (for list views)
    async getSavedOfferIds(): Promise<string[]> {
        try {
            const studentId = await getStudentId();
            if (!studentId) return [];

            const { data } = await supabase
                .from('favorites')
                .select('offer_id')
                .eq('student_id', studentId)
                .not('offer_id', 'is', null);

            return (data || []).map(f => f.offer_id).filter(Boolean);
        } catch {
            return [];
        }
    },

    // Toggle save merchant
    async toggleMerchant(merchantId: string): Promise<ApiResponse<boolean>> {
        try {
            const auth = await getStudentAuth();
            if (!auth) {
                return { success: false, data: null, error: 'Not authenticated as student' };
            }

            // Check if already saved
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('student_id', auth.studentId)
                .eq('merchant_id', merchantId)
                .maybeSingle();

            if (existing) {
                // Unsave
                const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
                if (error) throw error;
                return { success: true, data: false, error: null }; // false = unsaved
            } else {
                // Save - include user_id for NOT NULL constraint
                const { error } = await supabase.from('favorites').insert({
                    student_id: auth.studentId,
                    user_id: auth.userId,
                    merchant_id: merchantId,
                });
                if (error) throw error;
                return { success: true, data: true, error: null }; // true = saved
            }
        } catch (error: any) {
            console.error('[Favorites] Toggle merchant error:', error);
            return { success: false, data: null, error: error.message };
        }
    },

    // Toggle save offer
    async toggleOffer(offerId: string): Promise<ApiResponse<boolean>> {
        try {
            const auth = await getStudentAuth();
            if (!auth) {
                return { success: false, data: null, error: 'Not authenticated as student' };
            }

            // Check if already saved
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('student_id', auth.studentId)
                .eq('offer_id', offerId)
                .maybeSingle();

            if (existing) {
                // Unsave
                const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
                if (error) throw error;
                return { success: true, data: false, error: null };
            } else {
                // Save - include user_id for NOT NULL constraint
                const { error } = await supabase.from('favorites').insert({
                    student_id: auth.studentId,
                    user_id: auth.userId,
                    offer_id: offerId,
                });
                if (error) throw error;
                return { success: true, data: true, error: null };
            }
        } catch (error: any) {
            console.error('[Favorites] Toggle offer error:', error);
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
            const studentId = await getStudentId();
            if (!studentId) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    merchants (id, business_name, logo_url, category, city)
                `)
                .eq('student_id', studentId)
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
            const studentId = await getStudentId();
            if (!studentId) {
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
                .eq('student_id', studentId)
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
