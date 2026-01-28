import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export interface Category {
    id: string;
    name: string;
    tagline?: string;
    image_url?: string;
    gradient_from: string;
    gradient_to: string;
    icon: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

export const categoryService = {
    // Get all active categories (Public)
    async getAll(): Promise<ApiResponse<Category[]>> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all categories (Admin)
    async getAllAdmin(): Promise<ApiResponse<Category[]>> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Create Category
    async create(category: Partial<Category>): Promise<ApiResponse<Category>> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(category)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Update Category
    async update(id: string, updates: Partial<Category>): Promise<ApiResponse<Category>> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Toggle Active Status
    async toggleStatus(id: string, isActive: boolean): Promise<ApiResponse<Category>> {
        return this.update(id, { is_active: isActive });
    },

    // Delete Category
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Upload Category Image
    async uploadImage(file: File): Promise<ApiResponse<string>> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `cat_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('category-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('category-images')
                .getPublicUrl(filePath);

            return { success: true, data: publicUrl };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
