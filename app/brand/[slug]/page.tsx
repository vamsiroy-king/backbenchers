"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Phone, Globe, Instagram, Star, Tag, Navigation, ExternalLink, X, Heart, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { brandService } from "@/lib/services/brand.service";
import { offerService } from "@/lib/services/offer.service";
import { Brand, Outlet, Offer } from "@/lib/types";
import OutletSelector from "@/components/OutletSelector";

export default function BrandStorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch brand with outlets
                const brandResult = await brandService.getBrandWithOutlets(slug);

                if (brandResult.success && brandResult.data) {
                    setBrand(brandResult.data);
                    setOutlets(brandResult.data.outlets || []);

                    // Auto-select first outlet
                    if (brandResult.data.outlets && brandResult.data.outlets.length > 0) {
                        setSelectedOutlet(brandResult.data.outlets[0]);
                    }

                    // TODO: Fetch offers for this brand
                    // const offersResult = await offerService.getByBrandId(brandResult.data.id);
                }
            } catch (error) {
                console.error('Error fetching brand:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <Store className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-xl font-bold mb-2">Brand not found</p>
                <p className="text-gray-500 mb-4">This brand doesn't exist or has been removed</p>
                <Link href="/dashboard">
                    <Button>Go back</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Mobile-sized container centered on all screens */}
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-gray-950 shadow-xl dark:shadow-none">
                    <div className="h-full w-full overflow-y-auto">
                        {/* Cover Image with Back Button */}
                        <div className="relative h-56">
                            <img
                                src={brand.coverImageUrl || 'https://picsum.photos/800/400?random=1'}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                            {/* Back & Favorite Buttons */}
                            <div className="absolute top-4 md:top-14 left-4 right-4 flex items-center justify-between">
                                <Link href="/dashboard">
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
                                {brand.logoUrl && (
                                    <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-lg bg-white">
                                        <img src={brand.logoUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h1 className="text-xl font-extrabold text-white">{brand.name}</h1>
                                    <p className="text-white/80 text-sm">{brand.category}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pt-5 pb-32 space-y-6 dark:bg-gray-950">
                            {/* Rating & Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-lg">
                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                        <span className="font-bold text-sm text-primary">4.5</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{brand.totalOutlets} outlets</span>
                                </div>
                                <div className={`text-xs px-2.5 py-1 rounded-lg font-medium ${brand.brandType === 'national_chain'
                                        ? 'bg-blue-50 text-blue-600'
                                        : brand.brandType === 'regional_chain'
                                            ? 'bg-purple-50 text-purple-600'
                                            : 'bg-green-50 text-green-600'
                                    }`}>
                                    {brand.brandType === 'national_chain' ? 'National Chain'
                                        : brand.brandType === 'regional_chain' ? 'Regional Chain'
                                            : 'Local'}
                                </div>
                            </div>

                            {/* Description */}
                            {brand.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{brand.description}</p>
                            )}

                            {/* Outlet Selector */}
                            <div>
                                <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-3">
                                    Select Outlet
                                </h3>
                                <OutletSelector
                                    outlets={outlets}
                                    selectedOutlet={selectedOutlet}
                                    onSelectOutlet={setSelectedOutlet}
                                />
                            </div>

                            {/* Selected Outlet Details */}
                            {selectedOutlet && (
                                <div className="space-y-2.5">
                                    <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">
                                        Contact & Directions
                                    </h3>

                                    {selectedOutlet.phone && (
                                        <a href={`tel:${selectedOutlet.phone}`} className="flex items-center gap-3 p-3.5 bg-gray-800/50 dark:bg-gray-800/80 rounded-xl border border-gray-700/50">
                                            <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                                <Phone className="h-5 w-5 text-primary" />
                                            </div>
                                            <p className="font-medium text-sm text-primary">{selectedOutlet.phone}</p>
                                        </a>
                                    )}

                                    {/* Get Directions Button */}
                                    {selectedOutlet.latitude && selectedOutlet.longitude && (
                                        <Button
                                            onClick={() => {
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${selectedOutlet.latitude},${selectedOutlet.longitude}`, '_blank');
                                            }}
                                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30"
                                        >
                                            <Navigation className="h-5 w-5 mr-2" />
                                            Get Directions to {selectedOutlet.name}
                                            <ExternalLink className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Active Offers */}
                            {offers.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">
                                        Available Offers
                                    </h3>
                                    {offers.map((offer) => (
                                        <motion.div
                                            key={offer.id}
                                            layout
                                            className="bg-white rounded-xl p-3.5 shadow-card border border-gray-100/50 relative cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex flex-col items-center justify-center text-white shadow-sm">
                                                    <span className="text-base font-bold leading-none">
                                                        {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                                    </span>
                                                    <span className="text-[8px] font-medium opacity-80">OFF</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 truncate">{offer.title}</h4>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-gray-400 text-sm line-through">₹{offer.originalPrice}</span>
                                                        <span className="text-primary text-lg font-bold">₹{offer.finalPrice}</span>
                                                    </div>
                                                </div>
                                            </div>
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
                    </div>
                </div>
            </div>
        </>
    );
}
