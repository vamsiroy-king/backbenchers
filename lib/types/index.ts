// Type definitions for Backbenchers Platform
// These match the Supabase schema structure

export interface Student {
    id: string;
    bbId: string | null; // BB-XXXXXX - null until verified
    name: string;
    email: string;
    collegeEmail?: string; // College email for verification
    phone?: string;
    college: string;
    city: string;
    state: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    profileImage?: string | null;
    status: 'pending' | 'verified' | 'suspended';
    totalSavings: number;
    totalRedemptions: number;
    createdAt: string;
    verifiedAt?: string;
    selectedCity?: string | null; // User's preferred browsing city
}

export interface Merchant {
    id: string;
    bbmId: string | null; // BBM-XXXXXX - null until approved
    businessName: string;
    ownerName: string;
    ownerPhone: string; // Owner's personal phone (+91...)
    email: string;
    phone: string; // Business phone (optional)
    category: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    logo?: string;
    coverPhoto?: string;
    storeImages: string[];
    gstCertificate?: string;
    shopLicense?: string;
    operatingHours?: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    totalOffers: number;
    totalRedemptions: number;
    createdAt: string;
    approvedAt?: string;
    rejectedReason?: string;
    // Location fields
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    googleMapsEmbed?: string;
    // Payment
    paymentQrUrl?: string;
}

export interface Offer {
    id: string;
    merchantId: string;
    merchantName?: string;
    merchantBbmId?: string;
    merchantLogo?: string;
    merchantCategory?: string;
    merchantCity?: string;
    title: string;
    description?: string;
    type: 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom';
    discountValue: number;
    originalPrice?: number;
    finalPrice?: number;
    discountAmount?: number;
    minPurchase?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil?: string;
    terms?: string;
    status: 'active' | 'paused' | 'expired';
    totalRedemptions: number;
    createdAt: string;
    freeItemName?: string;
    // Creator tracking
    createdByType?: 'admin' | 'merchant';
    createdById?: string;
    // Redemption rules
    maxPerStudent?: number | null;
    cooldownHours?: number | null;
    oneTimeOnly?: boolean;
    maxTotalRedemptions?: number | null;
}

export interface Transaction {
    id: string;
    studentId: string;
    studentName: string;
    studentBbId: string;
    merchantId: string;
    merchantName: string;
    merchantBbmId: string;
    offerId: string;
    offerTitle: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paymentMethod?: 'cash' | 'online';
    redeemedAt: string;
}

// Auth types
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'merchant' | 'admin' | 'pending';
    bbId?: string; // For students
    bbmId?: string; // For merchants
    isComplete?: boolean; // True if user completed full verification
    isSuspended?: boolean; // True if account is suspended by admin
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface OTPVerification {
    email: string;
    otp: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T | null;
    error?: string | null;
    message?: string; // Optional message for success responses
}

// Filter types
export interface StudentFilters {
    status?: 'all' | 'verified' | 'pending' | 'suspended';
    state?: string;
    city?: string;
    college?: string;
    search?: string;
    bbIdSearch?: string;
}

export interface MerchantFilters {
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    state?: string;
    city?: string;
    search?: string;
    bbmIdSearch?: string;
}

export interface OfferFilters {
    status?: 'all' | 'active' | 'paused';
    merchantId?: string;
    bbmIdSearch?: string;
    search?: string;
    merchantBbmId?: string;
    state?: string;  // Filter by merchant state
    city?: string;   // Filter by merchant city
}

export interface TransactionFilters {
    dateRange?: 'all' | 'today' | 'week' | 'month';
    studentBbId?: string;
    merchantBbmId?: string;
}

// Location data
export interface LocationData {
    states: string[];
    cities: Record<string, string[]>;
    colleges: Record<string, string[]>;
}

// =============================================
// MULTI-BRANCH MERCHANT SYSTEM TYPES
// =============================================

export type BrandType = 'national_chain' | 'regional_chain' | 'local' | 'franchise';
export type VerificationStatus = 'pending' | 'email_verified' | 'document_verified' | 'admin_verified' | 'rejected';
export type VerificationMethod = 'email_domain' | 'gstin' | 'document' | 'manual_admin';
export type OfferScope = 'brand_wide' | 'outlet_specific' | 'merchant_specific';

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    coverImageUrl?: string;
    description?: string;

    // Classification
    brandType: BrandType;
    category: string;
    subCategory?: string;

    // Corporate Contact
    corporateEmail?: string;
    corporatePhone?: string;
    website?: string;
    instagram?: string;

    // Verification
    verificationStatus: VerificationStatus;
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;

    // Owner
    ownerUserId?: string;

    // Settings
    allowOutletOffers: boolean;
    isActive: boolean;

    // Stats
    totalOutlets: number;
    totalOffers: number;
    totalRedemptions: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;

    // Nested data (populated when needed)
    outlets?: Outlet[];
}

export interface OperatingHours {
    open: string;
    close: string;
    closed: boolean;
}

export interface WeeklyOperatingHours {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
}

export interface Outlet {
    id: string;
    brandId: string;

    // Basic Info
    name: string;
    outletCode?: string;

    // Location
    address: string;
    area?: string;
    city: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;

    // Google Maps
    googleMapsUrl?: string;
    googlePlaceId?: string;

    // Contact
    phone?: string;
    email?: string;
    whatsapp?: string;

    // Manager
    managerName?: string;
    managerPhone?: string;
    managerUserId?: string;

    // Images
    coverImageUrl?: string;
    images?: OutletImage[];

    // Operating Hours
    operatingHours: WeeklyOperatingHours;

    // Stats
    totalRedemptions: number;

    // Status
    isActive: boolean;

    // Timestamps
    createdAt: string;
    updatedAt: string;

    // Nested data
    brand?: Brand;
}

export interface OutletImage {
    id: string;
    outletId: string;
    imageUrl: string;
    displayOrder: number;
    createdAt: string;
}

export interface BrandVerification {
    id: string;
    brandId: string;

    // Method
    method: VerificationMethod;

    // Email verification
    corporateDomain?: string;
    verificationEmail?: string;
    emailVerifiedAt?: string;

    // GSTIN verification
    gstin?: string;
    gstinVerified: boolean;
    gstinBusinessName?: string;

    // Document verification
    documentType?: 'trademark' | 'incorporation_cert' | 'gst_certificate';
    documentUrl?: string;
    documentVerified: boolean;
    documentVerifiedAt?: string;

    // Admin
    adminNotes?: string;
    verifiedByAdmin?: string;

    // Status
    status: 'pending' | 'verified' | 'rejected';

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// Extended Offer type with brand/outlet support
export interface BrandOffer extends Offer {
    brandId?: string;
    outletId?: string;
    offerScope: OfferScope;
    brandName?: string;
    outletName?: string;
}
