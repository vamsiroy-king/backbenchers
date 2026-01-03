"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, QrCode, Upload, X, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DAYS = [
    { id: "monday", label: "Mon" },
    { id: "tuesday", label: "Tue" },
    { id: "wednesday", label: "Wed" },
    { id: "thursday", label: "Thu" },
    { id: "friday", label: "Fri" },
    { id: "saturday", label: "Sat" },
    { id: "sunday", label: "Sun" },
];

const DEFAULT_HOURS = { open: "09:00", close: "21:00", closed: false };

export default function StoreTimingsPage() {
    const router = useRouter();
    const [sameForAllDays, setSameForAllDays] = useState(true);
    const [commonHours, setCommonHours] = useState({ open: "09:00", close: "21:00" });
    const [operatingHours, setOperatingHours] = useState<Record<string, typeof DEFAULT_HOURS>>({
        monday: { ...DEFAULT_HOURS },
        tuesday: { ...DEFAULT_HOURS },
        wednesday: { ...DEFAULT_HOURS },
        thursday: { ...DEFAULT_HOURS },
        friday: { ...DEFAULT_HOURS },
        saturday: { ...DEFAULT_HOURS },
        sunday: { open: "10:00", close: "18:00", closed: false },
    });

    const [paymentQr, setPaymentQr] = useState<{ url: string; file: File | null } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Apply common hours to all days when sameForAllDays is true
    useEffect(() => {
        if (sameForAllDays) {
            setOperatingHours(prev => {
                const updated: Record<string, typeof DEFAULT_HOURS> = {};
                DAYS.forEach(day => {
                    updated[day.id] = {
                        open: commonHours.open,
                        close: commonHours.close,
                        closed: prev[day.id]?.closed || false
                    };
                });
                return updated;
            });
        }
    }, [sameForAllDays, commonHours]);

    // Check if we have previous onboarding data
    useEffect(() => {
        const business = localStorage.getItem('merchant_business');
        if (!business) {
            router.push('/merchant/onboarding/business');
        }
    }, [router]);

    // Toggle day closed
    const toggleDayClosed = (day: string) => {
        setOperatingHours(prev => ({
            ...prev,
            [day]: { ...prev[day], closed: !prev[day].closed }
        }));
    };

    // Update time
    const updateTime = (day: string, field: 'open' | 'close', value: string) => {
        setOperatingHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    // Handle QR upload
    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setPaymentQr({ url: e.target?.result as string, file });
        };
        reader.readAsDataURL(file);
    };

    // Upload QR to storage
    const uploadQrToStorage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `qr_${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('merchant-qr')
                .upload(fileName, file);

            if (error) {
                console.error('QR upload error:', error);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('merchant-qr')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('QR upload error:', error);
            return null;
        }
    };

    // Step 1: Validate data and show confirmation modal
    const handleShowConfirmation = async () => {
        setError(null);

        const businessData = JSON.parse(localStorage.getItem('merchant_business') || '{}');
        const locationData = JSON.parse(localStorage.getItem('merchant_location') || '{}');

        if (!businessData.businessName) {
            setError('Missing business details. Please go back and fill all required fields.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!locationData.city && !businessData.city) {
            setError('Please select your city in Business Details.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        businessData.operatingHours = operatingHours;
        localStorage.setItem('merchant_business', JSON.stringify(businessData));

        setAgreedToTerms(false);
        setShowConfirmation(true);
    };

    // Step 2: Actually submit to pending_merchants after user confirms T&C
    const handleConfirmSubmit = async () => {
        if (!agreedToTerms) {
            setError('Please accept the Terms & Conditions to proceed.');
            return;
        }

        setUploading(true);
        setError(null);
        setShowConfirmation(false);

        try {
            let qrUrl = null;
            if (paymentQr?.file) {
                qrUrl = await uploadQrToStorage(paymentQr.file);
            }

            const businessData = JSON.parse(localStorage.getItem('merchant_business') || '{}');
            const locationData = JSON.parse(localStorage.getItem('merchant_location') || '{}');
            const documentsData = JSON.parse(localStorage.getItem('merchant_documents') || '{}');
            const mapsData = JSON.parse(localStorage.getItem('merchant_maps') || '{}');

            if (qrUrl) {
                documentsData.paymentQr = { url: qrUrl };
                localStorage.setItem('merchant_documents', JSON.stringify(documentsData));
            }

            const { authService } = await import('@/lib/services/auth.service');

            const result = await authService.completeMerchantOnboarding({
                businessName: businessData.businessName,
                category: businessData.category || 'General',
                subCategory: businessData.subCategory,
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
                logoUrl: documentsData.logo?.url,
                coverPhotoUrl: documentsData.coverPhoto?.url,
                storeImageUrls: documentsData.storeImages?.map((img: any) => img.url).filter(Boolean) || [],
                latitude: locationData.latitude || mapsData.latitude || businessData.latitude,
                longitude: locationData.longitude || mapsData.longitude || businessData.longitude,
                googleMapsLink: locationData.googleMapsLink || mapsData.googleMapsLink || businessData.googleMapsLink,
                googleMapsEmbed: mapsData.googleMapsEmbed,
                operatingHours: businessData.operatingHours,
                paymentQrUrl: documentsData.paymentQr?.url,
            });

            if (result.success) {
                localStorage.removeItem('merchant_business');
                localStorage.removeItem('merchant_location');
                localStorage.removeItem('merchant_documents');
                localStorage.removeItem('merchant_pending_email');
                localStorage.removeItem('merchant_pending_password');
                localStorage.removeItem('merchant_first_offer');
                localStorage.removeItem('merchant_maps');

                router.push('/merchant/onboarding/pending');
            } else {
                console.error('Merchant onboarding error:', result.error);
                setError(result.error || 'Failed to submit application. Please try again.');
                setUploading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError(err?.message || 'Something went wrong. Please try again.');
            setUploading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const timeInputClass = "h-11 px-3 bg-[#111] border border-[#333] rounded-xl text-white text-sm font-medium outline-none focus:border-green-500/50 [color-scheme:dark]";

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#222]">
                <div className="px-5 py-4 flex items-center gap-4">
                    <Link href="/merchant/onboarding/documents">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:bg-[#222] transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Store Timings</h1>
                        <p className="text-xs text-[#666]">Step 3 of 3 • Final Step!</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-4 flex gap-2">
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-5 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400/60 text-xs mt-1 underline hover:text-red-400"
                    >
                        Dismiss
                    </button>
                </motion.div>
            )}

            <main className="px-5 pt-6 pb-32 space-y-8">
                {/* Store Hours Section */}
                <section className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">Operating Hours</span>
                    </div>

                    {/* Same for all days toggle */}
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm text-white">Same for all days?</p>
                                <p className="text-xs text-[#666] mt-0.5">Quick setup with one timing</p>
                            </div>
                            <button
                                onClick={() => setSameForAllDays(!sameForAllDays)}
                                className={`h-7 w-12 rounded-full transition-colors ${sameForAllDays ? 'bg-green-500' : 'bg-[#333]'}`}
                            >
                                <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${sameForAllDays ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {sameForAllDays && (
                            <div className="mt-5 flex items-center gap-3">
                                <input
                                    type="time"
                                    value={commonHours.open}
                                    onChange={(e) => setCommonHours({ ...commonHours, open: e.target.value })}
                                    className={`flex-1 ${timeInputClass}`}
                                />
                                <span className="text-[#555] font-medium">to</span>
                                <input
                                    type="time"
                                    value={commonHours.close}
                                    onChange={(e) => setCommonHours({ ...commonHours, close: e.target.value })}
                                    className={`flex-1 ${timeInputClass}`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Day-by-day timings (only shown if not same for all) */}
                    {!sameForAllDays && (
                        <div className="bg-[#111] border border-[#333] rounded-2xl divide-y divide-[#222]">
                            {DAYS.map((day) => (
                                <div key={day.id} className="p-4 flex items-center gap-3">
                                    <span className="w-10 text-sm font-semibold text-white">{day.label}</span>

                                    {operatingHours[day.id].closed ? (
                                        <span className="flex-1 text-sm text-[#555] italic">Closed</span>
                                    ) : (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={operatingHours[day.id].open}
                                                onChange={(e) => updateTime(day.id, 'open', e.target.value)}
                                                className={timeInputClass}
                                            />
                                            <span className="text-[#555]">to</span>
                                            <input
                                                type="time"
                                                value={operatingHours[day.id].close}
                                                onChange={(e) => updateTime(day.id, 'close', e.target.value)}
                                                className={timeInputClass}
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => toggleDayClosed(day.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${operatingHours[day.id].closed
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}
                                    >
                                        {operatingHours[day.id].closed ? 'Open' : 'Close'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Payment QR Section (Optional) */}
                <section className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <QrCode className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">Payment QR Code</span>
                            <span className="text-[10px] text-[#555] font-medium bg-[#1a1a1a] px-2 py-0.5 rounded">Optional</span>
                        </div>
                    </div>

                    <p className="text-sm text-[#666]">
                        Upload your UPI/Google Pay/PhonePe QR code. This will be shown to students after offer redemption.
                    </p>

                    {paymentQr?.url ? (
                        <div className="relative bg-[#111] rounded-2xl border border-green-500/30 p-6 flex flex-col items-center">
                            <img
                                src={paymentQr.url}
                                alt="Payment QR"
                                className="w-48 h-48 object-contain rounded-xl bg-white p-2"
                            />
                            <button
                                onClick={() => setPaymentQr(null)}
                                className="absolute top-3 right-3 h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                                <X className="h-4 w-4 text-red-400" />
                            </button>
                            <p className="text-xs text-green-400 mt-4 flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" />
                                QR code uploaded successfully
                            </p>
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="bg-[#111] rounded-2xl border-2 border-dashed border-[#333] p-8 flex flex-col items-center gap-3 hover:border-green-500/40 transition-colors">
                                <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-green-400" />
                                </div>
                                <p className="text-sm font-medium text-white">Upload QR Code Image</p>
                                <p className="text-xs text-[#555]">PNG, JPG up to 2MB</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleQrUpload}
                                className="hidden"
                            />
                        </label>
                    )}
                </section>
            </main>

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShowConfirmation}
                    disabled={uploading}
                    className="w-full h-14 bg-green-500 hover:bg-green-400 disabled:bg-[#333] disabled:text-[#666] text-black font-bold rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:shadow-none"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating Your Account...
                        </>
                    ) : (
                        <>
                            Complete Registration
                            <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </motion.button>
                <p className="text-center text-xs text-[#555] mt-3">
                    You can update these later in settings
                </p>
            </div>

            {/* Confirmation Modal with Terms & Conditions */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-5">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-[#333] rounded-3xl p-6 max-w-md w-full"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Submit Application</h2>
                            <p className="text-sm text-[#888] mt-2">You're about to submit your merchant application for review</p>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 mb-6">
                            <label className="flex gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="h-5 w-5 mt-0.5 rounded border-[#555] bg-[#222] text-green-500 focus:ring-green-500 accent-green-500"
                                />
                                <span className="text-sm text-[#888]">
                                    I agree to the{' '}
                                    <a href="/terms" target="_blank" className="text-green-400 font-semibold underline">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="/privacy" target="_blank" className="text-green-400 font-semibold underline">
                                        Privacy Policy
                                    </a>
                                    . I consent to share my business information with Backbenchers for verification purposes.
                                </span>
                            </label>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 h-12 rounded-xl border border-[#333] text-white font-semibold hover:bg-[#1a1a1a] transition-colors"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmSubmit}
                                disabled={!agreedToTerms || uploading}
                                className="flex-1 h-12 bg-green-500 hover:bg-green-400 disabled:bg-[#333] disabled:text-[#666] text-black font-bold rounded-xl transition-all"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                ) : (
                                    'Confirm & Submit'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
