"use client";

import { Button } from "@/components/ui/button";
import { Building2, MapPin, Clock, Phone, Globe, Instagram, Bell, Shield, HelpCircle, FileText, LogOut, ChevronRight, Camera, Store, Wifi, Tag, ChevronLeft, Loader2, QrCode, Upload, Trash2, Eye, EyeOff, Lock, Moon } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { merchantService } from "@/lib/services/merchant.service";
import { authService } from "@/lib/services/auth.service";
import { Merchant } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const MENU_ITEMS = [
    { icon: Clock, label: "Opening Hours", href: "#" },
    { icon: Bell, label: "Notification Settings", href: "#" },
    { icon: Shield, label: "Privacy & Security", href: "#" },
    { icon: HelpCircle, label: "Help & Support", href: "#" },
    { icon: FileText, label: "Terms & Conditions", href: "#" },
];

export default function MerchantProfilePage() {
    const router = useRouter();
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const galleryRef = useRef<HTMLDivElement>(null);

    // Real data state
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // QR Management State
    const [showQr, setShowQr] = useState(false);
    const [qrUploading, setQrUploading] = useState(false);
    const qrInputRef = useRef<HTMLInputElement>(null);

    // Fetch merchant data
    useEffect(() => {
        const fetchMerchant = async () => {
            try {
                setLoading(true);
                const result = await merchantService.getMyProfile();
                if (result.success && result.data) {
                    setMerchant(result.data);
                } else {
                    setError(result.error || "Failed to load profile");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMerchant();
    }, []);

    const handleLogout = async () => {
        // Clear merchant-specific localStorage
        localStorage.removeItem('merchant_id');
        localStorage.removeItem('merchant_passcode_hash');
        localStorage.removeItem('merchant_business');
        localStorage.removeItem('merchant_location');
        localStorage.removeItem('merchant_documents');

        await authService.logout();
        router.push("/merchant/auth/login");
    };

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        setShowImageGallery(true);
    };

    // QR Upload Handler - Privacy First (Only merchant can access)
    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !merchant) return;

        setQrUploading(true);
        try {
            // Upload to private merchant-qr bucket
            const fileExt = file.name.split('.').pop();
            const fileName = `qr_${merchant.id}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('merchant-qr')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('merchant-qr')
                .getPublicUrl(fileName);

            // Update merchant record
            await supabase
                .from('merchants')
                .update({ payment_qr_url: publicUrl })
                .eq('id', merchant.id);

            // Update local state
            setMerchant({ ...merchant, paymentQrUrl: publicUrl });
        } catch (err: any) {
            console.error('QR upload error:', err);
            alert('Failed to upload QR code');
        } finally {
            setQrUploading(false);
        }
    };

    // Remove QR Code
    const handleRemoveQr = async () => {
        if (!merchant || !confirm('Remove your payment QR code?')) return;

        setQrUploading(true);
        try {
            await supabase
                .from('merchants')
                .update({ payment_qr_url: null })
                .eq('id', merchant.id);

            setMerchant({ ...merchant, paymentQrUrl: undefined });
        } catch (err: any) {
            console.error('QR remove error:', err);
        } finally {
            setQrUploading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Error state
    if (error || !merchant) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-red-500">{error || "Merchant not found"}</p>
                <Button onClick={() => router.push("/merchant/auth/login")}>
                    Go to Login
                </Button>
            </div>
        );
    }

    const storeImages = merchant.storeImages || [];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pb-32 pt-12">
            {/* Image Gallery Modal - Google Maps Style */}
            <AnimatePresence>
                {showImageGallery && storeImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black"
                    >
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                            <button
                                onClick={() => setShowImageGallery(false)}
                                className="h-10 w-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
                            >
                                <ChevronLeft className="h-6 w-6 text-white" />
                            </button>
                            <span className="text-white text-sm font-medium">
                                {selectedImageIndex + 1} / {storeImages.length}
                            </span>
                            <div className="w-10" />
                        </div>

                        {/* Main Image */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.img
                                key={selectedImageIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={storeImages[selectedImageIndex]}
                                alt=""
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        </div>

                        {/* Thumbnail Strip */}
                        <div
                            ref={galleryRef}
                            className="absolute bottom-8 left-0 right-0 flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide"
                        >
                            {storeImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === selectedImageIndex ? 'border-white' : 'border-transparent opacity-50'
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center justify-between">
                    <h1 className="font-extrabold text-xl">Profile</h1>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Cover & Logo */}
                <div className="relative">
                    {merchant.coverPhoto ? (
                        <div className="h-32 rounded-2xl overflow-hidden">
                            <img
                                src={merchant.coverPhoto}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-32 rounded-2xl bg-gradient-to-r from-primary to-emerald-500" />
                    )}

                    {/* Logo */}
                    <div className="absolute -bottom-8 left-4">
                        {merchant.logo ? (
                            <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                                <img src={merchant.logo} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-20 w-20 rounded-2xl bg-primary border-4 border-white shadow-lg flex items-center justify-center">
                                <Building2 className="h-10 w-10 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Business Name & Type */}
                <div className="pt-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold">{merchant.businessName}</h2>
                            <p className="text-sm text-gray-500">{merchant.category}</p>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            <Store className="h-3 w-3" /> Offline
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                        <MapPin className="h-4 w-4" />
                        {merchant.city}, {merchant.state}
                    </div>

                    {merchant.bbmId && (
                        <div className="mt-2 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                            {merchant.bbmId}
                        </div>
                    )}
                </div>

                {/* Store Images - Google Maps Style */}
                {storeImages.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Store Photos</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {storeImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => openGallery(index)}
                                    className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                </button>
                            ))}
                            <button className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-1">
                                <Camera className="h-5 w-5 text-gray-400" />
                                <span className="text-[10px] text-gray-500">Add More</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Business Details (Read Only) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Business Details</h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">View Only</span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                        {merchant.ownerName && (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Building2 className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Owner</p>
                                    <p className="font-medium text-sm">{merchant.ownerName}</p>
                                </div>
                            </div>
                        )}

                        {merchant.phone && (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Phone className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-medium text-sm">{merchant.phone}</p>
                                </div>
                            </div>
                        )}

                        {merchant.address && (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <MapPin className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="font-medium text-sm">{merchant.address}</p>
                                    <p className="text-xs text-gray-400">{merchant.city}, {merchant.state} - {merchant.pinCode}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Clock className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Hours</p>
                                <p className="font-medium text-sm">{merchant.operatingHours ? "Hours configured" : "Not set"}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center">
                        Contact support to update your business details
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-primary/10 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-primary">{merchant.totalRedemptions || 0}</p>
                        <p className="text-[10px] text-gray-500">Redemptions</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-blue-600">4.8</p>
                        <p className="text-[10px] text-gray-500">Rating</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-purple-600">{merchant.totalOffers || 0}</p>
                        <p className="text-[10px] text-gray-500">Offers</p>
                    </div>
                </div>

                {/* Hidden QR file input */}
                <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                />

                {/* Payment QR Management - PRIVATE (Only Merchant Access) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Payment QR Code</h3>
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">PRIVATE</span>
                    </div>

                    <div className="bg-gradient-to-r from-primary/5 to-blue-50/50 rounded-2xl p-4 border border-primary/10">
                        {merchant.paymentQrUrl ? (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        {showQr ? (
                                            <img
                                                src={merchant.paymentQrUrl}
                                                alt="Payment QR"
                                                className="w-40 h-40 object-contain rounded-xl border bg-white p-2"
                                            />
                                        ) : (
                                            <div className="w-40 h-40 bg-gray-200 rounded-xl flex items-center justify-center">
                                                <EyeOff className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowQr(!showQr)}
                                        className="rounded-lg"
                                    >
                                        {showQr ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                        {showQr ? 'Hide' : 'View'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => qrInputRef.current?.click()}
                                        disabled={qrUploading}
                                        className="rounded-lg"
                                    >
                                        <Upload className="h-4 w-4 mr-1" />
                                        Change
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemoveQr}
                                        disabled={qrUploading}
                                        className="rounded-lg text-red-500 border-red-200 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <QrCode className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">No payment QR uploaded</p>
                                <p className="text-xs text-gray-400 mt-1 mb-4">Upload your UPI/Google Pay QR code</p>
                                <Button
                                    onClick={() => qrInputRef.current?.click()}
                                    disabled={qrUploading}
                                    className="rounded-xl"
                                >
                                    {qrUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Upload QR Code
                                </Button>
                            </div>
                        )}

                        <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" />
                            Only you can see and manage your payment QR. Admins cannot access this.
                        </p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Settings</h3>

                    <div className="bg-gray-50 rounded-2xl overflow-hidden">
                        {MENU_ITEMS.map((item, index) => (
                            <button
                                key={index}
                                className="w-full flex items-center gap-3 p-4 text-left border-b border-gray-100 last:border-0 hover:bg-gray-100"
                            >
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <item.icon className="h-5 w-5 text-gray-600" />
                                </div>
                                <span className="flex-1 font-medium text-sm">{item.label}</span>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dark Mode Toggle */}
                <button
                    onClick={() => {
                        const html = document.documentElement;
                        const isDark = html.classList.toggle('dark');
                        localStorage.setItem('merchant_theme', isDark ? 'dark' : 'light');
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gray-900 dark:bg-gray-800 rounded-2xl"
                >
                    <div className="h-10 w-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Moon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <span className="flex-1 font-semibold text-white text-left">Dark Mode</span>
                    <div className="relative w-12 h-7 bg-gray-700 rounded-full p-1">
                        <div className="absolute right-1 top-1 h-5 w-5 bg-primary rounded-full transition-all" />
                    </div>
                </button>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-4 text-red-500 border border-red-200 rounded-2xl bg-red-50"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-semibold">Sign Out</span>
                </button>

                {/* App Switcher */}
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-3">
                        <Link href="/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Student App
                        </Link>
                        <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Admin Panel
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
