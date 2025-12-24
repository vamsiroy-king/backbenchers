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
