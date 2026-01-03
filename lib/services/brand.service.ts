/**
 * Brand Service
 * Handles all operations for brands and outlets (multi-branch merchant system)
 */

import { supabase } from '@/lib/supabase';
import {
    Brand,
    Outlet,
    OutletImage,
    BrandVerification,
    BrandType,
    VerificationStatus,
    ApiResponse,
} from '@/lib/types';

// =============================================
// HELPER: Convert DB to TypeScript format
// =============================================

function dbToBrand(record: Record<string, unknown>): Brand {
    return {
        id: record.id as string,
        name: record.name as string,
        slug: record.slug as string,
        logoUrl: record.logo_url as string | undefined,
        coverImageUrl: record.cover_image_url as string | undefined,
        description: record.description as string | undefined,
        brandType: record.brand_type as BrandType,
        category: record.category as string,
        subCategory: record.sub_category as string | undefined,
        corporateEmail: record.corporate_email as string | undefined,
        corporatePhone: record.corporate_phone as string | undefined,
        website: record.website as string | undefined,
        instagram: record.instagram as string | undefined,
        verificationStatus: record.verification_status as VerificationStatus,
        verifiedAt: record.verified_at as string | undefined,
        verifiedBy: record.verified_by as string | undefined,
        rejectionReason: record.rejection_reason as string | undefined,
        ownerUserId: record.owner_user_id as string | undefined,
        allowOutletOffers: record.allow_outlet_offers as boolean,
        isActive: record.is_active as boolean,
        totalOutlets: record.total_outlets as number,
        totalOffers: record.total_offers as number,
        totalRedemptions: record.total_redemptions as number,
        createdAt: record.created_at as string,
        updatedAt: record.updated_at as string,
    };
}

function dbToOutlet(record: Record<string, unknown>): Outlet {
    return {
        id: record.id as string,
        brandId: record.brand_id as string,
        name: record.name as string,
        outletCode: record.outlet_code as string | undefined,
        address: record.address as string,
        area: record.area as string | undefined,
        city: record.city as string,
        state: record.state as string | undefined,
        pincode: record.pincode as string | undefined,
        latitude: record.latitude as number | undefined,
        longitude: record.longitude as number | undefined,
        googleMapsUrl: record.google_maps_url as string | undefined,
        googlePlaceId: record.google_place_id as string | undefined,
        phone: record.phone as string | undefined,
        email: record.email as string | undefined,
        whatsapp: record.whatsapp as string | undefined,
        managerName: record.manager_name as string | undefined,
        managerPhone: record.manager_phone as string | undefined,
        managerUserId: record.manager_user_id as string | undefined,
        coverImageUrl: record.cover_image_url as string | undefined,
        operatingHours: record.operating_hours as Outlet['operatingHours'],
        totalRedemptions: record.total_redemptions as number,
        isActive: record.is_active as boolean,
        createdAt: record.created_at as string,
        updatedAt: record.updated_at as string,
    };
}

// =============================================
// BRAND OPERATIONS
// =============================================

export async function createBrand(data: {
    name: string;
    brandType: BrandType;
    category: string;
    subCategory?: string;
    description?: string;
    corporateEmail?: string;
    corporatePhone?: string;
    website?: string;
    instagram?: string;
    logoUrl?: string;
    coverImageUrl?: string;
}): Promise<ApiResponse<Brand>> {
    try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Generate slug from name
        const slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const { data: brand, error } = await supabase
            .from('brands')
            .insert({
                name: data.name,
                slug,
                brand_type: data.brandType,
                category: data.category,
                sub_category: data.subCategory,
                description: data.description,
                corporate_email: data.corporateEmail,
                corporate_phone: data.corporatePhone,
                website: data.website,
                instagram: data.instagram,
                logo_url: data.logoUrl,
                cover_image_url: data.coverImageUrl,
                owner_user_id: user.user.id,
                verification_status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: dbToBrand(brand) };
    } catch (error) {
        console.error('Error creating brand:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBrandById(brandId: string): Promise<ApiResponse<Brand>> {
    try {
        const { data: brand, error } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single();

        if (error) throw error;

        return { success: true, data: dbToBrand(brand) };
    } catch (error) {
        console.error('Error fetching brand:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBrandBySlug(slug: string): Promise<ApiResponse<Brand>> {
    try {
        const { data: brand, error } = await supabase
            .from('brands')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;

        return { success: true, data: dbToBrand(brand) };
    } catch (error) {
        console.error('Error fetching brand by slug:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getBrandWithOutlets(brandId: string): Promise<ApiResponse<Brand>> {
    try {
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single();

        if (brandError) throw brandError;

        const { data: outlets, error: outletsError } = await supabase
            .from('outlets')
            .select('*')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('name');

        if (outletsError) throw outletsError;

        const brandData = dbToBrand(brand);
        brandData.outlets = outlets.map(dbToOutlet);

        return { success: true, data: brandData };
    } catch (error) {
        console.error('Error fetching brand with outlets:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getMyBrands(): Promise<ApiResponse<Brand[]>> {
    try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: brands, error } = await supabase
            .from('brands')
            .select('*')
            .eq('owner_user_id', user.user.id)
            .order('name');

        if (error) throw error;

        return { success: true, data: brands.map(dbToBrand) };
    } catch (error) {
        console.error('Error fetching my brands:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateBrand(
    brandId: string,
    data: Partial<Brand>
): Promise<ApiResponse<Brand>> {
    try {
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.subCategory !== undefined) updateData.sub_category = data.subCategory;
        if (data.corporateEmail !== undefined) updateData.corporate_email = data.corporateEmail;
        if (data.corporatePhone !== undefined) updateData.corporate_phone = data.corporatePhone;
        if (data.website !== undefined) updateData.website = data.website;
        if (data.instagram !== undefined) updateData.instagram = data.instagram;
        if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
        if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
        if (data.allowOutletOffers !== undefined) updateData.allow_outlet_offers = data.allowOutletOffers;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        const { data: brand, error } = await supabase
            .from('brands')
            .update(updateData)
            .eq('id', brandId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: dbToBrand(brand) };
    } catch (error) {
        console.error('Error updating brand:', error);
        return { success: false, error: (error as Error).message };
    }
}

// =============================================
// OUTLET OPERATIONS
// =============================================

export async function createOutlet(data: {
    brandId: string;
    name: string;
    outletCode?: string;
    address: string;
    area?: string;
    city: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    whatsapp?: string;
    managerName?: string;
    managerPhone?: string;
    coverImageUrl?: string;
    operatingHours?: Outlet['operatingHours'];
}): Promise<ApiResponse<Outlet>> {
    try {
        const { data: outlet, error } = await supabase
            .from('outlets')
            .insert({
                brand_id: data.brandId,
                name: data.name,
                outlet_code: data.outletCode,
                address: data.address,
                area: data.area,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                latitude: data.latitude,
                longitude: data.longitude,
                phone: data.phone,
                email: data.email,
                whatsapp: data.whatsapp,
                manager_name: data.managerName,
                manager_phone: data.managerPhone,
                cover_image_url: data.coverImageUrl,
                operating_hours: data.operatingHours,
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: dbToOutlet(outlet) };
    } catch (error) {
        console.error('Error creating outlet:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getOutletById(outletId: string): Promise<ApiResponse<Outlet>> {
    try {
        const { data: outlet, error } = await supabase
            .from('outlets')
            .select('*')
            .eq('id', outletId)
            .single();

        if (error) throw error;

        return { success: true, data: dbToOutlet(outlet) };
    } catch (error) {
        console.error('Error fetching outlet:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getOutletsByBrandId(brandId: string): Promise<ApiResponse<Outlet[]>> {
    try {
        const { data: outlets, error } = await supabase
            .from('outlets')
            .select('*')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        return { success: true, data: outlets.map(dbToOutlet) };
    } catch (error) {
        console.error('Error fetching outlets:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getNearbyOutlets(
    brandId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10
): Promise<ApiResponse<Outlet[]>> {
    try {
        // Using Haversine formula in SQL for distance calculation
        const { data: outlets, error } = await supabase.rpc('get_nearby_outlets', {
            p_brand_id: brandId,
            p_lat: latitude,
            p_lng: longitude,
            p_radius_km: radiusKm,
        });

        if (error) {
            // Fallback to simple query if RPC doesn't exist
            const { data: allOutlets, error: fallbackError } = await supabase
                .from('outlets')
                .select('*')
                .eq('brand_id', brandId)
                .eq('is_active', true);

            if (fallbackError) throw fallbackError;

            // Manual distance calculation
            const outletsWithDistance = allOutlets
                .filter((o) => o.latitude && o.longitude)
                .map((o) => ({
                    outlet: o,
                    distance: calculateDistance(
                        latitude,
                        longitude,
                        o.latitude,
                        o.longitude
                    ),
                }))
                .filter((o) => o.distance <= radiusKm)
                .sort((a, b) => a.distance - b.distance)
                .map((o) => o.outlet);

            return { success: true, data: outletsWithDistance.map(dbToOutlet) };
        }

        return { success: true, data: outlets.map(dbToOutlet) };
    } catch (error) {
        console.error('Error fetching nearby outlets:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateOutlet(
    outletId: string,
    data: Partial<Outlet>
): Promise<ApiResponse<Outlet>> {
    try {
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.outletCode !== undefined) updateData.outlet_code = data.outletCode;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.area !== undefined) updateData.area = data.area;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.state !== undefined) updateData.state = data.state;
        if (data.pincode !== undefined) updateData.pincode = data.pincode;
        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
        if (data.managerName !== undefined) updateData.manager_name = data.managerName;
        if (data.managerPhone !== undefined) updateData.manager_phone = data.managerPhone;
        if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
        if (data.operatingHours !== undefined) updateData.operating_hours = data.operatingHours;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;

        const { data: outlet, error } = await supabase
            .from('outlets')
            .update(updateData)
            .eq('id', outletId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: dbToOutlet(outlet) };
    } catch (error) {
        console.error('Error updating outlet:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteOutlet(outletId: string): Promise<ApiResponse<null>> {
    try {
        const { error } = await supabase
            .from('outlets')
            .delete()
            .eq('id', outletId);

        if (error) throw error;

        return { success: true, data: null };
    } catch (error) {
        console.error('Error deleting outlet:', error);
        return { success: false, error: (error as Error).message };
    }
}

// =============================================
// VERIFICATION OPERATIONS
// =============================================

export async function createEmailVerification(
    brandId: string,
    email: string
): Promise<ApiResponse<{ verificationId: string }>> {
    try {
        // Extract domain from email
        const domain = email.split('@')[1];

        const { data, error } = await supabase
            .from('brand_verifications')
            .insert({
                brand_id: brandId,
                method: 'email_domain',
                corporate_domain: domain,
                verification_email: email,
                status: 'pending',
            })
            .select('id')
            .single();

        if (error) throw error;

        // TODO: Send OTP email here
        // For now, just return success

        return { success: true, data: { verificationId: data.id } };
    } catch (error) {
        console.error('Error creating email verification:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function verifyBrandEmail(
    verificationId: string,
    otp: string
): Promise<ApiResponse<null>> {
    try {
        // TODO: Verify OTP
        // For now, just mark as verified

        const { error: verifyError } = await supabase
            .from('brand_verifications')
            .update({
                email_verified_at: new Date().toISOString(),
                status: 'verified',
            })
            .eq('id', verificationId);

        if (verifyError) throw verifyError;

        // Get brand ID and update brand status
        const { data: verification } = await supabase
            .from('brand_verifications')
            .select('brand_id')
            .eq('id', verificationId)
            .single();

        if (verification) {
            await supabase
                .from('brands')
                .update({
                    verification_status: 'email_verified',
                    verified_at: new Date().toISOString(),
                })
                .eq('id', verification.brand_id);
        }

        return { success: true, data: null };
    } catch (error) {
        console.error('Error verifying brand email:', error);
        return { success: false, error: (error as Error).message };
    }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// =============================================
// EXPORTS
// =============================================

export const brandService = {
    // Brand operations
    createBrand,
    getBrandById,
    getBrandBySlug,
    getBrandWithOutlets,
    getMyBrands,
    updateBrand,

    // Outlet operations
    createOutlet,
    getOutletById,
    getOutletsByBrandId,
    getNearbyOutlets,
    updateOutlet,
    deleteOutlet,

    // Verification
    createEmailVerification,
    verifyBrandEmail,
};

export default brandService;
