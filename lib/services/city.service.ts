import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface City {
    id: string;
    name: string;
    state: string;
    isPopular: boolean;
    iconEmoji: string | null;
    position: number;
}

const transformCity = (row: any): City => ({
    id: row.id,
    name: row.name,
    state: row.state,
    isPopular: row.is_popular,
    iconEmoji: row.icon_emoji,
    position: row.position,
});

export const cityService = {
    // Get all active cities
    async getAll(): Promise<ApiResponse<City[]>> {
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .order('position', { ascending: true });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformCity),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get popular cities only
    async getPopular(): Promise<ApiResponse<City[]>> {
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .eq('is_popular', true)
                .order('position', { ascending: true });

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformCity),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Search cities by name
    async search(query: string): Promise<ApiResponse<City[]>> {
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .ilike('name', `%${query}%`)
                .order('name', { ascending: true })
                .limit(20);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: (data || []).map(transformCity),
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get user's selected city from profile or localStorage
    getSelectedCity(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedCity');
        }
        return null;
    },

    // Save selected city
    setSelectedCity(cityName: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedCity', cityName);
        }
    },

    // Update city in student profile
    async updateStudentCity(studentId: string, cityName: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('students')
                .update({ selected_city: cityName })
                .eq('id', studentId);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            // Also save to localStorage for quick access
            this.setSelectedCity(cityName);
            return { success: true, data: null, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },
};
