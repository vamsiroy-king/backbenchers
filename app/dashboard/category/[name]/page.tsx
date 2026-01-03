"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, MapPin, Heart, ShieldCheck, Loader2, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { offerService } from "@/lib/services/offer.service";
import { authService } from "@/lib/services/auth.service";
import { favoritesService } from "@/lib/services/favorites.service";
import { Offer } from "@/lib/types";
import { MasonryGrid } from "@/components/ui/MasonryGrid";
import { OfferCard } from "@/components/OfferCard";
import { vibrate } from "@/lib/haptics";

// Category data
const CATEGORY_DATA: Record<string, { emoji: string; color: string }> = {
    "Food": { emoji: "🍕", color: "from-purple-500 to-purple-600" },
    "Food & Beverages": { emoji: "🍕", color: "from-purple-500 to-purple-600" },
    "Fashion": { emoji: "👗", color: "from-pink-500 to-rose-500" },
    "Fashion & Lifestyle": { emoji: "👗", color: "from-pink-500 to-rose-500" },
    "Travel": { emoji: "✈️", color: "from-emerald-500 to-teal-500" },
    "Beauty": { emoji: "💄", color: "from-rose-400 to-pink-500" },
    "Beauty & Wellness": { emoji: "💄", color: "from-rose-400 to-pink-500" },
    "Entertain": { emoji: "🎡", color: "from-blue-500 to-indigo-600" },
    "Entertainment": { emoji: "🎡", color: "from-blue-500 to-indigo-600" },
    "Fitness": { emoji: "🏋️", color: "from-gray-600 to-gray-700" },
    "Health & Fitness": { emoji: "🏋️", color: "from-gray-600 to-gray-700" },
    "Electronics": { emoji: "📱", color: "from-indigo-500 to-purple-600" },
    "Tech & Electronics": { emoji: "📱", color: "from-indigo-500 to-purple-600" },
    "Others": { emoji: "🛠️", color: "from-teal-500 to-cyan-600" },
    "Services": { emoji: "✂️", color: "from-teal-500 to-cyan-500" },
    "Grocery": { emoji: "🥗", color: "from-emerald-500 to-green-600" },
    "Coffee": { emoji: "☕", color: "from-amber-600 to-amber-700" },
    "Restaurant": { emoji: "🍽️", color: "from-orange-500 to-orange-600" },
};

// Grouped merchant with offers
interface MerchantWithOffers {
    merchantId: string;
    merchantName: string;
    merchantLogo?: string;
    merchantCity?: string;
    offers: Offer[];
    bestOffer: Offer; // The offer to display (highest discount)
}

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categoryName = decodeURIComponent(params.name as string);
    const category = CATEGORY_DATA[categoryName] || { emoji: "📦", color: "from-gray-500 to-gray-600" };

    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('offline');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isVerified, setIsVerified] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    // Fetch offers and group by merchant
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Check if user is a verified STUDENT
                const user = await authService.getCurrentUser();
                const isStudentVerified = !!(user?.role === 'student' && user?.isComplete);
                setIsVerified(isStudentVerified);

                // Fetch offers by category
                const result = await offerService.getByCategory(categoryName);
                if (result.success && result.data) {
                    setOffers(result.data);
                }

                // Fetch saved offer IDs
                const ids = await favoritesService.getSavedOfferIds();
                setFavoriteIds(ids);
            } catch (error) {
                console.error('Error fetching category offers:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [categoryName]);

    // Filter offers based on tab
    const filteredOffers = activeTab === 'online'
        ? offers.filter(o => o.type === 'percentage' && o.merchantCategory === 'Service') // Placeholder logic for now
        : offers; // Show all for now/offline

    const toggleFavorite = async (offerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isVerified) {
            setShowVerifyModal(true);
            return;
        }

        const isFav = favoriteIds.includes(offerId);
        if (isFav) {
            setFavoriteIds(prev => prev.filter(id => id !== offerId));
        } else {
            setFavoriteIds(prev => [...prev, offerId]);
        }
        await favoritesService.toggleOffer(offerId);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] pb-24">
            {/* Get Verified Modal */}
            <AnimatePresence>
                {showVerifyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowVerifyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold dark:text-white mb-2">Unlock This Offer</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Verify your student status to claim exclusive discounts.
                                </p>
                            </div>

                            <Link href="/signup" className="block">
                                <Button className="w-full h-12 bg-black dark:bg-white dark:text-black text-white font-bold rounded-xl">
                                    Get Verified - Free
                                </Button>
                            </Link>

                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="w-full text-center text-sm text-gray-400 mt-4"
                            >
                                Maybe later
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${category.color} pt-2 pb-6 px-4`}>
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{category.emoji}</span>
                        <h1 className="font-bold text-xl text-white">{categoryName}</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/20 backdrop-blur rounded-xl p-1">
                    <button
                        onClick={() => { setActiveTab('online'); vibrate('light'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'online' ? 'bg-white text-black shadow' : 'text-white/80'
                            }`}
                    >
                        <Wifi className="h-4 w-4" />
                        Online ({offers.filter(o => o.type === 'percentage').length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('offline'); vibrate('light'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'offline' ? 'bg-white text-black shadow' : 'text-white/80'
                            }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Nearby ({offers.length})
                    </button>
                </div>
            </div>

            {/* Offers Grid */}
            <div className="min-h-[50vh]">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                    </div>
                ) : (
                    <MasonryGrid
                        items={filteredOffers}
                        columns={{ default: 2 }}
                        gap={12}
                        renderItem={(offer, index) => (
                            <OfferCard
                                offer={offer}
                                isFavorited={offer.id && favoriteIds.includes(offer.id)}
                                onToggleFavorite={(e) => offer.id && toggleFavorite(offer.id, e)}
                                priority={index < 4}
                                onClick={() => {
                                    if (!isVerified) {
                                        setShowVerifyModal(true);
                                    } else if (offer.id) {
                                        router.push(`/offer/${offer.id}`);
                                    }
                                }}
                            />
                        )}
                    />
                )}

                {!loading && filteredOffers.length === 0 && (
                    <div className="text-center py-16 text-white/40">
                        <p className="text-4xl mb-2">🔍</p>
                        <p className="text-sm">No {activeTab} offers found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
