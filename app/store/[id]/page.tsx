"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Phone, Globe, Instagram, Star, Tag, Navigation, ExternalLink, X, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { Merchant, Offer } from "@/lib/types";

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap async params for Next.js 16
    const { id } = use(params);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showTimings, setShowTimings] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);

    // Fetch real merchant data and offers
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                console.log('Fetching merchant with ID:', id);

                // Fetch merchant by ID
                const merchantResult = await merchantService.getById(id);
                console.log('Merchant result:', merchantResult);

                if (merchantResult.success && merchantResult.data) {
                    setMerchant(merchantResult.data);
                } else {
                    console.error('Failed to fetch merchant:', merchantResult.error);
                }

                // Fetch offers for this merchant
                const offersResult = await offerService.getByMerchantId(id);
                console.log('Offers result:', offersResult);

                if (offersResult.success && offersResult.data) {
                    setOffers(offersResult.data);
                }
            } catch (error) {
                console.error('Error fetching store data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    // Prepare images array
    const allImages = merchant ? [
        merchant.coverPhoto || 'https://picsum.photos/800/400?random=1',
        ...(merchant.storeImages || [])
    ] : [];

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        setShowImageGallery(true);
    };

    const handleGetDirections = () => {
        if (!merchant) return;

        // Priority 1: Use direct Google Maps link if available
        if (merchant.googleMapsLink) {
            window.open(merchant.googleMapsLink, '_blank');
            return;
        }

        // Priority 2: Use latitude/longitude if available
        if (merchant.latitude && merchant.longitude) {
            const url = `https://www.google.com/maps/search/?api=1&query=${merchant.latitude},${merchant.longitude}`;
            window.open(url, '_blank');
            return;
        }

        // Priority 3: Fallback to address search
        if (merchant.address && merchant.city) {
            const query = encodeURIComponent(`${merchant.address}, ${merchant.city}`);
            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        }
    };

    // Get discount display text
    const getDiscountText = (offer: Offer) => {
        if (offer.type === 'percentage') return `${offer.discountValue}% OFF`;
        if (offer.type === 'flat') return `₹${offer.discountValue} OFF`;
        if (offer.type === 'bogo') return 'Buy 1 Get 1';
        if (offer.type === 'freebie') return 'Free Gift';
        return `${offer.discountValue}% OFF`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <p className="text-xl font-bold mb-4">Store not found</p>
                <Link href="/dashboard">
                    <Button>Go back</Button>
                </Link>
            </div>
        );
    }

    // Content to render in both mobile and desktop views
    const storeContent = (
        <>
            {/* Cover Image with Back Button */}
            <div className="relative h-56">
                <img
                    src={merchant.coverPhoto || 'https://picsum.photos/800/400?random=1'}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    onClick={() => openGallery(0)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Back & Favorite Buttons */}
                <div className="absolute top-4 md:top-14 left-4 right-4 flex items-center justify-between">
                    <Link href="/dashboard/explore">
                        <button className="h-10 w-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                    </Link>
                    <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className="h-10 w-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
                    >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </button>
                </div>

                {/* Logo & Name on Cover */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                    {merchant.logo && (
                        <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                            <img src={merchant.logo} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-extrabold text-white">{merchant.businessName}</h1>
                        <p className="text-white/80 text-sm">{merchant.category}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-4 pb-32 space-y-5">
                {/* Rating & Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <span className="font-bold text-sm text-primary">4.5</span>
                        </div>
                        <span className="text-xs text-gray-500">(New)</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Open
                    </div>
                </div>

                {/* Store Images */}
                {merchant.storeImages && merchant.storeImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {merchant.storeImages.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => openGallery(index + 1)}
                                className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Description */}
                {merchant.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{merchant.description}</p>
                )}

                {/* Quick Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{merchant.address}</p>
                            <p className="text-xs text-gray-500">{merchant.city}, {merchant.pinCode}</p>
                        </div>
                    </div>

                    {merchant.phone && (
                        <a href={`tel:${merchant.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <p className="font-medium text-sm text-primary">{merchant.phone}</p>
                        </a>
                    )}
                </div>

                {/* Get Directions Button */}
                <Button
                    onClick={handleGetDirections}
                    className="w-full h-12 bg-gray-900 text-white font-semibold rounded-xl"
                >
                    <Navigation className="h-5 w-5 mr-2" />
                    Get Directions
                    <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                {/* Active Offers */}
                {offers.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            Student Offers ({offers.length})
                        </h3>
                        {offers.filter(o => o.status === 'active').map((offer) => (
                            <motion.div
                                key={offer.id}
                                whileTap={{ scale: 0.98 }}
                                className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                                {new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</div>
                                )}
                                <p className="text-white/80 text-xs uppercase tracking-wider mb-1">{getDiscountText(offer)}</p>
                                <h4 className="font-bold text-lg mb-3">{offer.title}</h4>
                                <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-3">
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <span className="text-white/50 text-xl line-through">₹{offer.originalPrice || 0}</span>
                                        <span className="text-white text-4xl font-black">₹{offer.finalPrice || 0}</span>
                                    </div>
                                    <div className="bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                                        <span>🎉</span> Save ₹{offer.discountAmount || 0}
                                    </div>
                                </div>
                                {offer.description && <p className="text-sm text-white/80">{offer.description}</p>}
                                {offer.terms && (
                                    <div className="mt-3 pt-3 border-t border-white/20">
                                        <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Terms:</p>
                                        {(typeof offer.terms === 'string' ? [offer.terms] : offer.terms).map((term: string, i: number) => (
                                            <p key={i} className="text-xs text-white/70">• {term}</p>
                                        ))}
                                    </div>
                                )}
                                {offer.validUntil && (
                                    <p className="text-[10px] text-white/50 mt-3">Valid until {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {offers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active offers at this store</p>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Image Gallery Modal */}
            <AnimatePresence>
                {showImageGallery && allImages.length > 0 && (
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
                                <X className="h-6 w-6 text-white" />
                            </button>
                            <span className="text-white text-sm font-medium">
                                {selectedImageIndex + 1} / {allImages.length}
                            </span>
                            <div className="w-10" />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.img
                                key={selectedImageIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={allImages[selectedImageIndex]}
                                alt=""
                                className="max-w-full max-h-[70vh] object-contain"
                            />
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
                            {allImages.map((img, index) => (
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

            {/* MOBILE: Native fullscreen layout */}
            <div className="md:hidden min-h-screen bg-white">
                <div className="h-full w-full overflow-y-auto">
                    {storeContent}
                </div>
            </div>

            {/* DESKTOP: Phone simulator preview */}
            <div className="hidden md:flex min-h-screen bg-[#1a1a1a] items-center justify-center py-4">
                <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[0_0_0_3px_#3a3a3a,0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-[12px] bg-white rounded-[45px] overflow-hidden">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />
                        <div className="h-full w-full overflow-y-auto scrollbar-hide">
                            {storeContent}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
