"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, QrCode, Upload, X, Loader2 } from "lucide-react";
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

        // Preview
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

    const handleContinue = async () => {
        setUploading(true);
        setError(null);

        try {
            // Upload QR if present
            let qrUrl = null;
            if (paymentQr?.file) {
                qrUrl = await uploadQrToStorage(paymentQr.file);
            }

            // Get existing business data and add operating hours
            const businessData = JSON.parse(localStorage.getItem('merchant_business') || '{}');
            businessData.operatingHours = operatingHours;
            localStorage.setItem('merchant_business', JSON.stringify(businessData));

            // Save QR to documents data
            if (qrUrl) {
                const documentsData = JSON.parse(localStorage.getItem('merchant_documents') || '{}');
                documentsData.paymentQr = { url: qrUrl };
                localStorage.setItem('merchant_documents', JSON.stringify(documentsData));
            }

            // Get all onboarding data
            const locationData = JSON.parse(localStorage.getItem('merchant_location') || '{}');
            const documentsData = JSON.parse(localStorage.getItem('merchant_documents') || '{}');
            const mapsData = JSON.parse(localStorage.getItem('merchant_maps') || '{}');

            if (!businessData.businessName) {
                setError('Missing business details. Please go back and fill all required fields.');
                setUploading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            if (!locationData.city && !businessData.city) {
                setError('Please select your city in Business Details.');
                setUploading(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Import auth service and complete onboarding directly (skip passcode)
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
                // Clear onboarding data
                localStorage.removeItem('merchant_business');
                localStorage.removeItem('merchant_location');
                localStorage.removeItem('merchant_documents');
                localStorage.removeItem('merchant_pending_email');
                localStorage.removeItem('merchant_pending_password');
                localStorage.removeItem('merchant_first_offer');
                localStorage.removeItem('merchant_maps');

                // Redirect to pending page (waiting for admin approval)
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-emerald-50/30">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
                <div className="px-5 h-16 flex items-center gap-4">
                    <Link href="/merchant/onboarding/documents">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center shadow-sm"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-bold text-[17px] text-gray-900 tracking-tight">Store Timings</h1>
                        <p className="text-[11px] text-gray-400 font-medium">Step 3 of 3 • Final Step!</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="px-5 pb-4 flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className="h-1.5 flex-1 rounded-full bg-primary"
                        />
                    ))}
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="mx-5 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 text-xs mt-1 underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <main className="px-5 pt-6 pb-32 space-y-6">
                {/* Store Hours Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h2 className="font-bold text-gray-900">Operating Hours</h2>
                    </div>

                    {/* Same for all days toggle */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Same for all days?</p>
                                <p className="text-xs text-gray-500 mt-0.5">Quick setup with one timing</p>
                            </div>
                            <button
                                onClick={() => setSameForAllDays(!sameForAllDays)}
                                className={`h-7 w-12 rounded-full transition-colors ${sameForAllDays ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`h-5 w-5 bg-white rounded-full shadow transition-transform ${sameForAllDays ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {sameForAllDays && (
                            <div className="mt-4 flex items-center gap-3 bg-white rounded-xl p-3">
                                <input
                                    type="time"
                                    value={commonHours.open}
                                    onChange={(e) => setCommonHours({ ...commonHours, open: e.target.value })}
                                    className="flex-1 h-11 px-3 border border-gray-200 rounded-xl text-sm font-medium"
                                />
                                <span className="text-gray-400 font-medium">to</span>
                                <input
                                    type="time"
                                    value={commonHours.close}
                                    onChange={(e) => setCommonHours({ ...commonHours, close: e.target.value })}
                                    className="flex-1 h-11 px-3 border border-gray-200 rounded-xl text-sm font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {/* Day-by-day timings (only shown if not same for all) */}
                    {!sameForAllDays && (
                        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                            {DAYS.map((day) => (
                                <div key={day.id} className="p-4 flex items-center gap-3">
                                    <span className="w-10 text-sm font-semibold text-gray-700">{day.label}</span>

                                    {operatingHours[day.id].closed ? (
                                        <span className="flex-1 text-sm text-gray-400 italic">Closed</span>
                                    ) : (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={operatingHours[day.id].open}
                                                onChange={(e) => updateTime(day.id, 'open', e.target.value)}
                                                className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                            />
                                            <span className="text-gray-400">to</span>
                                            <input
                                                type="time"
                                                value={operatingHours[day.id].close}
                                                onChange={(e) => updateTime(day.id, 'close', e.target.value)}
                                                className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={() => toggleDayClosed(day.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${operatingHours[day.id].closed
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'bg-red-50 text-red-500'
                                            }`}
                                    >
                                        {operatingHours[day.id].closed ? 'Open' : 'Close'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment QR Section (Optional) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        <h2 className="font-bold text-gray-900">Payment QR Code</h2>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded">Optional</span>
                    </div>

                    <p className="text-sm text-gray-500">
                        Upload your UPI/Google Pay/PhonePe QR code. This will be shown to students after offer redemption.
                    </p>

                    {paymentQr?.url ? (
                        <div className="relative bg-white rounded-2xl border-2 border-primary/20 p-6 flex flex-col items-center">
                            <img
                                src={paymentQr.url}
                                alt="Payment QR"
                                className="w-48 h-48 object-contain rounded-xl"
                            />
                            <button
                                onClick={() => setPaymentQr(null)}
                                className="absolute top-3 right-3 h-8 w-8 bg-red-50 rounded-full flex items-center justify-center"
                            >
                                <X className="h-4 w-4 text-red-500" />
                            </button>
                            <p className="text-xs text-gray-500 mt-3">QR code uploaded successfully</p>
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center gap-3 hover:border-primary/30 transition-colors">
                                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">Upload QR Code Image</p>
                                <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleQrUpload}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            </main>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-gray-100">
                <Button
                    onClick={handleContinue}
                    disabled={uploading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating Your Account...
                        </>
                    ) : (
                        <>
                            Complete Registration
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-2">
                    You can update these later in settings
                </p>
            </div>
        </div>
    );
}
