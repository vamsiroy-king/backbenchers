"use client";

import { Search, Sparkles, TrendingUp, Store, Percent, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { offerService } from "@/lib/services/offer.service";
import { merchantService } from "@/lib/services/merchant.service";
import { Offer, Merchant } from "@/lib/types";

const CATEGORIES = [
    { name: "Food", emoji: "🍕", color: "bg-purple-500" },
    { name: "Coffee", emoji: "☕", color: "bg-amber-600" },
    { name: "Grocery", emoji: "🥗", color: "bg-emerald-600" },
    { name: "Beauty", emoji: "💄", color: "bg-pink-400" },
    { name: "Tech", emoji: "📱", color: "bg-blue-700" },
    { name: "Fashion", emoji: "👗", color: "bg-rose-500" },
    { name: "Restaurant", emoji: "🍽️", color: "bg-orange-500" },
    { name: "Services", emoji: "✂️", color: "bg-teal-500" },
];

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [featuredBrands, setFeaturedBrands] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch offers and featured brands from Supabase
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Fetch active offers
                const offersResult = await offerService.getActiveOffers();
                if (offersResult.success && offersResult.data) {
                    setOffers(offersResult.data);
                }

                // Fetch featured brands
                const brandsResult = await merchantService.getFeaturedBrands();
                if (brandsResult.success && brandsResult.data) {
                    setFeaturedBrands(brandsResult.data);
                }
            } catch (error) {
                console.error('Error fetching explore data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Filter offers by search
    const filteredOffers = offers.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get discount display text
    const getDiscountText = (offer: Offer) => {
        if (offer.type === 'percentage') return `${offer.discountValue}% OFF`;
        if (offer.type === 'flat') return `₹${offer.discountValue} OFF`;
        if (offer.type === 'bogo') return 'Buy 1 Get 1';
        if (offer.type === 'freebie') return 'Free Gift';
        return `${offer.discountValue}% OFF`;
    };

    return (
        <div className="min-h-screen bg-white pb-28">
            {/* Header with Search */}
            <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
                <h1 className="text-2xl font-bold mb-3">Explore</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-gray-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all border border-transparent focus:border-gray-200"
                        placeholder="Search brands, offers..."
                    />
                </div>
            </header>

            <main className="px-4 pt-6 space-y-8">
                {/* Categories Grid */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-bold">Categories</h2>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map((cat) => (
                            <Link key={cat.name} href={`/dashboard/category/${cat.name.toLowerCase()}`}>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className={`${cat.color} w-full aspect-square rounded-2xl flex flex-col items-center justify-center shadow-md relative overflow-hidden`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                    <span className="text-2xl mb-1 relative z-10">{cat.emoji}</span>
                                    <span className="text-white text-[10px] font-bold relative z-10">{cat.name}</span>
                                </motion.button>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Featured Brands */}
                {featuredBrands.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold">Featured Brands</h2>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {featuredBrands.map((brand) => (
                                <Link key={brand.id} href={`/store/${brand.id}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex flex-col items-center justify-center gap-2 min-w-[100px]"
                                    >
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.businessName} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Store className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-gray-900 text-center line-clamp-1">{brand.businessName}</span>
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {brand.category}
                                        </span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Active Offers */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-orange-500" />
                            <h2 className="text-lg font-bold">Active Offers</h2>
                        </div>
                        <span className="text-xs text-gray-500">{filteredOffers.length} offers</span>
                    </div>

                    {loading ? (
                        // Loading skeleton
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredOffers.length > 0 ? (
                        <div className="space-y-3">
                            {filteredOffers.map((offer) => (
                                <Link key={offer.id} href={`/store/${offer.merchantId}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center"
                                    >
                                        {/* Merchant Logo */}
                                        <div className="flex-shrink-0">
                                            {offer.merchantLogo ? (
                                                <img src={offer.merchantLogo} alt={offer.merchantName} className="w-14 h-14 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <Store className="w-6 h-6 text-primary" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Offer Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-gray-900 truncate">{offer.title}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{offer.merchantName}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full">
                                                    {getDiscountText(offer)}
                                                </span>
                                                {offer.merchantCity && (
                                                    <span className="text-[10px] text-gray-400">{offer.merchantCity}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right flex-shrink-0">
                                            {offer.originalPrice && (
                                                <p className="text-xs text-gray-400 line-through">₹{offer.originalPrice}</p>
                                            )}
                                            {offer.finalPrice && (
                                                <p className="text-lg font-bold text-primary">₹{offer.finalPrice}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        // Empty state
                        <div className="text-center py-12">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-600">No offers yet</h3>
                            <p className="text-sm text-gray-400 mt-1">Check back soon for amazing deals!</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
