// Merchant Service - Supabase CRUD operations for merchants

import { supabase } from '../supabase';
import { Merchant, MerchantFilters, ApiResponse } from '../types';

// Map database row to frontend Merchant type
const mapDbToMerchant = (row: any): Merchant => ({
    id: row.id,
    bbmId: row.bbm_id,
    businessName: row.business_name,
    ownerName: row.owner_name,
    ownerPhone: row.owner_phone, // Owner's personal phone
    email: row.email,
    phone: row.phone, // Business phone (optional)
    category: row.category,
    description: row.description,
    address: row.address,
    city: row.city,
    state: row.state,
    pinCode: row.pin_code,
    logo: row.logo_url,
    coverPhoto: row.cover_photo_url,
    storeImages: [], // Fetched separately from merchant_store_images
    gstCertificate: row.gst_certificate_url,
    shopLicense: row.shop_license_url,
    operatingHours: row.operating_hours,
    status: row.status,
    totalOffers: row.total_offers || 0,
    totalRedemptions: row.total_redemptions || 0,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    rejectedReason: row.rejected_reason,
    latitude: row.latitude,
    longitude: row.longitude,
    googleMapsLink: row.google_maps_link,
    googleMapsEmbed: row.google_maps_embed,
    paymentQrUrl: row.payment_qr_url
});

export const merchantService = {
    // Get all merchants with filters
    async getAll(filters?: MerchantFilters): Promise<ApiResponse<Merchant[]>> {
        try {
            // If filtering for pending, fetch from pending_merchants table
            if (filters?.status === 'pending') {
                const { data, error } = await supabase
                    .from('pending_merchants')
                    .select('*')
                    .eq('status', 'pending')
                    .order('submitted_at', { ascending: false });

                if (error) {
                    return { success: false, data: null, error: error.message };
                }

                // Map pending_merchants to Merchant type
                const merchants: Merchant[] = data.map((row: any) => ({
                    id: row.id,
                    bbmId: null,
                    businessName: row.business_name,
                    ownerName: row.owner_name,
                    ownerPhone: row.owner_phone,
                    email: row.email,
                    phone: row.phone,
                    category: row.category,
                    description: row.description,
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    pinCode: row.pincode,
                    logo: row.logo_url,
                    coverPhoto: row.cover_photo_url,
                    storeImages: row.store_images || [],
                    operatingHours: row.operating_hours,
                    status: 'pending',
                    totalOffers: 0,
                    totalRedemptions: 0,
                    createdAt: row.submitted_at,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    googleMapsLink: row.google_maps_link,
                    paymentQrUrl: row.payment_qr_url
                }));

                return { success: true, data: merchants, error: null };
            }

            // For all other filters, use merchants table
            let query = supabase
                .from('merchants')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters) {
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                if (filters.state) {
                    query = query.eq('state', filters.state);
                }
                if (filters.city) {
                    query = query.eq('city', filters.city);
                }
                if (filters.search) {
                    query = query.ilike('business_name', `%${filters.search}%`);
                }
                if (filters.bbmIdSearch) {
                    query = query.ilike('bbm_id', `%${filters.bbmIdSearch}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const merchants = data.map(mapDbToMerchant);
            return { success: true, data: merchants, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get approved merchants (for student explore/map)
    async getApproved(): Promise<ApiResponse<Merchant[]>> {
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('status', 'approved')
                .order('business_name');

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const merchants = data.map(mapDbToMerchant);
            return { success: true, data: merchants, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get merchants with location for map
    async getForMap(): Promise<ApiResponse<Array<{
        id: string;
        businessName: string;
        category: string;
        logo: string | undefined;
        latitude: number;
        longitude: number;
        googleMapsLink?: string;
    }>>> {
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('id, business_name, category, logo_url, latitude, longitude, google_maps_link')
                .eq('status', 'approved')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const merchants = data.map(row => ({
                id: row.id,
                businessName: row.business_name,
                category: row.category,
                logo: row.logo_url,
                latitude: row.latitude,
                longitude: row.longitude,
                googleMapsLink: row.google_maps_link
            }));

            return { success: true, data: merchants, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get single merchant with store images
    async getById(id: string): Promise<ApiResponse<Merchant>> {
        try {
            // First try merchants table
            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (data) {
                // Fetch store images for approved merchants
                const { data: images } = await supabase
                    .from('merchant_store_images')
                    .select('image_url')
                    .eq('merchant_id', id)
                    .order('display_order');

                const merchant = mapDbToMerchant(data);
                merchant.storeImages = images?.map(img => img.image_url) || [];

                return { success: true, data: merchant, error: null };
            }

            // If not found in merchants table, try pending_merchants table
            // We use maybeSingle() to avoid errors if no rows found
            const { data: pendingData, error: pendingError } = await supabase
                .from('pending_merchants')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (pendingData) {
                // Map pending merchant data
                const merchant: Merchant = {
                    id: pendingData.id,
                    bbmId: null,
                    businessName: pendingData.business_name,
                    ownerName: pendingData.owner_name,
                    ownerPhone: pendingData.owner_phone,
                    email: pendingData.email,
                    phone: pendingData.phone,
                    category: pendingData.category,
                    description: pendingData.description,
                    address: pendingData.address,
                    city: pendingData.city,
                    state: pendingData.state,
                    pinCode: pendingData.pincode,
                    logo: pendingData.logo_url,
                    coverPhoto: pendingData.cover_photo_url,
                    storeImages: pendingData.store_images || [],
                    operatingHours: pendingData.operating_hours,
                    status: 'pending',
                    totalOffers: 0,
                    totalRedemptions: 0,
                    createdAt: pendingData.submitted_at, // Use submitted_at for pending
                    latitude: pendingData.latitude,
                    longitude: pendingData.longitude,
                    googleMapsLink: pendingData.google_maps_link,
                    paymentQrUrl: pendingData.payment_qr_url
                };
                return { success: true, data: merchant, error: null };
            }

            return { success: false, data: null, error: 'Merchant not found' };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get current user's merchant profile
    async getMyProfile(): Promise<ApiResponse<Merchant>> {
        try {
            // DEV MODE: Check for dev bypass
            const IS_DEV = process.env.NODE_ENV === 'development';
            let userId: string | null = null;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                userId = user.id;
            } else if (IS_DEV && typeof window !== 'undefined') {
                // In dev mode, use localStorage dev user ID
                userId = localStorage.getItem('dev_merchant_user_id');
                if (userId) {
                    console.log('DEV MODE: Using dev user ID for profile:', userId);
                }
            }

            if (!userId) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            // Fetch store images
            const { data: images } = await supabase
                .from('merchant_store_images')
                .select('image_url')
                .eq('merchant_id', data.id)
                .order('display_order');

            const merchant = mapDbToMerchant(data);
            merchant.storeImages = images?.map(img => img.image_url) || [];

            return { success: true, data: merchant, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Get current user's pending application (from pending_merchants table)
    async getMyPendingApplication(): Promise<ApiResponse<{
        id: string;
        businessName: string;
        status: 'pending' | 'rejected';
        submittedAt: string;
    }>> {
        try {
            // DEV MODE: Check for dev bypass
            const IS_DEV = process.env.NODE_ENV === 'development';
            let userId: string | null = null;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                userId = user.id;
            } else if (IS_DEV && typeof window !== 'undefined') {
                // In dev mode, use localStorage dev user ID
                userId = localStorage.getItem('dev_merchant_user_id');
                if (userId) {
                    console.log('DEV MODE: Using dev user ID for pending check:', userId);
                }
            }

            if (!userId) {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const { data, error } = await supabase
                .from('pending_merchants')
                .select('id, business_name, status, submitted_at')
                .eq('user_id', userId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return {
                success: true,
                data: {
                    id: data.id,
                    businessName: data.business_name,
                    status: data.status as 'pending' | 'rejected',
                    submittedAt: data.submitted_at
                },
                error: null
            };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Approve merchant - generates BBM-ID (admin only)
    async approve(id: string): Promise<ApiResponse<Merchant>> {
        try {
            // Generate unique BBM-ID (BBM-XXXXXX format)
            const generateUniqueBbmId = async (): Promise<string> => {
                for (let attempt = 0; attempt < 10; attempt++) {
                    const num = Math.floor(100000 + Math.random() * 900000);
                    const candidateId = `BBM-${num}`;

                    // Check if this ID already exists
                    const { data: existing } = await supabase
                        .from('merchants')
                        .select('id')
                        .eq('bbm_id', candidateId)
                        .maybeSingle();

                    if (!existing) {
                        return candidateId;
                    }
                }
                throw new Error('Could not generate unique BBM-ID');
            };

            const bbmId = await generateUniqueBbmId();

            // 1. Get the pending application
            const { data: pendingData, error: fetchError } = await supabase
                .from('pending_merchants')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !pendingData) {
                return { success: false, data: null, error: 'Pending application not found' };
            }

            // 2. Prepare merchant data for insertion
            // Note: We only include fields that exist in the 'merchants' table
            // 'gst_number', 'pan_number', 'sub_category' are not in merchants schema
            const merchantData = {
                id: pendingData.id,
                user_id: pendingData.user_id,
                bbm_id: bbmId,
                business_name: pendingData.business_name,
                email: pendingData.email,
                phone: pendingData.phone,
                owner_name: pendingData.owner_name,
                owner_phone: pendingData.owner_phone,
                description: pendingData.description,
                category: pendingData.category,
                // sub_category: pendingData.sub_category, // Column doesn't exist in merchants
                address: pendingData.address,
                city: pendingData.city,
                state: pendingData.state,
                pin_code: pendingData.pincode, // Map pincode to pin_code (db schema)
                latitude: pendingData.latitude,
                longitude: pendingData.longitude,
                google_maps_link: pendingData.google_maps_link,
                google_maps_embed: pendingData.google_maps_embed,
                logo_url: pendingData.logo_url,
                cover_photo_url: pendingData.cover_photo_url,
                payment_qr_url: pendingData.payment_qr_url,
                // gst_number: pendingData.gst_number, // Column doesn't exist in merchants
                // pan_number: pendingData.pan_number, // Column doesn't exist in merchants
                status: 'approved',
                created_at: pendingData.submitted_at,
                approved_at: new Date().toISOString()
            };

            // 3. Insert into merchants table
            const { data: newMerchant, error: insertError } = await supabase
                .from('merchants')
                .insert([merchantData])
                .select()
                .single();

            if (insertError) {
                return { success: false, data: null, error: insertError.message };
            }

            // 4. Handle store images (move from JSON in pending to merchant_store_images table)
            if (pendingData.store_images) {
                // Check if it's string or array
                let imagesArray: string[] = [];
                if (typeof pendingData.store_images === 'string') {
                    try {
                        imagesArray = JSON.parse(pendingData.store_images);
                    } catch (e) { }
                } else if (Array.isArray(pendingData.store_images)) {
                    imagesArray = pendingData.store_images;
                }

                if (imagesArray.length > 0) {
                    const imageInserts = imagesArray.map((url, index) => ({
                        merchant_id: id,
                        image_url: url,
                        display_order: index
                    }));

                    await supabase.from('merchant_store_images').insert(imageInserts);
                }
            }

            // 5. Delete from pending_merchants
            await supabase.from('pending_merchants').delete().eq('id', id);

            // 6. Return mapped merchant
            return { success: true, data: mapDbToMerchant(newMerchant), error: null };

        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Reject merchant (admin only)
    async reject(id: string, reason: string): Promise<ApiResponse<void>> {
        try {
            // Check if it's in pending_merchants first
            const { data: pendingData } = await supabase
                .from('pending_merchants')
                .select('id')
                .eq('id', id)
                .maybeSingle();

            if (pendingData) {
                // Update pending_merchants status
                const { error } = await supabase
                    .from('pending_merchants')
                    .update({
                        status: 'rejected',
                        rejection_reason: reason,
                        reviewed_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) return { success: false, data: undefined, error: error.message };
            } else {
                // Try merchants table (if revoking approval)
                const { error } = await supabase
                    .from('merchants')
                    .update({
                        status: 'rejected',
                        rejected_reason: reason
                    })
                    .eq('id', id);

                if (error) return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Delete merchant and all related data (admin only)
    // IMPORTANT: Transactions are PRESERVED to keep student savings history
    async delete(id: string): Promise<ApiResponse<void>> {
        try {
            // Get merchant name for transaction records before deletion
            const { data: merchantData } = await supabase
                .from('merchants')
                .select('business_name')
                .eq('id', id)
                .single();

            const merchantName = merchantData?.business_name || 'Deleted Store';

            // PRESERVE transactions - just disconnect from merchant and store the name
            // This keeps student savings history intact!
            const { error: transactionsError } = await supabase
                .from('transactions')
                .update({
                    merchant_id: null,
                    // Store merchant name in notes so history shows which store it was
                    notes: `[Store: ${merchantName}]`
                })
                .eq('merchant_id', id);

            if (transactionsError) {
                console.error('Error updating merchant transactions:', transactionsError);
            }

            // Delete all offers associated with this merchant
            const { error: offersError } = await supabase
                .from('offers')
                .delete()
                .eq('merchant_id', id);

            if (offersError) {
                console.error('Error deleting merchant offers:', offersError);
            }

            // Finally delete the merchant record
            const { error } = await supabase
                .from('merchants')
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

    // Update merchant profile
    async update(id: string, data: Partial<Merchant>): Promise<ApiResponse<Merchant>> {
        try {
            const dbData: any = {};
            if (data.businessName) dbData.business_name = data.businessName;
            if (data.description) dbData.description = data.description;
            if (data.phone) dbData.phone = data.phone;
            if (data.address) dbData.address = data.address;
            if (data.operatingHours) dbData.operating_hours = data.operatingHours;

            const { data: updated, error } = await supabase
                .from('merchants')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            return { success: true, data: mapDbToMerchant(updated), error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Upload merchant image
    async uploadImage(type: 'logo' | 'cover' | 'store' | 'document' | 'payment_qr', file: File): Promise<ApiResponse<string>> {
        try {
            // DEV MODE: Check for dev bypass
            const IS_DEV = process.env.NODE_ENV === 'development';
            let userId: string;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                userId = user.id;
            } else if (IS_DEV) {
                // In dev mode without real auth, use a dev user ID from localStorage or generate one
                const storedDevId = localStorage.getItem('dev_merchant_user_id');
                if (storedDevId) {
                    userId = storedDevId;
                } else {
                    userId = crypto.randomUUID();
                    localStorage.setItem('dev_merchant_user_id', userId);
                }
                console.log('DEV MODE: Using dev user ID for upload:', userId);
            } else {
                return { success: false, data: null, error: 'Not authenticated' };
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            let bucket: string;
            let path: string;
            let isPublic = true;

            switch (type) {
                case 'logo':
                    bucket = 'merchant-logos';
                    path = `${userId}/logo.${fileExt}`;
                    break;
                case 'cover':
                    bucket = 'merchant-covers';
                    path = `${userId}/cover.${fileExt}`;
                    break;
                case 'store':
                    bucket = 'merchant-stores';
                    path = `${userId}/${fileName}`;
                    break;
                case 'document':
                    bucket = 'merchant-documents';
                    path = `${userId}/${fileName}`;
                    isPublic = false;
                    break;
                case 'payment_qr':
                    bucket = 'merchant-payment-qr';
                    path = `${userId}/payment_qr.${fileExt}`;
                    isPublic = false;
                    break;
                default:
                    return { success: false, data: null, error: 'Invalid image type' };
            }

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { upsert: true });

            if (uploadError) {
                return { success: false, data: null, error: uploadError.message };
            }

            // Get URL
            let url: string;
            if (isPublic) {
                const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                url = data.publicUrl;
            } else {
                const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
                url = data?.signedUrl || '';
            }

            return { success: true, data: url, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    },

    // Add store image to merchant
    async addStoreImage(merchantId: string, imageUrl: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('merchant_store_images')
                .insert({
                    merchant_id: merchantId,
                    image_url: imageUrl
                });

            if (error) {
                return { success: false, data: undefined, error: error.message };
            }

            return { success: true, data: undefined, error: null };
        } catch (error: any) {
            return { success: false, data: undefined, error: error.message };
        }
    },

    // Get stats (admin dashboard)
    async getStats(): Promise<{
        total: number;
        approved: number;
        pending: number;
        rejected: number;
    }> {
        try {
            const { count: total } = await supabase
                .from('merchants')
                .select('*', { count: 'exact', head: true });

            const { count: approved } = await supabase
                .from('merchants')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved');

            // Pending merchants are in pending_merchants table!
            const { count: pending } = await supabase
                .from('pending_merchants')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: rejected } = await supabase
                .from('merchants')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'rejected');

            return {
                total: (total || 0) + (pending || 0), // Include pending in total
                approved: approved || 0,
                pending: pending || 0,
                rejected: rejected || 0
            };
        } catch (error) {
            return { total: 0, approved: 0, pending: 0, rejected: 0 };
        }
    },

    // Get merchant dashboard stats
    async getDashboardStats(merchantId: string): Promise<{
        todayEarnings: number;
        totalRedemptions: number;
        activeOffers: number;
        totalRevenue: number;
    }> {
        try {
            // Get merchant data
            const { data: merchant } = await supabase
                .from('merchants')
                .select('total_redemptions, total_revenue')
                .eq('id', merchantId)
                .single();

            // Get today's earnings
            const today = new Date().toISOString().split('T')[0];
            const { data: todayTransactions } = await supabase
                .from('transactions')
                .select('final_amount')
                .eq('merchant_id', merchantId)
                .gte('redeemed_at', today);

            const todayEarnings = todayTransactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

            // Get active offers count
            const { count: activeOffers } = await supabase
                .from('offers')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId)
                .eq('status', 'active');

            return {
                todayEarnings,
                totalRedemptions: merchant?.total_redemptions || 0,
                activeOffers: activeOffers || 0,
                totalRevenue: Number(merchant?.total_revenue) || 0
            };
        } catch (error) {
            return { todayEarnings: 0, totalRedemptions: 0, activeOffers: 0, totalRevenue: 0 };
        }
    },

    // Get featured brands for explore page
    async getFeaturedBrands(): Promise<ApiResponse<Merchant[]>> {
        try {
            const { data, error } = await supabase
                .from('featured_brands')
                .select(`
                    merchant_id,
                    merchants (*)
                `)
                .eq('is_active', true)
                .order('display_order');

            if (error) {
                return { success: false, data: null, error: error.message };
            }

            const merchants = data
                .map((item: any) => item.merchants)
                .filter((m: any) => m !== null)
                .map(mapDbToMerchant);

            return { success: true, data: merchants, error: null };
        } catch (error: any) {
            return { success: false, data: null, error: error.message };
        }
    }
};
