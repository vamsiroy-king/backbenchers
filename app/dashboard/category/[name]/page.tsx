"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Wifi, MapPin, Heart, X, ShieldCheck, Loader2 } from "lucide-react";
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

    // Fetch offers and check auth status
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Check if user is a verified STUDENT (not just any session)
                const user = await authService.getCurrentUser();
                // Only count as verified if user is a student with complete profile
                const isStudentVerified = !!(user?.role === 'student' && user?.isComplete);
                setIsVerified(isStudentVerified);

                // Fetch offers by category
                const result = await offerService.getByCategory(categoryName);
                if (result.success && result.data) {
                    setOffers(result.data);
                }
            } catch (error) {
                console.error('Error fetching category offers:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [categoryName]);

    // Filter offers by type (online = no physical location, offline = physical store)
    // For now, we consider all merchant offers as "offline" since they're physical stores
    const offlineOffers = offers;
    const onlineOffers: Offer[] = []; // Online would be e-commerce deals which we don't have yet

    const currentOffers = activeTab === 'online' ? onlineOffers : offlineOffers;

    const handleOfferClick = (offer: Offer) => {
        if (!isVerified) {
            setShowVerifyModal(true);
        } else {
            // Navigate to offer detail or store
            router.push(`/store/${offer.merchantId}`);
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
        <div className="min-h-screen bg-white pb-24">
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
                            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Unlock This Offer</h2>
                                <p className="text-gray-500 text-sm">
                                    Verify your student status to claim exclusive discounts.
                                </p>
                            </div>

                            <Link href="/signup" className="block">
                                <Button className="w-full h-12 bg-black text-white font-bold rounded-xl">
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
                        Online ({onlineOffers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('offline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'offline' ? 'bg-white text-gray-900 shadow' : 'text-white/80'
                            }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Nearby ({offlineOffers.length})
                    </button>
                </div>
            </div>

            {/* Offers */}
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
                            {currentOffers.map((offer, index) => (
                                <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOfferClick(offer)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer active:bg-gray-50"
                                >
                                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-lg overflow-hidden`}>
                                        {offer.merchantLogo ? (
                                            <img src={offer.merchantLogo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            offer.merchantName?.[0] || offer.title[0]
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm truncate">{offer.merchantName || offer.title}</h4>
                                            {new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                                                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0">NEW</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-purple-600 font-semibold">{getDiscountText(offer)}</p>
                                        {offer.merchantCity && (
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" />
                                                {offer.merchantCity}
                                            </p>
                                        )}
                                    </div>

                                    <button className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <Heart className="h-4 w-4 text-gray-400" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {!loading && currentOffers.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-2">🔍</p>
                        <p className="text-sm">No {activeTab} offers yet</p>
                        <p className="text-xs mt-2">Check back soon for new deals!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
