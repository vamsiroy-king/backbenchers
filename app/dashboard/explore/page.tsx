"use client";

import { Search, Sparkles, TrendingUp, Store, Clock, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { Merchant, Offer } from "@/lib/types";

// F3 Categories - Food, Fashion, Fitness
const CATEGORIES = [
    { name: "Food", emoji: "🍕", color: "bg-gradient-to-br from-orange-400 to-red-500" },
    { name: "Fashion", emoji: "👗", color: "bg-gradient-to-br from-pink-400 to-rose-500" },
    { name: "Fitness", emoji: "💪", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
];

// Animated search placeholders
const SEARCH_PLACEHOLDERS = [
    "restaurants near you...",
    "Nike discounts...",
    "gym memberships...",
    "trending deals..."
];

// Calculate days until expiry and return urgency info
function getExpiryUrgency(validTo: string | null | undefined): {
    daysLeft: number;
    label: string;
    color: string;
    bgColor: string;
    show: boolean;
} | null {
    if (!validTo) return null;

    const expiryDate = new Date(validTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return null; // Already expired

    if (daysLeft === 0) {
        return { daysLeft, label: "Ends Today!", color: "text-red-600", bgColor: "bg-red-100", show: true };
    } else if (daysLeft === 1) {
        return { daysLeft, label: "Ends Tomorrow", color: "text-orange-600", bgColor: "bg-orange-100", show: true };
    } else if (daysLeft <= 3) {
        return { daysLeft, label: `${daysLeft} days left`, color: "text-amber-600", bgColor: "bg-amber-100", show: true };
    } else if (daysLeft <= 7) {
        return { daysLeft, label: `${daysLeft} days left`, color: "text-green-600", bgColor: "bg-green-50", show: true };
    }

    return { daysLeft, label: "", color: "", bgColor: "", show: false };
}

export default function ExplorePage() {
    const searchParams = useSearchParams();
    const merchantFilter = searchParams.get("merchant");

    const [searchQuery, setSearchQuery] = useState("");
    const [featuredBrands, setFeaturedBrands] = useState<Merchant[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

    // Animated placeholder rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch featured brands
                const brandsResult = await merchantService.getFeaturedBrands();
                if (brandsResult.success && brandsResult.data) {
                    setFeaturedBrands(brandsResult.data);

                    // If merchant filter is set, find and select that merchant
                    if (merchantFilter) {
                        const merchant = brandsResult.data.find(m => m.id === merchantFilter);
                        if (merchant) {
                            setSelectedMerchant(merchant);
                        }
                    }
                }

                // Fetch active offers (filter by merchant if specified)
                if (merchantFilter) {
                    const offersResult = await offerService.getMerchantOffers(merchantFilter);
                    if (offersResult.success && offersResult.data) {
                        setOffers(offersResult.data);
                    }
                } else {
                    const offersResult = await offerService.getActiveOffers();
                    if (offersResult.success && offersResult.data) {
                        setOffers(offersResult.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching explore data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [merchantFilter]);

    // Filter by search query
    const filteredBrands = featuredBrands.filter(brand =>
        brand.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOffers = offers.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasResults = filteredBrands.length > 0 || filteredOffers.length > 0;

    return (
        <div className="min-h-screen bg-white pb-28">
            {/* Header with Animated Search */}
            <header className="sticky top-0 z-40 bg-white px-5 py-4">
                <h1 className="text-xl font-bold mb-4 text-gray-900">
                    {selectedMerchant ? selectedMerchant.businessName : "Explore"}
                </h1>
                {selectedMerchant && (
                    <Link href="/dashboard/explore" className="text-sm text-primary mb-3 inline-block">
                        ← View all offers
                    </Link>
                )}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-gray-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        placeholder=""
                    />
                    {/* Animated placeholder when empty */}
                    {!searchQuery && (
                        <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                            <span className="text-sm text-gray-400">Search</span>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={placeholderIndex}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-sm text-gray-300"
                                >
                                    {SEARCH_PLACEHOLDERS[placeholderIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-5 pt-6 space-y-8">
                {/* F3 Categories Grid - Hide when merchant filter is active */}
                {!merchantFilter && (
                    <section>
                        <div className="flex items-center gap-2.5 mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <h2 className="text-lg font-bold text-gray-900">Categories</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {CATEGORIES.map((cat) => (
                                <Link key={cat.name} href={`/dashboard/category/${cat.name}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.97 }}
                                        className={`${cat.color} w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center`}
                                    >
                                        <span className="text-3xl mb-1">{cat.emoji}</span>
                                        <span className="text-white text-xs font-semibold">{cat.name}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Offers Section - Always show when merchant filter or search active */}
                {(merchantFilter || searchQuery) && filteredOffers.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2.5 mb-4">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-900">
                                {merchantFilter ? "Available Offers" : "Offers"}
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {filteredOffers.map((offer) => {
                                const urgency = getExpiryUrgency(offer.validTo);

                                return (
                                    <Link key={offer.id} href={`/store/${offer.merchantId}`}>
                                        <motion.div
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl relative overflow-hidden"
                                        >
                                            {/* Urgency Badge */}
                                            {urgency?.show && (
                                                <div className={`absolute top-2 right-2 ${urgency.bgColor} ${urgency.color} px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                                    {urgency.daysLeft <= 1 && <Flame className="w-3 h-3" />}
                                                    <span className="text-[10px] font-semibold">{urgency.label}</span>
                                                </div>
                                            )}

                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                {offer.merchantLogo ? (
                                                    <img src={offer.merchantLogo} alt="" className="w-8 h-8 object-contain rounded-lg" />
                                                ) : (
                                                    <Store className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">
                                                    {offer.merchantName || 'Special Offer'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{offer.title}</p>
                                            </div>
                                            <span className="text-sm font-bold text-primary flex-shrink-0">
                                                {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                            </span>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Featured Brands */}
                {!loading && !merchantFilter && filteredBrands.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2.5 mb-4">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-900">Featured Brands</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
                            {filteredBrands.map((brand) => (
                                <Link key={brand.id} href={`/store/${brand.id}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.97 }}
                                        className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-w-[100px]"
                                    >
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.businessName} className="w-12 h-12 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Store className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-gray-900 text-center line-clamp-1">{brand.businessName}</span>
                                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                            {brand.category}
                                        </span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* No Results */}
                {searchQuery && !hasResults && !loading && (
                    <section className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">No results found</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Try searching for something else
                        </p>
                    </section>
                )}

                {/* No offers for this merchant */}
                {merchantFilter && filteredOffers.length === 0 && !loading && (
                    <section className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Store className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">No offers available</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            This merchant has no active offers right now
                        </p>
                        <Link href="/dashboard/explore" className="text-sm text-primary font-semibold mt-4 inline-block">
                            ← Browse all offers
                        </Link>
                    </section>
                )}

                {/* Coming Soon Message */}
                {!searchQuery && !merchantFilter && (
                    <section className="text-center py-6">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h3 className="font-bold text-gray-900">More Coming Soon!</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            We're onboarding amazing brands in Food, Fashion & Fitness.
                        </p>
                    </section>
                )}
            </main>
        </div>
    );
}
