// Auth Service - Complete Supabase Authentication
// Flow: Google OAuth → Link .edu.in email → OTP verify → Profile complete

import { supabase } from '../supabase';
import { AuthUser, ApiResponse } from '../types';
import { rateLimiter } from './rateLimiter.service';

// Session storage keys
const PASSCODE_KEY = 'bb_passcode_hash';
const DEVICE_ID_KEY = 'bb_device_id';

// Generate device ID for device-bound passcode
const getOrCreateDeviceId = (): string => {
    if (typeof window === 'undefined') return '';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

// Simple hash for passcode
const hashPasscode = (passcode: string): string => {
    return btoa(passcode + '_bb_salt_' + getOrCreateDeviceId());
};

// =============================================
// UNIVERSAL STRICT COLLEGE EMAIL VALIDATION
// =============================================
// ALLOWED DOMAINS (NO EXCEPTIONS WORLDWIDE):
// - .ac.in   (Indian academic institutions)
// - .edu.in  (Indian educational institutions)
// - .edu     (International educational institutions)
// 
// NO OTHER DOMAINS ARE ALLOWED. EVER.
// This is a UNIVERSAL security rule for all students.
// =============================================

export const ALLOWED_COLLEGE_DOMAINS = ['.ac.in', '.edu.in', '.edu'] as const;

// DEV MODE: Allow test emails for local testing
const IS_DEV = process.env.NODE_ENV === 'development';
export const DEV_TEST_EMAIL = 'test@student.edu';
export const DEV_MERCHANT_EMAIL = 'test@merchant.dev';
export const DEV_TEST_OTP = '123456';

export const isValidStudentEmail = (email: string): boolean => {
    const emailLower = email.toLowerCase().trim();

    // DEV MODE: Allow test email
    if (IS_DEV && emailLower === DEV_TEST_EMAIL) {
        return true;
    }

    // STRICT: Only allowed college domains
    return ALLOWED_COLLEGE_DOMAINS.some(domain => emailLower.endsWith(domain));
};

// Get clean error message for invalid domain
export const getInvalidDomainError = (): string => {
    if (IS_DEV) {
        return `Please use your official college email. For testing, use: ${DEV_TEST_EMAIL}`;
    }
    return 'Please use your official college email';
};


export const authService = {
    // =============================================
    // SESSION MANAGEMENT
    // =============================================

    async hasActiveSession(): Promise<boolean> {
        // DEV MODE: Check for dev test user
        if (IS_DEV && typeof window !== 'undefined') {
            const devTestUser = localStorage.getItem('dev_test_user');
            if (devTestUser) return true;
        }
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    async getCurrentUser(): Promise<AuthUser | null> {
        // DEV MODE: Check for dev test user in localStorage
        if (IS_DEV && typeof window !== 'undefined') {
            const devTestUser = localStorage.getItem('dev_test_user');
            if (devTestUser) {
                try {
                    const student = JSON.parse(devTestUser);
                    console.log('DEV MODE: Using dev test user:', student.email);
                    return {
                        id: student.id,
                        email: student.email,
                        name: student.name,
                        role: 'student',
                        bbId: student.bb_id,
                        isComplete: student.status !== 'pending',
                        isSuspended: student.status === 'suspended'
                    };
                } catch (e) {
                    console.error('Failed to parse dev test user:', e);
                    localStorage.removeItem('dev_test_user');
                }
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        console.log('getCurrentUser - Auth user:', user.id, user.email);

        // Check if student by user_id
        let { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        console.log('getCurrentUser - Student by user_id:', student?.id, 'Error:', studentError?.message);

        // If not found by user_id, try by email (for returning users with mismatched user_id)
        if (!student && user.email) {
            const { data: studentByEmail } = await supabase
                .from('students')
                .select('*')
                .eq('email', user.email.toLowerCase())
                .maybeSingle();

            if (studentByEmail) {
                // Sync the user_id
                if (studentByEmail.user_id !== user.id) {
                    await supabase
                        .from('students')
                        .update({ user_id: user.id })
                        .eq('id', studentByEmail.id);
                }
                student = studentByEmail;
            }
        }

        if (student) {
            return {
                id: student.id,
                email: student.email,
                name: student.name,
                role: 'student',
                bbId: student.bb_id,
                isComplete: student.status !== 'pending', // Check if verification complete
                isSuspended: student.status === 'suspended' // Check if suspended by admin
            };
        }

        // Check if merchant
        const { data: merchant } = await supabase
            .from('merchants')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (merchant) {
            return {
                id: merchant.id,
                email: merchant.email,
                name: merchant.business_name,
                role: 'merchant',
                bbmId: merchant.bbm_id,
                isComplete: merchant.status === 'approved',
                isSuspended: merchant.status === 'suspended' // Check if suspended by admin
            };
        }

        // Check if admin (wrapped in try-catch for dev environments where table may not exist)
        try {
            const { data: admin } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (admin) {
                return {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: 'admin',
                    isComplete: true
                };
            }
        } catch (e) {
            // Ignore admin check errors (table may not exist in dev)
            console.log('Admin check skipped (table may not exist)');
        }

        // User exists in Supabase Auth but no profile yet (needs to complete signup)
        return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            role: 'pending', // No profile yet
            isComplete: false
        };
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(PASSCODE_KEY);
            localStorage.removeItem(DEVICE_ID_KEY);
            localStorage.removeItem('dev_test_user'); // Clear dev test user
        }
    },

    // Alias for logout (backwards compatibility)
    async signOut(): Promise<void> {
        return this.logout();
    },

    // =============================================
    // GOOGLE OAUTH (STEP 1 FOR STUDENTS)
    // =============================================

    // Sign in with Google - First step for students
    async signInWithGoogle(redirectTo?: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
                    queryParams: {
                        prompt: 'select_account', // Only show account picker, no re-consent
                        access_type: 'offline',
                    }
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // =============================================
    // STUDENT AUTH - LINK COLLEGE EMAIL (STEP 2)
    // =============================================

    // Check if phone number already exists in database
    async checkPhoneExists(phone: string): Promise<boolean> {
        const { data } = await supabase
            .from('students')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
        return !!data;
    },

    // Check if college email already exists in database
    async checkCollegeEmailExists(collegeEmail: string): Promise<boolean> {
        const { data } = await supabase
            .from('students')
            .select('id')
            .eq('college_email', collegeEmail.toLowerCase())
            .maybeSingle();  // Use maybeSingle instead of single to avoid 406 when no row found

        return !!data;
    },

    // Send OTP to college email for verification
    // Uses signUp which sends 6-digit OTP code (Confirm Signup template in Supabase)
    async sendCollegeEmailOTP(collegeEmail: string): Promise<ApiResponse<void>> {
        const email = collegeEmail.toLowerCase().trim();

        // Rate limiting check
        const rateCheck = rateLimiter.check('otp_send', email);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: rateCheck.message || 'Too many OTP requests. Please wait and try again.'
            };
        }

        // STRICT validation - only allowed college domains
        if (!isValidStudentEmail(email)) {
            return {
                success: false,
                error: getInvalidDomainError()
            };
        }

        // Check if already registered in our students table
        const exists = await this.checkCollegeEmailExists(email);
        if (exists) {
            return {
                success: false,
                error: 'This college email is already registered with another account.'
            };
        }

        // DEV MODE: Skip actual OTP sending for test email
        if (IS_DEV && email === DEV_TEST_EMAIL) {
            console.log('DEV MODE: Skipping OTP send for test email. Use OTP:', DEV_TEST_OTP);
            return {
                success: true,
                message: `DEV MODE: Use OTP ${DEV_TEST_OTP} for ${email}`
            };
        }

        try {
            // Use signUp to send OTP code (Confirm Signup template in Supabase)
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: crypto.randomUUID(), // Random password since user won't use password login
            });

            console.log('SignUp response:', { data, error });


            if (error) {
                console.error('SignUp error:', error);
                // If user already exists in Supabase Auth (but not in students table), resend OTP
                if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                    console.log('User exists in auth, resending OTP...');
                    const { error: resendError } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                    });

                    if (resendError) {
                        console.error('Resend error:', resendError);
                        return { success: false, error: resendError.message };
                    }
                    console.log('OTP resent successfully');
                } else {
                    return { success: false, error: error.message };
                }
            }

            // Record successful OTP send for rate limiting
            rateLimiter.record('otp_send', email);

            return {
                success: true,
                message: `OTP sent to ${email}. Please check your inbox.`
            };
        } catch (err: any) {
            console.error('sendCollegeEmailOTP exception:', err);
            return { success: false, error: err.message };
        }
    },

    // Verify OTP and link college email to Google account
    async verifyCollegeEmailOTP(
        collegeEmail: string,
        otp: string,
        googleEmail: string, // The user's Google account email (must be passed in because OTP verification changes the session)
        studentData: {
            name: string;
            dob: string;
            gender: string;
            phone: string; // Indian mobile number with +91
            college: string;
            city: string;
            state: string;
            universityId?: string; // Optional university reference
        }
    ): Promise<ApiResponse<{ studentId: string }>> {
        try {
            const email = collegeEmail.toLowerCase().trim();

            // DEV MODE: Bypass OTP verification for test email
            const isDevTestBypass = IS_DEV && email === DEV_TEST_EMAIL && otp === DEV_TEST_OTP;

            if (!isDevTestBypass) {
                // Verify OTP (type must match how it was sent - 'signup' for signUp flow)
                const { data, error } = await supabase.auth.verifyOtp({
                    email: email,
                    token: otp,
                    type: 'signup'  // Must be 'signup' to match signUp method
                });

                if (error) {
                    return { success: false, error: 'Invalid OTP. Please try again.' };
                }
            } else {
                console.log('DEV MODE: Bypassing OTP verification for test email');
            }


            // Get current Google auth user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'Please sign in with Google first.' };
            }

            // Generate STRICTLY UNIQUE BB-ID with database check
            const generateUniqueBbId = async (): Promise<string> => {
                for (let attempt = 0; attempt < 10; attempt++) {
                    const num = Math.floor(100000 + Math.random() * 900000);
                    const candidateId = `BB-${num}`;

                    // Check if this BB-ID already exists
                    const { data: existing } = await supabase
                        .from('students')
                        .select('id')
                        .eq('bb_id', candidateId)
                        .single();

                    // If no existing record, this ID is unique
                    if (!existing) {
                        return candidateId;
                    }
                }
                // Fallback: use timestamp + random for guaranteed uniqueness
                return `BB-${Date.now().toString().slice(-6)}`;
            };

            // Note: BB ID is NOT generated here - it will be generated only when profile photo is uploaded
            // const uniqueBbId = await generateUniqueBbId();

            // Create student record WITHOUT BB-ID (will be generated after profile photo upload)
            // Manual Check & Update to avoid "ON CONFLICT" constraint errors
            const { data: existingStudent } = await supabase
                .from('students')
                .select('id')
                .or(`user_id.eq.${user.id},college_email.eq.${email}`)
                .maybeSingle();

            let student;
            const studentDataPayload = {
                user_id: user.id,
                email: googleEmail.toLowerCase(),
                college_email: email,
                name: studentData.name,
                dob: studentData.dob,
                gender: studentData.gender,
                phone: studentData.phone,
                college: studentData.college,
                city: studentData.city,
                state: studentData.state,
                bb_id: null,
                status: 'verified',
                total_savings: 0,
                total_redemptions: 0
            };

            if (existingStudent) {
                // UPDATE existing record
                const { data: updated, error: updateError } = await supabase
                    .from('students')
                    .update(studentDataPayload)
                    .eq('id', existingStudent.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                student = updated;
            } else {
                // INSERT new record
                const { data: inserted, error: insertError } = await supabase
                    .from('students')
                    .insert(studentDataPayload)
                    .select()
                    .single();

                if (insertError) throw insertError;
                student = inserted;
            }



            return {
                success: true,
                data: { studentId: student.id },
                message: 'College email verified! Please set up your passcode.'
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // =============================================
    // PASSCODE SETUP (STEP 3)
    // =============================================

    async setupStudentPasscode(studentId: string, passcode: string): Promise<ApiResponse<void>> {
        try {
            const hashedPasscode = hashPasscode(passcode);
            const deviceId = getOrCreateDeviceId();

            // Store passcode hash in database
            const { error } = await supabase
                .from('students')
                .update({
                    passcode_hash: hashedPasscode,
                    device_id: deviceId,
                    status: 'verified' // Mark as verified after passcode setup
                })
                .eq('id', studentId);

            if (error) {
                return { success: false, error: error.message };
            }

            // Store in localStorage for quick login
            localStorage.setItem(PASSCODE_KEY, hashedPasscode);

            return {
                success: true,
                message: 'Passcode set successfully! You can now use quick login.'
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // =============================================
    // STUDENT LOGIN
    // =============================================

    // Check if device has stored passcode session
    hasStoredPasscode(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(PASSCODE_KEY);
    },

    // Login with passcode (quick login for returning devices)
    async loginWithPasscode(passcode: string): Promise<ApiResponse<AuthUser>> {
        try {
            const hashedPasscode = hashPasscode(passcode);
            const storedHash = localStorage.getItem(PASSCODE_KEY);

            if (!storedHash || hashedPasscode !== storedHash) {
                return { success: false, error: 'Invalid passcode' };
            }

            // Get current user
            const user = await this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Session expired. Please sign in again.' };
            }

            return { success: true, data: user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Login with Google - redirects to callback which checks for existing account
    async loginWithGoogle(): Promise<ApiResponse<void>> {
        return this.signInWithGoogle(`${window.location.origin}/auth/callback`);
    },

    // =============================================
    // MERCHANT AUTH
    // =============================================

    // Merchant signup with email OTP
    async merchantSignupWithEmail(email: string): Promise<ApiResponse<void>> {
        try {
            // Check if already registered
            const { data: existing } = await supabase
                .from('merchants')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();

            if (existing) {
                return { success: false, error: 'This email is already registered.' };
            }

            // DEV MODE: Skip OTP for test merchant email
            if (IS_DEV && email.toLowerCase() === DEV_MERCHANT_EMAIL) {
                console.log('DEV MODE: Skipping OTP send for test merchant. Use OTP:', DEV_TEST_OTP);
                return { success: true, message: `DEV MODE: Use OTP ${DEV_TEST_OTP}` };
            }

            // Send OTP
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, message: 'OTP sent to your email.' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Merchant signup with Google - redirects to merchant auth callback
    async merchantSignupWithGoogle(): Promise<ApiResponse<void>> {
        try {
            // Determine the correct redirect URL
            // On production, we're already on merchant.backbenchers.app
            // The origin will be correct since we're ON the merchant subdomain
            let redirectUrl = `${window.location.origin}/merchant/auth/callback`;

            // If we detect we're on the main domain (shouldn't happen but safety check)
            // and not localhost, redirect to merchant subdomain
            const hostname = window.location.hostname;
            if (!hostname.includes('localhost') &&
                !hostname.startsWith('merchant.') &&
                hostname.includes('backbenchers')) {
                redirectUrl = `https://merchant.backbenchers.app/merchant/auth/callback`;
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account', // Always show account picker
                    }
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Verify merchant OTP and create profile
    async verifyMerchantOTP(
        email: string,
        otp: string
    ): Promise<ApiResponse<{ merchantId: string }>> {
        try {
            // DEV MODE: Bypass OTP verification for test merchant
            const isDevTestBypass = IS_DEV && email.toLowerCase() === DEV_MERCHANT_EMAIL && otp === DEV_TEST_OTP;

            let userId = '';

            if (!isDevTestBypass) {
                const { data, error } = await supabase.auth.verifyOtp({
                    email: email.toLowerCase(),
                    token: otp,
                    type: 'email'
                });

                if (error) {
                    return { success: false, error: 'Invalid OTP' };
                }
                userId = data.user?.id || '';
            } else {
                console.log('DEV MODE: Bypassing OTP verification for test merchant');
                // In dev mode, generate a fake user ID for testing
                userId = crypto.randomUUID();
            }

            // User is now authenticated, redirect to onboarding
            return {
                success: true,
                data: { merchantId: userId },
                message: 'Email verified! Please complete your business profile.'
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Complete merchant onboarding (called after all steps)
    // NOW INSERTS INTO pending_merchants - Admin approval moves to merchants table
    async completeMerchantOnboarding(merchantData: {
        businessName: string;
        category: string;
        subCategory?: string; // Sub-category
        brandType?: string; // 'single' | 'regional_chain' | 'national_chain'
        brandScale?: string; // 'single' | 'regional_chain' | 'national_chain'
        merchantType?: string; // 'chain_outlet' | 'local_store' | 'online_brand'
        brandId?: string; // For chain outlets - links to existing brand
        brandName?: string; // For display
        outletName?: string; // For chain outlets
        outletRole?: string; // 'manager' | 'franchise_owner' | 'owner'
        outletManagerName?: string;
        outletManagerPhone?: string;
        outletArea?: string; // Locality/area
        baseCity?: string; // For regional chains
        baseState?: string; // For regional chains
        description?: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        phone?: string;
        ownerPhone: string; // Owner's personal phone (+91...)
        ownerName: string;
        gstNumber?: string;
        panNumber?: string;
        logoUrl?: string;
        coverPhotoUrl?: string;
        storeImageUrls?: string[];
        // Google Maps location data
        latitude?: number;
        longitude?: number;
        googleMapsLink?: string;
        googleMapsEmbed?: string;
        // Operating hours
        operatingHours?: { [day: string]: { open: string; close: string; closed?: boolean } };
        // Payment QR code
        paymentQrUrl?: string;
    }): Promise<ApiResponse<{ merchantId: string }>> {
        try {
            // DEV MODE: Check for dev bypass
            let userId: string;
            let userEmail: string;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                userId = user.id;
                userEmail = user.email || '';
            } else if (IS_DEV) {
                // In dev mode without real auth, use dev user ID from localStorage
                const storedDevId = typeof window !== 'undefined' ? localStorage.getItem('dev_merchant_user_id') : null;
                if (storedDevId) {
                    userId = storedDevId;
                } else {
                    // Generate a valid UUID for dev mode (database expects UUID type)
                    userId = crypto.randomUUID();
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('dev_merchant_user_id', userId);
                    }
                }
                userEmail = DEV_MERCHANT_EMAIL;
                console.log('DEV MODE: Using dev user ID for onboarding:', userId);
            } else {
                return { success: false, error: 'Please sign in first.' };
            }

            // Check if already submitted an application (skip in dev mode for easier testing)
            if (!IS_DEV) {
                const { data: existingApplication } = await supabase
                    .from('pending_merchants')
                    .select('id, status')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existingApplication) {
                    return {
                        success: false,
                        error: existingApplication.status === 'pending'
                            ? 'You already have a pending application.'
                            : 'Application already processed.'
                    };
                }

                // Check if already approved merchant
                const { data: existingMerchant } = await supabase
                    .from('merchants')
                    .select('id')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (existingMerchant) {
                    return { success: false, error: 'You already have a merchant account.' };
                }
            }

            // Submit to pending_merchants table (NOT main merchants table)
            const { data: application, error } = await supabase
                .from('pending_merchants')
                .insert({
                    user_id: userId,
                    email: userEmail,
                    merchant_type: merchantData.merchantType || 'local_store', // chain_outlet, local_store, online_brand
                    brand_scale: merchantData.brandScale || merchantData.brandType || 'single', // single, regional_chain, national_chain
                    brand_id: merchantData.brandId || null, // For chain outlets
                    outlet_name: merchantData.outletName || null, // For chain outlets
                    outlet_role: merchantData.outletRole || null, // manager, franchise_owner, owner
                    outlet_manager_name: merchantData.outletManagerName || null,
                    outlet_manager_phone: merchantData.outletManagerPhone || null,
                    outlet_area: merchantData.outletArea || null,
                    base_city: merchantData.baseCity || null, // For regional chains
                    business_name: merchantData.businessName,
                    category: merchantData.category,
                    sub_category: merchantData.subCategory,
                    brand_type: merchantData.brandScale || merchantData.brandType || 'single', // Single store, regional_chain, or national_chain
                    description: merchantData.description || '',
                    address: merchantData.address,
                    city: merchantData.city,
                    state: merchantData.state,
                    pincode: merchantData.pincode,
                    phone: merchantData.phone || '',
                    owner_phone: merchantData.ownerPhone,
                    owner_name: merchantData.ownerName,
                    gst_number: merchantData.gstNumber,
                    pan_number: merchantData.panNumber,
                    logo_url: merchantData.logoUrl,
                    cover_photo_url: merchantData.coverPhotoUrl,
                    store_images: merchantData.storeImageUrls || [],
                    latitude: merchantData.latitude,
                    longitude: merchantData.longitude,
                    google_maps_link: merchantData.googleMapsLink,
                    google_maps_embed: merchantData.googleMapsEmbed,
                    operating_hours: merchantData.operatingHours,
                    payment_qr_url: merchantData.paymentQrUrl,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data: { merchantId: application.id },
                message: 'Application submitted! Pending admin approval.'
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Setup merchant passcode
    async setupMerchantPasscode(merchantId: string, passcode: string): Promise<ApiResponse<void>> {
        try {
            const hashedPasscode = hashPasscode(passcode);
            const deviceId = getOrCreateDeviceId();

            const { error } = await supabase
                .from('merchants')
                .update({
                    passcode_hash: hashedPasscode,
                    device_id: deviceId
                })
                .eq('id', merchantId);

            if (error) {
                return { success: false, error: error.message };
            }

            localStorage.setItem(PASSCODE_KEY, hashedPasscode);

            return { success: true, message: 'Passcode set successfully!' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // =============================================
    // ADMIN ACTIONS
    // =============================================

    // Verify student (admin action) - generates BB-ID
    async verifyStudent(studentId: string): Promise<ApiResponse<{ bbId: string }>> {
        try {
            // Call RPC to generate BB-ID
            const { data, error } = await supabase.rpc('generate_bb_id');

            if (error) {
                return { success: false, error: error.message };
            }

            const bbId = data;

            // Update student with BB-ID
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    bb_id: bbId,
                    status: 'verified'
                })
                .eq('id', studentId);

            if (updateError) {
                return { success: false, error: updateError.message };
            }

            return { success: true, data: { bbId } };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Approve merchant (admin action) - generates BBM-ID
    async approveMerchant(merchantId: string): Promise<ApiResponse<{ bbmId: string }>> {
        try {
            const { data, error } = await supabase.rpc('generate_bbm_id');

            if (error) {
                return { success: false, error: error.message };
            }

            const bbmId = data;

            const { error: updateError } = await supabase
                .from('merchants')
                .update({
                    bbm_id: bbmId,
                    status: 'approved'
                })
                .eq('id', merchantId);

            if (updateError) {
                return { success: false, error: updateError.message };
            }

            return { success: true, data: { bbmId } };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Reject merchant
    async rejectMerchant(merchantId: string, reason: string): Promise<ApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('merchants')
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                })
                .eq('id', merchantId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Save store images to merchant_store_images table
    async saveStoreImages(merchantId: string, imageUrls: string[]): Promise<void> {
        try {
            // Delete existing store images first
            await supabase
                .from('merchant_store_images')
                .delete()
                .eq('merchant_id', merchantId);

            // Insert new store images
            if (imageUrls.length > 0) {
                const inserts = imageUrls.map((url, index) => ({
                    merchant_id: merchantId,
                    image_url: url,
                    display_order: index
                }));

                await supabase
                    .from('merchant_store_images')
                    .insert(inserts);
            }
        } catch (error) {
            console.error('Error saving store images:', error);
        }
    }
};

export default authService;
