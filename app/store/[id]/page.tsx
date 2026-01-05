"use client";

import { ArrowLeft, MapPin, Phone, Navigation, Heart, ChevronRight, Share2, Tag, Star, X, Clock, Camera, Store } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { ratingService, MerchantRatingStats } from "@/lib/services/rating.service";
import { favoritesService } from "@/lib/services/favorites.service";
import { Merchant, Offer } from "@/lib/types";
import { vibrate } from "@/lib/haptics";

// Tab options - District style
const TABS = [
    { id: 'offers', label: 'Offers' },
    { id: 'photos', label: 'Photos' },
    { id: 'about', label: 'About' },
];

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
    }, [id, hasFetched]);

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

    const allImages = merchant ? [merchant.coverPhoto, merchant.logo, ...(merchant.storeImages || [])].filter(Boolean) as string[] : [];
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
        if (merchant?.phone) {
            vibrate('light');
            window.open(`tel:${merchant.phone}`, '_blank');
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

            {/* Mobile Container */}
            <div className="min-h-screen bg-black flex justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black">

                    {/* Large Hero Image - District Style */}
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

                        {/* Top Buttons */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
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

                    {/* Scrolling Ticker - Green BackBenchers Theme */}
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

                    {/* Store Info Section - Adidas Style */}
                    <div className="px-4 pt-4 pb-4 border-b border-[#222]">
                        {/* Logo + Name + Details - LEFT ALIGNED like Adidas */}
                        <div className="flex items-start gap-3 mb-4">
                            {/* Square Logo - LEFT aligned */}
                            <div className="h-14 w-14 rounded-xl bg-black flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#333]">
                                {merchant.logo ? (
                                    <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-2xl">{merchant.businessName[0]}</span>
                                )}
                            </div>

                            {/* Store Info - LEFT aligned */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h1 className="text-lg font-bold text-white">{merchant.businessName}</h1>
                                    {/* Rating Badge - Visible in Header */}
                                    {ratingStats.totalReviews > 0 && (
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-full">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-bold text-yellow-400">{ratingStats.avgRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-[#888] mb-0.5 leading-relaxed">
                                    {merchant.address}, {merchant.city}
                                </p>
                                <p className="text-xs text-[#666] mb-1">
                                    {merchant.category}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-400 font-medium">Open</span>
                                    <span className="text-[#555]">• Closes 10:00 PM ▾</span>
                                    {ratingStats.totalReviews > 0 && (
                                        <span className="text-[#555]">• {ratingStats.totalReviews} reviews</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Clean alignment with equal spacing */}
                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCall}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                Call
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetDirections}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 rounded-xl text-black text-xs font-semibold"
                            >
                                <Navigation className="h-3.5 w-3.5" />
                                Directions
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium"
                            >
                                <Store className="h-3.5 w-3.5" />
                                More
                            </motion.button>
                        </div>
                    </div>

                    {/* Tabs - District Style */}
                    <div className="border-b border-[#222] px-4">
                        <div className="flex gap-6 justify-center">
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
                    <div className="px-4 py-4 pb-24">
                        {activeTab === 'offers' && (
                            <div className="space-y-3">
                                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">In-store deals applied at billing counter</p>

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
                                            className="bg-[#111] rounded-xl p-4 border border-[#222] cursor-pointer"
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
                                                        {offer.validUntil && `Valid till ${new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                                    </p>
                                                </div>
                                                <motion.div animate={{ rotate: expandedOfferId === offer.id ? 90 : 0 }}>
                                                    <ChevronRight className="h-5 w-5 text-[#444]" />
                                                </motion.div>
                                            </div>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {expandedOfferId === offer.id && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="pt-4 mt-4 border-t border-[#222] space-y-3">
                                                            {offer.description && <p className="text-[#888] text-xs leading-relaxed">{offer.description}</p>}

                                                            {/* Price Display */}
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

                                                            {/* Terms */}
                                                            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                                                                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Terms & Conditions</p>
                                                                <ul className="space-y-1">
                                                                    <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                        <span className="text-green-500 mt-0.5">•</span>
                                                                        <span>Valid for verified students only</span>
                                                                    </li>
                                                                    <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                        <span className="text-green-500 mt-0.5">•</span>
                                                                        <span>Show student ID at billing</span>
                                                                    </li>
                                                                    <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                        <span className="text-green-500 mt-0.5">•</span>
                                                                        <span>Cannot be combined with other offers</span>
                                                                    </li>
                                                                </ul>
                                                            </div>

                                                            <div className="flex gap-2 flex-wrap">
                                                                <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">
                                                                    {offer.type === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                                                </span>
                                                                <span className="text-[10px] bg-[#1a1a1a] text-[#888] px-2.5 py-1 rounded-full flex items-center gap-1">
                                                                    <Tag className="h-2.5 w-2.5" />
                                                                    Show at store
                                                                </span>
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
                            <div className="space-y-3">
                                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Store gallery</p>

                                {allImages.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-2">
                                            <Camera className="h-5 w-5 text-[#444]" />
                                        </div>
                                        <p className="text-[#555] text-xs">No photos yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {allImages.map((img, i) => (
                                            <motion.div
                                                key={i}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => { setSelectedImageIndex(i); setShowImageGallery(true); }}
                                                className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] cursor-pointer"
                                            >
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-3">
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
        </>
    );
}
