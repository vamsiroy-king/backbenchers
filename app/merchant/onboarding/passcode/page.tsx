"use client";

import { Button } from "@/components/ui/button";
import { KeyRound, Check, ArrowRight, Shield, Lock, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

// Helper to hash passcode
async function hashPasscode(passcode: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(passcode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasscodeSetupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [passcode, setPasscode] = useState(["", "", "", "", "", ""]);
    const [confirmPasscode, setConfirmPasscode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check for saved onboarding data
    const [hasData, setHasData] = useState(false);
    useEffect(() => {
        const business = localStorage.getItem('merchant_business');
        const location = localStorage.getItem('merchant_location');
        const documents = localStorage.getItem('merchant_documents');
        setHasData(!!business && !!location);
    }, []);

    const handlePasscodeChange = (index: number, value: string, isConfirm: boolean = false) => {
        if (value.length > 1) return;

        const currentPasscode = isConfirm ? [...confirmPasscode] : [...passcode];
        currentPasscode[index] = value;

        if (isConfirm) {
            setConfirmPasscode(currentPasscode);
        } else {
            setPasscode(currentPasscode);
        }

        setError("");

        // Auto-advance to next input
        const refs = isConfirm ? confirmRefs : inputRefs;
        if (value && index < 5) {
            refs.current[index + 1]?.focus();
        }

        // Auto-proceed when 6 digits entered
        if (currentPasscode.every(d => d.length === 1)) {
            if (!isConfirm) {
                // Move to confirm step
                setTimeout(() => {
                    setStep('confirm');
                    setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                }, 300);
            } else {
                // Validate and complete
                if (currentPasscode.join('') === passcode.join('')) {
                    handleComplete(currentPasscode.join(''));
                } else {
                    setError("Passcodes don't match. Try again.");
                    setConfirmPasscode(["", "", "", "", "", ""]);
                    setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                }
            }
        }
    };

    const handleComplete = async (passcodeValue: string) => {
        setLoading(true);
        setError("");

        try {
            // Get saved onboarding data
            const businessData = JSON.parse(localStorage.getItem('merchant_business') || '{}');
            const locationData = JSON.parse(localStorage.getItem('merchant_location') || '{}');
            const documentsData = JSON.parse(localStorage.getItem('merchant_documents') || '{}');
            const mapsData = JSON.parse(localStorage.getItem('merchant_maps') || '{}');

            if (!businessData.businessName) {
                setError("Missing business information. Please start over.");
                setLoading(false);
                return;
            }

            // Hash the passcode
            const hashedPasscode = await hashPasscode(passcodeValue);

            // Create merchant record in Supabase with image URLs
            const result = await authService.completeMerchantOnboarding({
                businessName: businessData.businessName,
                category: businessData.category || 'General',
                subCategory: businessData.subCategory, // Sub-category
                description: businessData.description || '',
                address: locationData.address || businessData.address || '',
                city: locationData.city || businessData.city || '',
                state: locationData.state || businessData.state || '',
                pincode: locationData.pincode || businessData.pincode || '',
                phone: businessData.phone || businessData.businessPhone || '',
                ownerPhone: businessData.ownerPhone || '',
                ownerName: businessData.ownerName || '',
                gstNumber: businessData.gstNumber,
                panNumber: businessData.panNumber,
                // Include uploaded image URLs
                logoUrl: documentsData.logo?.url,
                coverPhotoUrl: documentsData.coverPhoto?.url,
                storeImageUrls: documentsData.storeImages?.map((img: any) => img.url).filter(Boolean) || [],
                // Include Google Maps data - prefer from location form, fallback to maps page
                latitude: locationData.latitude || mapsData.latitude || businessData.latitude,
                longitude: locationData.longitude || mapsData.longitude || businessData.longitude,
                googleMapsLink: locationData.googleMapsLink || mapsData.googleMapsLink || businessData.googleMapsLink,
                googleMapsEmbed: mapsData.googleMapsEmbed,
                // Operating hours (store timings)
                operatingHours: businessData.operatingHours,
                // Payment QR code
                paymentQrUrl: documentsData.paymentQr?.url,
            });

            if (result.success) {
                // Store passcode hash and merchant ID
                localStorage.setItem('merchant_passcode_hash', hashedPasscode);
                const merchantId = result.data?.merchantId || '';
                localStorage.setItem('merchant_id', merchantId);

                // Create first offer if saved during onboarding
                const firstOfferData = localStorage.getItem('merchant_first_offer');
                if (firstOfferData && merchantId) {
                    try {
                        const offer = JSON.parse(firstOfferData);
                        // Import offer service dynamically to create the offer
                        const { offerService } = await import('@/lib/services/offer.service');
                        await offerService.createForMerchant(merchantId, {
                            title: offer.title,
                            type: offer.type,
                            discountValue: offer.discountValue,
                            minOrderValue: offer.minOrderValue || undefined,
                            freeItemName: offer.freeItemName || undefined,
                            terms: offer.terms || [],
                            status: 'pending', // Will become active when merchant is approved
                        });
                    } catch (offerError) {
                        console.error('Error creating first offer:', offerError);
                        // Don't block onboarding if offer creation fails
                    }
                }

                // Clear onboarding data
                localStorage.removeItem('merchant_business');
                localStorage.removeItem('merchant_location');
                localStorage.removeItem('merchant_documents');
                localStorage.removeItem('merchant_pending_email');
                localStorage.removeItem('merchant_pending_password');
                localStorage.removeItem('merchant_first_offer');
                localStorage.removeItem('merchant_maps');

                // Redirect to pending page
                router.push('/merchant/onboarding/pending');
            } else {
                // Show user-friendly error messages
                let errorMessage = result.error || "Failed to create merchant account";
                if (errorMessage.includes('merchants_owner_phone_unique') || errorMessage.includes('owner_phone')) {
                    errorMessage = "A merchant with this phone number already exists. Please use a different phone number.";
                } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
                    errorMessage = "An account with these details already exists. Please check your information.";
                }
                setError(errorMessage);
            }
        } catch (error: any) {
            console.error("Error creating merchant:", error);
            let errorMessage = error.message || "Something went wrong";
            if (errorMessage.includes('merchants_owner_phone_unique') || errorMessage.includes('owner_phone')) {
                errorMessage = "A merchant with this phone number already exists. Please use a different phone number.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
        const currentPasscode = isConfirm ? confirmPasscode : passcode;
        const refs = isConfirm ? confirmRefs : inputRefs;

        if (e.key === 'Backspace' && !currentPasscode[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-white pb-8">
            {/* Progress Bar */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "80%" }}
                            animate={{ width: step === 'confirm' ? "100%" : "90%" }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Final Step</span>
                </div>
            </div>

            <div className="px-6 pt-8">
                <AnimatePresence mode="wait">
                    {step === 'create' ? (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <KeyRound className="h-10 w-10 text-primary" />
                                </div>
                                <h1 className="text-2xl font-extrabold mb-2">Create Quick Passcode</h1>
                                <p className="text-gray-500 text-sm">
                                    Set up a 6-digit passcode for fast, hassle-free login
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-gray-600">Quick & secure login</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Lock className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-gray-600">No need to type email & password every time</p>
                                </div>
                            </div>

                            {/* Passcode Input */}
                            <div>
                                <p className="text-center text-sm text-gray-500 mb-4">Enter 6-digit passcode</p>
                                <div className="flex justify-center gap-3">
                                    {passcode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePasscodeChange(index, e.target.value.replace(/\D/g, ''))}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            disabled={loading}
                                            className="w-12 h-14 bg-gray-100 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <div className="h-20 w-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    {loading ? (
                                        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
                                    ) : (
                                        <Check className="h-10 w-10 text-green-600" />
                                    )}
                                </div>
                                <h1 className="text-2xl font-extrabold mb-2">
                                    {loading ? "Creating Your Account..." : "Confirm Passcode"}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {loading ? "Please wait while we set up your merchant profile" : "Re-enter your passcode to confirm"}
                                </p>
                            </div>

                            {/* Confirm Passcode Input */}
                            {!loading && (
                                <div>
                                    <p className="text-center text-sm text-gray-500 mb-4">Confirm 6-digit passcode</p>
                                    <div className="flex justify-center gap-3">
                                        {confirmPasscode.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { confirmRefs.current[index] = el; }}
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePasscodeChange(index, e.target.value.replace(/\D/g, ''), true)}
                                                onKeyDown={(e) => handleKeyDown(index, e, true)}
                                                disabled={loading}
                                                className={`w-12 h-14 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all ${error ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-100 focus:bg-primary/5'}`}
                                            />
                                        ))}
                                    </div>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center text-red-500 text-sm mt-3"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>
                            )}

                            {/* Back Button */}
                            {!loading && (
                                <button
                                    onClick={() => {
                                        setStep('create');
                                        setPasscode(["", "", "", "", "", ""]);
                                        setConfirmPasscode(["", "", "", "", "", ""]);
                                        setError("");
                                    }}
                                    className="w-full text-center text-primary text-sm font-medium"
                                >
                                    ← Start over
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Security Note */}
                <div className="mt-12 bg-yellow-50 rounded-2xl p-4">
                    <p className="text-xs text-yellow-700 text-center">
                        🔒 Your passcode is stored securely and encrypted. Never share it with anyone.
                    </p>
                </div>
            </div>
        </div>
    );
}
