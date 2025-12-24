"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, MapPin, Heart, ShieldCheck, Loader2, Tag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { offerService } from "@/lib/services/offer.service";
import { authService } from "@/lib/services/auth.service";
import { Offer } from "@/lib/types";

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
    const [merchants, setMerchants] = useState<MerchantWithOffers[]>([]);
    const [isVerified, setIsVerified] = useState(false);

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
                    // Group offers by merchantId - no duplicates!
                    const merchantMap = new Map<string, MerchantWithOffers>();

                    result.data.forEach((offer) => {
                        const merchantId = offer.merchantId;

                        if (merchantMap.has(merchantId)) {
                            // Add to existing merchant's offers
                            const existing = merchantMap.get(merchantId)!;
                            existing.offers.push(offer);

                            // Update best offer if this one is better
                            if (offer.discountValue > existing.bestOffer.discountValue) {
                                existing.bestOffer = offer;
                            }
                        } else {
                            // Create new merchant entry
                            merchantMap.set(merchantId, {
                                merchantId,
                                merchantName: offer.merchantName || offer.title,
                                merchantLogo: offer.merchantLogo,
                                merchantCity: offer.merchantCity,
                                offers: [offer],
                                bestOffer: offer
                            });
                        }
                    });

                    // Convert to array and sort by offer count
                    const groupedMerchants = Array.from(merchantMap.values())
                        .sort((a, b) => b.offers.length - a.offers.length);

                    setMerchants(groupedMerchants);
                }
            } catch (error) {
                console.error('Error fetching category offers:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [categoryName]);

    // For now, all are offline (physical stores)
    const offlineMerchants = merchants;
    const onlineMerchants: MerchantWithOffers[] = [];

    const currentMerchants = activeTab === 'online' ? onlineMerchants : offlineMerchants;

    const handleMerchantClick = (merchant: MerchantWithOffers) => {
        if (!isVerified) {
            setShowVerifyModal(true);
        } else {
            // Navigate to merchant store page
            router.push(`/store/${merchant.merchantId}`);
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

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pb-24">
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
                        onClick={() => setActiveTab('online')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'online' ? 'bg-white text-gray-900 shadow' : 'text-white/80'
                            }`}
                    >
                        <Wifi className="h-4 w-4" />
                        Online ({onlineMerchants.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('offline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'offline' ? 'bg-white text-gray-900 shadow' : 'text-white/80'
                            }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Nearby ({offlineMerchants.length})
                    </button>
                </div>
            </div>

            {/* Merchants (grouped - no duplicates) */}
            <div className="px-4 pt-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {currentMerchants.map((merchant, index) => (
                                <motion.div
                                    key={merchant.merchantId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMerchantClick(merchant)}
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800"
                                >
                                    {/* Merchant Logo */}
                                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-lg overflow-hidden`}>
                                        {merchant.merchantLogo ? (
                                            <img src={merchant.merchantLogo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            merchant.merchantName[0]
                                        )}
                                    </div>

                                    {/* Merchant Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm dark:text-white truncate">{merchant.merchantName}</h4>
                                            {/* Offer count badge */}
                                            {merchant.offers.length > 1 && (
                                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                                    <Tag className="h-2.5 w-2.5" />
                                                    {merchant.offers.length} offers
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-primary font-semibold">{getDiscountText(merchant.bestOffer)}</p>
                                        {merchant.merchantCity && (
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" />
                                                {merchant.merchantCity}
                                            </p>
                                        )}
                                    </div>

                                    {/* Favorite button */}
                                    <button className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <Heart className="h-4 w-4 text-gray-400" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {!loading && currentMerchants.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-2">🔍</p>
                        <p className="text-sm dark:text-gray-500">No {activeTab} merchants yet</p>
                        <p className="text-xs mt-2 dark:text-gray-600">Check back soon for new deals!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
