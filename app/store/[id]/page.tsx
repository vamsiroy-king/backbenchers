"use client";

import { ArrowLeft, MapPin, Phone, Navigation, Heart, ChevronRight, Share2, Tag, Star, X, Clock, Camera, Store, QrCode } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { ratingService, MerchantRatingStats } from "@/lib/services/rating.service";
import { favoritesService } from "@/lib/services/favorites.service";
import { Merchant, Offer } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import { VerificationBanner } from "@/components/VerificationBanner";
import { authService } from "@/lib/services/auth.service";

// Tab options - District style
const TABS = [
    { id: 'offers', label: 'Offers' },
    { id: 'photos', label: 'Photos' },
    { id: 'about', label: 'About' },
];

// Helper: Calculate real-time store status from operatingHours
interface StoreStatus {
    isOpen: boolean;
    statusText: string;
    closingTime?: string;
    openingTime?: string;
}

function getStoreStatus(operatingHours: any): StoreStatus {
    if (!operatingHours) {
        return { isOpen: true, statusText: 'Hours not available' };
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentHours = operatingHours[currentDay];

    if (!currentHours) {
        return { isOpen: true, statusText: 'Hours not available' };
    }

    // Check if store is marked as closed today
    if (currentHours.closed) {
        // Find next open day
        for (let i = 1; i <= 7; i++) {
            const nextDay = days[(now.getDay() + i) % 7];
            if (!operatingHours[nextDay]?.closed) {
                return {
                    isOpen: false,
                    statusText: `Closed today`,
                    openingTime: operatingHours[nextDay]?.open
                };
            }
        }
        return { isOpen: false, statusText: 'Temporarily closed' };
    }

    // Parse current time and store hours
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr: string): number => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + (minutes || 0);
    };

    const formatTime = (timeStr: string): string => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${(minutes || 0).toString().padStart(2, '0')} ${period}`;
    };

    const openTime = parseTime(currentHours.open);
    const closeTime = parseTime(currentHours.close);

    // Handle overnight hours (e.g., 10:00 PM - 2:00 AM)
    if (closeTime < openTime) {
        // Store is open overnight
        if (currentTime >= openTime || currentTime < closeTime) {
            return {
                isOpen: true,
                statusText: `Open`,
                closingTime: formatTime(currentHours.close)
            };
        }
    } else {
        // Normal hours
        if (currentTime >= openTime && currentTime < closeTime) {
            return {
                isOpen: true,
                statusText: `Open`,
                closingTime: formatTime(currentHours.close)
            };
        }
    }

    // Store is currently closed
    if (currentTime < openTime) {
        return {
            isOpen: false,
            statusText: `Closed`,
            openingTime: formatTime(currentHours.open)
        };
    }

    // Find tomorrow's opening
    const tomorrow = days[(now.getDay() + 1) % 7];
    const tomorrowHours = operatingHours[tomorrow];
    if (tomorrowHours && !tomorrowHours.closed) {
        return {
            isOpen: false,
            statusText: `Closed`,
            openingTime: formatTime(tomorrowHours.open)
        };
    }

    return { isOpen: false, statusText: 'Closed' };
}

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [hasFetched, setHasFetched] = useState(false);
    const [ratingStats, setRatingStats] = useState<MerchantRatingStats>({ avgRating: 0, totalReviews: 0 });
    const [savingFavorite, setSavingFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('offers');
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

    // Auth state
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    useEffect(() => {
        if (hasFetched) return;
        async function fetchData() {
            try {
                setInitialLoading(true);
                const [merchantResult, offersResult, stats, isSaved] = await Promise.all([
                    merchantService.getById(id),
                    offerService.getByMerchantId(id),
                    ratingService.getMerchantRatingStats(id),
                    favoritesService.isMerchantSaved(id)
                ]);
                if (merchantResult.success && merchantResult.data) setMerchant(merchantResult.data);
                if (offersResult.success && offersResult.data) setOffers(offersResult.data);
                setRatingStats(stats);
                setIsFavorite(isSaved);
                setHasFetched(true);
            } catch (error) {
                console.error('Error fetching store data:', error);
            } finally {
                setInitialLoading(false);
            }
        }
        fetchData();
        checkAuth();
    }, [id, hasFetched]);

    const checkAuth = async () => {
        try {
            const user = await authService.getCurrentUser();
            setIsVerified(user?.role === 'student' && !user.isSuspended);
        } catch {
            setIsVerified(false);
        }
    };

    // 🔥 REAL-TIME RATING SUBSCRIPTION - Updates without page refresh!
    useEffect(() => {
        if (!id) return;

        const { supabase } = require('@/lib/supabase');

        const channel = supabase
            .channel(`merchant-rating-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'merchants',
                    filter: `id=eq.${id}`
                },
                (payload: any) => {
                    console.log('[RealTime] 🔥 Merchant updated:', payload);
                    // Update rating stats in real-time
                    if (payload.new) {
                        setRatingStats({
                            avgRating: payload.new.average_rating || 0,
                            totalReviews: payload.new.total_ratings || 0
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const allImages = merchant ? (merchant.storeImages || []).filter(Boolean) as string[] : [];
    const heroImage = merchant?.coverPhoto || (merchant?.storeImages && merchant.storeImages[0]) || null;

    const handleGetDirections = () => {
        if (!merchant) return;
        vibrate('light');
        if (merchant.googleMapsLink) {
            window.open(merchant.googleMapsLink, '_blank');
        } else if (merchant.latitude && merchant.longitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${merchant.latitude},${merchant.longitude}`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant.address + ', ' + merchant.city)}`, '_blank');
        }
    };

    const handleCall = () => {
        // Prioritize ownerPhone, fallback to phone
        const phoneNumber = merchant?.ownerPhone || merchant?.phone;
        if (phoneNumber) {
            vibrate('light');
            window.location.href = `tel:${phoneNumber}`;
        }
    };

    const handleShare = async () => {
        vibrate('light');
        if (navigator.share) {
            await navigator.share({
                title: merchant?.businessName,
                text: `Check out ${merchant?.businessName} on Backbenchers`,
                url: window.location.href
            });
        }
    };

    const handleSave = async () => {
        if (savingFavorite) return;
        setSavingFavorite(true);
        vibrate(isFavorite ? 'light' : 'success');
        const result = await favoritesService.toggleMerchant(id);
        if (result.success && typeof result.data === 'boolean') setIsFavorite(result.data);
        setSavingFavorite(false);
    };

    // Loading State
    if (initialLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black flex items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                            <span className="text-black font-bold text-xl">B</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black flex flex-col items-center justify-center p-6">
                    <p className="text-lg font-semibold mb-3 text-white">Store not found</p>
                    <Link href="/dashboard" className="text-green-400 text-sm font-medium">Go back</Link>
                </div>
            </div>
        );
    }

    const activeOffers = offers.filter(o => o.status === 'active');
    const bestDiscount = activeOffers.length > 0 ? Math.max(...activeOffers.map(o => o.discountValue || 0)) : 0;

    return (
        <>
            {/* Image Gallery Modal */}
            <AnimatePresence>
                {showImageGallery && allImages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black">
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                            <button onClick={() => setShowImageGallery(false)} className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center">
                                <X className="h-5 w-5 text-white" />
                            </button>
                            <span className="text-white text-xs font-medium">{selectedImageIndex + 1}/{allImages.length}</span>
                            <div className="w-9" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <img src={allImages[selectedImageIndex]} alt="" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 flex gap-2 px-4 overflow-x-auto">
                            {allImages.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImageIndex(i)} className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${i === selectedImageIndex ? 'border-white' : 'border-transparent opacity-40'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------------- IMMERSIVE DESKTOP LAYOUT ---------------- */}
            <div className="min-h-screen bg-black md:bg-[#050505] pb-20">

                {/* Desktop Hero Section - Refined Height & Overlay */}
                <div className="hidden md:block relative h-[50vh] min-h-[400px] max-h-[600px] w-full group overflow-hidden">
                    {/* Back Button (Desktop) */}
                    <div className="absolute top-8 left-8 z-50">
                        <Link href="/dashboard">
                            <button className="h-10 w-10 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center transition-all group/back">
                                <ArrowLeft className="h-5 w-5 text-white group-hover/back:-translate-x-0.5 transition-transform" />
                            </button>
                        </Link>
                    </div>

                    {heroImage ? (
                        <div className="absolute inset-0">
                            <img src={heroImage} alt={merchant.businessName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            {/* Reduced Gradient Opacity */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-black flex items-center justify-center">
                            <span className="text-9xl font-bold text-white/5">{merchant.businessName[0]}</span>
                        </div>
                    )}

                    {/* Desktop Content Container Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end pb-10">
                        <div className="max-w-7xl mx-auto w-full px-8 flex items-end justify-between gap-8">
                            <div className="flex items-end gap-6 text-shadow-sm">
                                {/* Logo */}
                                <div className="h-32 w-32 rounded-2xl bg-white p-1 shadow-2xl shadow-black/50 shrink-0">
                                    <img src={merchant.logo || '/placeholder.png'} alt="" className="w-full h-full object-contain rounded-xl" />
                                </div>

                                {/* Text Info */}
                                <div className="mb-2">
                                    <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">{merchant.businessName}</h1>
                                    <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
                                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white">
                                            {merchant.category}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-green-400" />
                                            {merchant.city}
                                        </span>
                                        {ratingStats.totalReviews > 0 && (
                                            <span className="flex items-center gap-1.5 text-yellow-400">
                                                <Star className="h-4 w-4 fill-yellow-400" />
                                                <span className="font-bold">{ratingStats.avgRating.toFixed(1)}</span>
                                                <span className="text-white/60">({ratingStats.totalReviews})</span>
                                            </span>
                                        )}
                                        {(() => {
                                            const status = getStoreStatus(merchant.operatingHours);
                                            return (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${status.isOpen
                                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                                    : 'bg-red-500/20 border-red-500/30 text-red-500'}`}>
                                                    {status.isOpen ? 'OPEN NOW' : 'CLOSED'}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-2">
                                <button
                                    onClick={handleCall}
                                    disabled={!merchant.ownerPhone && !merchant.phone}
                                    className={`h-11 px-6 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:-translate-y-0.5
                                        ${(!merchant.ownerPhone && !merchant.phone)
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : 'bg-white hover:bg-gray-100 text-black hover:shadow-xl'}`}
                                >
                                    <Phone className="h-4 w-4" /> Call
                                </button>
                                <button onClick={handleGetDirections} className="h-11 px-6 bg-green-600 hover:bg-green-500 text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 hover:shadow-green-500/30 hover:-translate-y-0.5">
                                    <Navigation className="h-4 w-4" /> Directions
                                </button>
                                <button onClick={handleSave} className="h-11 w-11 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center transition-all">
                                    <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-full md:max-w-7xl md:mx-auto md:px-8 mt-8">
                    <div className="md:grid md:grid-cols-12 md:gap-8 items-start">

                        {/* LEFT: TABS & CONTENT (Takes up 8 cols) */}
                        <div className="col-span-12 lg:col-span-8">
                            {/* Desktop Tabs */}
                            <div className="hidden md:flex gap-8 border-b border-white/10 mb-8 px-2">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); }}
                                        className={`py-4 text-sm font-bold relative transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <motion.div layoutId="desktop-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                                    </button>
                                ))}
                            </div>

                            {/* Offers Content - Desktop Grid */}
                            <div className="hidden md:block min-h-[400px]">
                                {activeTab === 'offers' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-white">Active Offers</h3>
                                            <span className="text-xs text-green-400 font-medium bg-green-900/10 px-3 py-1 rounded-full border border-green-500/20">
                                                {activeOffers.length} Deals Available
                                            </span>
                                        </div>

                                        {activeOffers.length === 0 ? (
                                            <div className="h-64 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/30">
                                                <Tag className="h-12 w-12 mb-4 opacity-50" />
                                                <p>No active offers available right now.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {activeOffers.map(offer => (
                                                    <div key={offer.id} className="bg-[#111] hover:bg-[#161616] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer shadow-sm">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="h-12 w-12 rounded-lg bg-green-500 text-black flex flex-col items-center justify-center font-bold shadow-md shadow-green-500/10">
                                                                <span className="text-base leading-none">{offer.discountValue}{offer.type === 'percentage' ? '%' : ''}</span>
                                                                <span className="text-[9px]">OFF</span>
                                                            </div>
                                                            <div className="text-right">
                                                                {offer.finalPrice && <p className="text-xl font-bold text-white">₹{offer.finalPrice}</p>}
                                                                {offer.originalPrice && <p className="text-xs text-white/40 line-through">₹{offer.originalPrice}</p>}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-base font-bold text-white mb-2 group-hover:text-green-400 transition-colors line-clamp-1">{offer.title}</h4>
                                                        <p className="text-xs text-white/50 mb-4 line-clamp-2 min-h-[2.5em]">{offer.description}</p>
                                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                            <span className="text-xs font-medium text-white/40 flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3" />
                                                                {offer.validUntil ? `Valid till ${new Date(offer.validUntil).toLocaleDateString()}` : 'Limited time'}
                                                            </span>
                                                            <button className="h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-colors">
                                                                View
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'photos' && (
                                    <div className="grid grid-cols-3 gap-4">
                                        {allImages.length > 0 ? allImages.map((img, i) => (
                                            <div key={i} onClick={() => { setSelectedImageIndex(i); setShowImageGallery(true); }} className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group bg-[#111]">
                                                <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                        )) : (
                                            <div className="col-span-3 py-12 text-center text-white/30 border border-white/5 rounded-2xl bg-[#111]">
                                                <Camera className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                                No photos available
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'about' && (
                                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                                        <h3 className="text-lg font-bold text-white mb-4">About the Business</h3>
                                        {merchant.description ? (
                                            <p className="text-white/70 leading-relaxed text-base">{merchant.description}</p>
                                        ) : (
                                            <p className="text-white/30 italic">No description available.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: INFO SIDEBAR (Desktop Only - Sticky) */}
                        <div className="hidden lg:block col-span-4 space-y-6 sticky top-24">
                            {/* Address Card */}
                            <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/50">
                                    <MapPin className="h-4 w-4" /> Location
                                </h3>
                                <p className="text-white/90 mb-1 font-medium">{merchant.businessName}</p>
                                <p className="text-white/60 mb-1 text-sm">{merchant.address}</p>
                                <p className="text-white/60 text-sm mb-4">{merchant.city}, {merchant.pinCode}</p>
                                <button onClick={handleGetDirections} className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/5 flex items-center justify-center gap-2">
                                    Open in Google Maps
                                </button>
                            </div>

                            {/* Hours Card */}
                            <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-white/50">
                                    <Clock className="h-4 w-4" /> Operating Hours
                                </h3>
                                <div className="space-y-3">
                                    {merchant.operatingHours ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                        const opHours = merchant.operatingHours as any;
                                        const hours = opHours?.[day];
                                        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                                        return (
                                            <div key={day} className={`flex justify-between items-center text-sm py-1 border-b border-white/5 last:border-0 ${isToday ? 'text-green-400 font-bold' : 'text-white/60'}`}>
                                                <span className="capitalize w-24">{day}</span>
                                                <span className="text-right flex-1">
                                                    {hours?.closed ? <span className="text-red-400/70">Closed</span> : `${hours?.open || '9:00 AM'} - ${hours?.close || '9:00 PM'}`}
                                                </span>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-4">
                                            <p className="text-white/40 text-sm italic">Hours not available</p>
                                            <p className="text-white/20 text-xs mt-1">Contact store for timings</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ---------------- MOBILE LAYOUT (Unchanged) ---------------- */}
                <div className="md:hidden">
                    {/* Mobile Only Header (Hero & Info) */}
                    <div className="relative h-[320px]">
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt={merchant.businessName}
                                className="w-full h-full object-cover"
                                onClick={() => { setSelectedImageIndex(0); setShowImageGallery(true); }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center">
                                <div className="text-center">
                                    <div className="h-20 w-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-black font-bold text-3xl">{merchant.businessName[0]}</span>
                                    </div>
                                    <p className="text-[#444] text-sm">No cover image</p>
                                </div>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* SWIGGY-STYLE CLOSED BANNER */}
                        {(() => {
                            const storeStatus = getStoreStatus(merchant.operatingHours);
                            if (!storeStatus.isOpen) {
                                return (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                                        <div className="relative">
                                            <div className="absolute -top-8 left-1/4 w-px h-8 bg-gray-400"></div>
                                            <div className="absolute -top-8 right-1/4 w-px h-8 bg-gray-400"></div>
                                            <div className="bg-gradient-to-br from-red-500 to-red-600 px-8 py-4 rounded-xl shadow-2xl border-2 border-red-400">
                                                <p className="text-white/80 text-xs font-medium text-center mb-1">Temporarily</p>
                                                <p className="text-white text-xl font-bold tracking-wide text-center">CLOSED</p>
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-sm mt-4 text-center">
                                            {storeStatus.openingTime ? `Opens at ${storeStatus.openingTime}` : 'Check back later'}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Top Buttons */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                            <Link href="/dashboard">
                                <motion.button whileTap={{ scale: 0.9 }} className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </motion.button>
                            </Link>
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Share2 className="h-5 w-5 text-white" />
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Ticker */}
                    {bestDiscount > 0 && (
                        <div className="bg-gradient-to-r from-green-600 to-green-500 py-2.5 overflow-hidden">
                            <motion.div
                                className="flex whitespace-nowrap"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                                {[0, 1].map((i) => (
                                    <div key={i} className="flex items-center gap-6 px-4 text-white text-xs font-medium">
                                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/60" />Sale is live</span>
                                        <span className="font-bold">Flat {bestDiscount}% OFF</span>
                                        <span>+ 10% Rewards</span>
                                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/60" />Limited time</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {/* Store Info */}
                    <div className="px-4 pt-4 pb-4 border-b border-[#222]">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="h-14 w-14 rounded-xl bg-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#333]">
                                {merchant.logo ? (
                                    <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-2xl">{merchant.businessName[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-lg font-bold text-white">{merchant.businessName}</h1>
                                    {ratingStats.totalReviews > 0 && (
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-bold text-yellow-400">{ratingStats.avgRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-[#888] mb-0.5 leading-relaxed">{merchant.address}, {merchant.city}</p>
                                <p className="text-xs text-[#666] mb-1">{merchant.category}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    {(() => {
                                        const status = getStoreStatus(merchant.operatingHours);
                                        return (
                                            <>
                                                <span className={`font-medium ${status.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                                                    {status.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                                {status.isOpen && status.closingTime && <span className="text-[#555]">• Closes {status.closingTime}</span>}
                                                {!status.isOpen && status.openingTime && <span className="text-[#555]">• Opens {status.openingTime}</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button whileTap={{ scale: 0.98 }} onClick={handleCall} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium">
                                <Phone className="h-3.5 w-3.5" /> Call
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={handleGetDirections} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 rounded-xl text-black text-xs font-semibold">
                                <Navigation className="h-3.5 w-3.5" /> Directions
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.98 }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium">
                                <Store className="h-3.5 w-3.5" /> More
                            </motion.button>
                        </div>
                    </div>

                    {/* Tabs Container */}
                    <div className="md:bg-black md:rounded-3xl md:border md:border-[#222]">
                        <div className="border-b border-[#222] px-4">
                            <div className="flex gap-6 justify-center md:justify-start">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); vibrate('light'); }}
                                        className={`py-3 text-sm font-medium relative ${activeTab === tab.id ? 'text-white' : 'text-[#666]'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="py-4 pb-24 md:pb-6 md:px-4">
                            {activeTab === 'offers' && (
                                <div className="space-y-3 px-4 md:px-0">
                                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">In-store deals applied at billing counter</p>

                                    {/* Subtle verification note for non-verified users */}
                                    {isVerified === false && (
                                        <Link href="/signup">
                                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 mb-4 flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                    <QrCode className="h-4 w-4 text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-xs font-medium">Get verified for your QR pass</p>
                                                    <p className="text-[#555] text-[10px]">Show at checkout for discount</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-[#444] flex-shrink-0" />
                                            </div>
                                        </Link>
                                    )}

                                    {activeOffers.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Tag className="h-8 w-8 text-[#333] mx-auto mb-2" />
                                            <p className="text-[#555] text-xs">No active offers</p>
                                        </div>
                                    ) : (
                                        activeOffers.map(offer => (
                                            <motion.div
                                                key={offer.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id)}
                                                className="bg-[#111] rounded-xl p-4 border border-[#222] cursor-pointer hover:border-[#333] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-xl bg-green-500 flex flex-col items-center justify-center flex-shrink-0">
                                                        <span className="text-black font-bold text-sm">
                                                            {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                                        </span>
                                                        <span className="text-black text-[8px] font-medium">OFF</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-semibold text-sm">{offer.title}</h4>
                                                        <p className="text-[#666] text-xs mt-0.5">
                                                            {offer.validUntil && (() => {
                                                                const validUntil = new Date(offer.validUntil);
                                                                const now = new Date();
                                                                const diffTime = validUntil.getTime() - now.getTime();
                                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                if (diffDays <= 0) return 'Expired';
                                                                if (diffDays === 1) return 'Expiring today!';
                                                                if (diffDays <= 3) return `Expiring in ${diffDays} days!`;
                                                                if (diffDays <= 7) return `Expires in ${diffDays} days`;
                                                                return `Valid till ${validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <motion.div animate={{ rotate: expandedOfferId === offer.id ? 90 : 0 }}>
                                                        <ChevronRight className="h-5 w-5 text-[#444]" />
                                                    </motion.div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedOfferId === offer.id && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="pt-4 mt-4 border-t border-[#222] space-y-3">
                                                                {offer.description && <p className="text-[#888] text-xs leading-relaxed">{offer.description}</p>}
                                                                <div className="flex items-center gap-3">
                                                                    {offer.originalPrice && offer.finalPrice && (
                                                                        <>
                                                                            <span className="text-[#555] text-sm line-through">₹{offer.originalPrice}</span>
                                                                            <span className="text-white text-lg font-bold">₹{offer.finalPrice}</span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-green-400 text-xs font-medium">
                                                                        {offer.type === 'percentage'
                                                                            ? `Save ${offer.discountValue}%`
                                                                            : `Save ₹${offer.discountAmount || offer.discountValue}`
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                                                                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Terms & Conditions</p>
                                                                    <ul className="space-y-1">
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5"><span className="text-green-500 mt-0.5">•</span><span>Valid for verified students only</span></li>
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5"><span className="text-green-500 mt-0.5">•</span><span>Show student ID at billing</span></li>
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5"><span className="text-green-500 mt-0.5">•</span><span>Cannot be combined with other offers</span></li>
                                                                    </ul>
                                                                </div>
                                                                <div className="flex gap-2 flex-wrap">
                                                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">{offer.type === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}</span>
                                                                    <span className="text-[10px] bg-[#1a1a1a] text-[#888] px-2.5 py-1 rounded-full flex items-center gap-1"><Tag className="h-2.5 w-2.5" />Show at store</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'photos' && (
                                <div className="space-y-3 px-4 md:px-0">
                                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Store gallery</p>
                                    {allImages.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-2">
                                                <Camera className="h-5 w-5 text-[#444]" />
                                            </div>
                                            <p className="text-[#555] text-xs">No photos yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {allImages.map((img, i) => (
                                                <motion.div
                                                    key={i}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => { setSelectedImageIndex(i); setShowImageGallery(true); }}
                                                    className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] cursor-pointer relative group"
                                                >
                                                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="space-y-3 px-4 md:px-0">
                                    {merchant.description && (
                                        <p className="text-[#888] text-sm leading-relaxed">{merchant.description}</p>
                                    )}

                                    <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-[#666] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{merchant.address}</p>
                                                <p className="text-[#666] text-xs mt-0.5">{merchant.city}, {merchant.pinCode}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Operating Hours (Desktop uses left panel) */}
                                    <div className="md:hidden bg-[#111] rounded-xl p-4 border border-[#222]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="h-4 w-4 text-green-400" />
                                            <p className="text-white text-sm font-medium">Operating Hours</p>
                                        </div>
                                        {merchant.operatingHours ? (
                                            <div className="space-y-2">
                                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                                    const opHours = merchant.operatingHours as any;
                                                    const hours = opHours?.[day];
                                                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                                                    return (
                                                        <div key={day} className={`flex justify-between items-center py-1.5 ${isToday ? 'bg-green-500/10 -mx-2 px-2 rounded-lg' : ''}`}>
                                                            <span className={`text-xs capitalize ${isToday ? 'text-green-400 font-medium' : 'text-[#888]'}`}>
                                                                {day}
                                                                {isToday && <span className="ml-1 text-[10px]">(Today)</span>}
                                                            </span>
                                                            <span className={`text-xs font-mono ${hours?.closed ? 'text-red-400' : isToday ? 'text-white font-medium' : 'text-[#aaa]'}`}>
                                                                {hours?.closed ? 'Closed' : hours?.open && hours?.close ? `${hours.open} - ${hours.close}` : 'Not set'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[#555] text-xs">Hours not available</p>
                                        )}
                                    </div>

                                    <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                                        <div className="flex items-center gap-3">
                                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                            <div>
                                                <p className="text-white text-sm font-medium">{ratingStats.avgRating > 0 ? ratingStats.avgRating.toFixed(1) : 'New'}</p>
                                                <p className="text-[#666] text-xs">{ratingStats.totalReviews} reviews</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
