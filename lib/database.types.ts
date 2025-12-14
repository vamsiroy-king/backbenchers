// Auto-generated Database Types for Supabase
// This maps to the SQL schema in the backend

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            students: {
                Row: {
                    id: string;
                    user_id: string | null;
                    bb_id: string | null;
                    name: string;
                    email: string;
                    phone: string | null;
                    dob: string;
                    gender: 'Male' | 'Female' | 'Other';
                    college: string;
                    city: string;
                    state: string;
                    profile_image_url: string | null;
                    status: 'pending' | 'verified' | 'suspended';
                    total_savings: number;
                    total_redemptions: number;
                    passcode_hash: string | null;
                    device_id: string | null;
                    created_at: string;
                    verified_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    bb_id?: string | null;
                    name: string;
                    email: string;
                    phone?: string | null;
                    dob: string;
                    gender: 'Male' | 'Female' | 'Other';
                    college: string;
                    city: string;
                    state: string;
                    profile_image_url?: string | null;
                    status?: 'pending' | 'verified' | 'suspended';
                    total_savings?: number;
                    total_redemptions?: number;
                    passcode_hash?: string | null;
                    device_id?: string | null;
                    created_at?: string;
                    verified_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    bb_id?: string | null;
                    name?: string;
                    email?: string;
                    phone?: string | null;
                    dob?: string;
                    gender?: 'Male' | 'Female' | 'Other';
                    college?: string;
                    city?: string;
                    state?: string;
                    profile_image_url?: string | null;
                    status?: 'pending' | 'verified' | 'suspended';
                    total_savings?: number;
                    total_redemptions?: number;
                    passcode_hash?: string | null;
                    device_id?: string | null;
                    created_at?: string;
                    verified_at?: string | null;
                    updated_at?: string;
                };
            };
            merchants: {
                Row: {
                    id: string;
                    user_id: string | null;
                    bbm_id: string | null;
                    business_name: string;
                    owner_name: string;
                    email: string;
                    phone: string;
                    category: string;
                    sub_category: string | null;
                    description: string | null;
                    address: string;
                    city: string;
                    state: string;
                    pin_code: string;
                    latitude: number | null;
                    longitude: number | null;
                    logo_url: string | null;
                    cover_photo_url: string | null;
                    gst_certificate_url: string | null;
                    shop_license_url: string | null;
                    payment_qr_url: string | null;
                    website: string | null;
                    instagram: string | null;
                    operating_hours: Json | null;
                    status: 'pending' | 'approved' | 'rejected' | 'suspended';
                    rejected_reason: string | null;
                    total_offers: number;
                    total_redemptions: number;
                    total_revenue: number;
                    passcode_hash: string | null;
                    device_id: string | null;
                    created_at: string;
                    approved_at: string | null;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    bbm_id?: string | null;
                    business_name: string;
                    owner_name: string;
                    email: string;
                    phone: string;
                    category: string;
                    sub_category?: string | null;
                    description?: string | null;
                    address: string;
                    city: string;
                    state: string;
                    pin_code: string;
                    latitude?: number | null;
                    longitude?: number | null;
                    logo_url?: string | null;
                    cover_photo_url?: string | null;
                    gst_certificate_url?: string | null;
                    shop_license_url?: string | null;
                    payment_qr_url?: string | null;
                    website?: string | null;
                    instagram?: string | null;
                    operating_hours?: Json | null;
                    status?: 'pending' | 'approved' | 'rejected' | 'suspended';
                    rejected_reason?: string | null;
                    total_offers?: number;
                    total_redemptions?: number;
                    total_revenue?: number;
                    passcode_hash?: string | null;
                    device_id?: string | null;
                    created_at?: string;
                    approved_at?: string | null;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    bbm_id?: string | null;
                    business_name?: string;
                    owner_name?: string;
                    email?: string;
                    phone?: string;
                    category?: string;
                    sub_category?: string | null;
                    description?: string | null;
                    address?: string;
                    city?: string;
                    state?: string;
                    pin_code?: string;
                    latitude?: number | null;
                    longitude?: number | null;
                    logo_url?: string | null;
                    cover_photo_url?: string | null;
                    gst_certificate_url?: string | null;
                    shop_license_url?: string | null;
                    payment_qr_url?: string | null;
                    website?: string | null;
                    instagram?: string | null;
                    operating_hours?: Json | null;
                    status?: 'pending' | 'approved' | 'rejected' | 'suspended';
                    rejected_reason?: string | null;
                    total_offers?: number;
                    total_redemptions?: number;
                    total_revenue?: number;
                    passcode_hash?: string | null;
                    device_id?: string | null;
                    created_at?: string;
                    approved_at?: string | null;
                    updated_at?: string;
                };
            };
            merchant_store_images: {
                Row: {
                    id: string;
                    merchant_id: string;
                    image_url: string;
                    display_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    merchant_id: string;
                    image_url: string;
                    display_order?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    merchant_id?: string;
                    image_url?: string;
                    display_order?: number;
                    created_at?: string;
                };
            };
            offers: {
                Row: {
                    id: string;
                    merchant_id: string;
                    title: string;
                    description: string | null;
                    type: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
                    original_price: number;
                    discount_value: number;
                    final_price: number;
                    discount_amount: number;
                    min_order_value: number | null;
                    max_discount: number | null;
                    terms: Json;
                    valid_from: string;
                    valid_until: string | null;
                    status: 'active' | 'paused' | 'expired';
                    total_redemptions: number;
                    free_item_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    merchant_id: string;
                    title: string;
                    description?: string | null;
                    type: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
                    original_price: number;
                    discount_value: number;
                    final_price: number;
                    discount_amount: number;
                    min_order_value?: number | null;
                    max_discount?: number | null;
                    terms?: Json;
                    valid_from?: string;
                    valid_until?: string | null;
                    status?: 'active' | 'paused' | 'expired';
                    total_redemptions?: number;
                    free_item_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    merchant_id?: string;
                    title?: string;
                    description?: string | null;
                    type?: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
                    original_price?: number;
                    discount_value?: number;
                    final_price?: number;
                    discount_amount?: number;
                    min_order_value?: number | null;
                    max_discount?: number | null;
                    terms?: Json;
                    valid_from?: string;
                    valid_until?: string | null;
                    status?: 'active' | 'paused' | 'expired';
                    total_redemptions?: number;
                    free_item_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            transactions: {
                Row: {
                    id: string;
                    student_id: string;
                    merchant_id: string;
                    offer_id: string;
                    student_bb_id: string;
                    student_name: string;
                    merchant_bbm_id: string;
                    merchant_name: string;
                    offer_title: string;
                    original_amount: number;
                    discount_amount: number;
                    final_amount: number;
                    payment_method: 'cash' | 'online';
                    redeemed_at: string;
                };
                Insert: {
                    id?: string;
                    student_id: string;
                    merchant_id: string;
                    offer_id: string;
                    student_bb_id: string;
                    student_name: string;
                    merchant_bbm_id: string;
                    merchant_name: string;
                    offer_title: string;
                    original_amount: number;
                    discount_amount: number;
                    final_amount: number;
                    payment_method: 'cash' | 'online';
                    redeemed_at?: string;
                };
                Update: {
                    id?: string;
                    student_id?: string;
                    merchant_id?: string;
                    offer_id?: string;
                    student_bb_id?: string;
                    student_name?: string;
                    merchant_bbm_id?: string;
                    merchant_name?: string;
                    offer_title?: string;
                    original_amount?: number;
                    discount_amount?: number;
                    final_amount?: number;
                    payment_method?: 'cash' | 'online';
                    redeemed_at?: string;
                };
            };
            admins: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    email: string;
                    role: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    email: string;
                    role?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    email?: string;
                    role?: string;
                    created_at?: string;
                };
            };
            featured_brands: {
                Row: {
                    id: string;
                    merchant_id: string;
                    display_order: number;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    merchant_id: string;
                    display_order?: number;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    merchant_id?: string;
                    display_order?: number;
                    is_active?: boolean;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            generate_bb_id: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            generate_bbm_id: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Convenience types
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type Merchant = Database['public']['Tables']['merchants']['Row'];
export type MerchantInsert = Database['public']['Tables']['merchants']['Insert'];
export type MerchantUpdate = Database['public']['Tables']['merchants']['Update'];

export type Offer = Database['public']['Tables']['offers']['Row'];
export type OfferInsert = Database['public']['Tables']['offers']['Insert'];
export type OfferUpdate = Database['public']['Tables']['offers']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export type MerchantStoreImage = Database['public']['Tables']['merchant_store_images']['Row'];
export type FeaturedBrand = Database['public']['Tables']['featured_brands']['Row'];
