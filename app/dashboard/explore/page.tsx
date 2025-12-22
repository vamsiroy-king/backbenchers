"use client";

import { Search, Sparkles, TrendingUp, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { merchantService } from "@/lib/services/merchant.service";
import { Merchant } from "@/lib/types";

// F3 Categories - Food, Fashion, Fitness
const CATEGORIES = [
    { name: "Food", emoji: "🍕", color: "bg-gradient-to-br from-orange-400 to-red-500", image: null },
    { name: "Fashion", emoji: "👗", color: "bg-gradient-to-br from-pink-400 to-rose-500", image: null },
    { name: "Fitness", emoji: "💪", color: "bg-gradient-to-br from-blue-500 to-indigo-600", image: null },
];

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [featuredBrands, setFeaturedBrands] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch featured brands from Supabase
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

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

    // Filter featured brands by search
    const filteredBrands = featuredBrands.filter(brand =>
        brand.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white pb-28">
            {/* Header with Search */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/80 px-5 py-4">
                <h1 className="text-xl font-bold mb-4 text-gray-900">Explore</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-gray-50 rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all border border-gray-100 focus:border-primary/30"
                        placeholder="Search brands, categories..."
                    />
                </div>
            </header>

            <main className="px-5 pt-8 space-y-10">
                {/* F3 Categories Grid */}
                <section>
                    <div className="flex items-center gap-2.5 mb-5">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-bold text-gray-900">Categories</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {CATEGORIES.map((cat) => (
                            <Link key={cat.name} href={`/dashboard/category/${cat.name}`}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    className={`${cat.color} w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center shadow-card relative overflow-hidden`}
                                >
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : null}
                                    <div className={`relative z-10 flex flex-col items-center ${cat.image ? 'bg-black/40 absolute inset-0 justify-center' : ''}`}>
                                        <span className="text-3xl mb-1">{cat.emoji}</span>
                                        <span className="text-white text-xs font-semibold">{cat.name}</span>
                                    </div>
                                </motion.button>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Featured Brands */}
                {loading ? (
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-900">Featured Brands</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gray-100 rounded-xl h-28 w-24 animate-pulse flex-shrink-0" />
                            ))}
                        </div>
                    </section>
                ) : filteredBrands.length > 0 ? (
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-900">Featured Brands</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
                            {filteredBrands.map((brand) => (
                                <Link key={brand.id} href={`/store/${brand.id}`}>
                                    <motion.div
                                        whileTap={{ scale: 0.97 }}
                                        className="bg-white rounded-xl shadow-card border border-gray-100/50 p-3.5 flex flex-col items-center justify-center gap-2 min-w-[95px]"
                                    >
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.businessName} className="w-11 h-11 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Store className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-gray-900 text-center line-clamp-1">{brand.businessName}</span>
                                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                            {brand.category}
                                        </span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Coming Soon Message */}
                <section className="text-center py-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">More Coming Soon!</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                        We're onboarding amazing brands in Food, Fashion & Fitness. Stay tuned!
                    </p>
                </section>
            </main>
        </div>
    );
}
