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
import { studentService } from "@/lib/services/student.service";
import { Offer, OnlineBrand } from "@/lib/types";
import { MasonryGrid } from "@/components/ui/MasonryGrid";
import { OfferCard } from "@/components/OfferCard";
import { OnlineBrandCard } from "@/components/OnlineBrandCard";
import { onlineBrandService } from "@/lib/services/online-brand.service";
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

    // Read saved tab from localStorage on mount
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('categoryTabPreference') as 'online' | 'offline') || 'offline';
        }
        return 'offline';
    });
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data states
    const [offers, setOffers] = useState<Offer[]>([]); // Offline
    const [onlineBrands, setOnlineBrands] = useState<OnlineBrand[]>([]); // Online

    const [isVerified, setIsVerified] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    // Save tab preference when changed
    const handleTabChange = (tab: 'online' | 'offline') => {
        setActiveTab(tab);
        vibrate('light');
        if (typeof window !== 'undefined') {
            localStorage.setItem('categoryTabPreference', tab);
        }
    };

    // Fetch offers and group by merchant
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // Check if user is a verified STUDENT
                const user = await authService.getCurrentUser();
                const isStudentVerified = !!(user?.role === 'student' && user?.isComplete);
                setIsVerified(isStudentVerified);

                // Get student's location (city/state) for filtering online offers
                let studentLocation: { city?: string; state?: string } = {};

                // Try localStorage first (user's selected city)
                if (typeof window !== 'undefined') {
                    const selectedCity = localStorage.getItem('selectedCity');
                    if (selectedCity) {
                        studentLocation.city = selectedCity;
                    }
                }

                // Fallback to profile if available
                if (!studentLocation.city) {
                    const profileRes = await studentService.getMyProfile();
                    if (profileRes.success && profileRes.data) {
                        studentLocation.city = profileRes.data.city || undefined;
                        studentLocation.state = profileRes.data.state || undefined;
                    }
                }

                // 1. Fetch Offline offers
                const result = await offerService.getByCategory(categoryName);
                if (result.success && result.data) {
                    setOffers(result.data);
                }

                // 2. Fetch Online Brands with location-aware filtering
                // PAN_INDIA offers will show to everyone
                // STATES/CITIES offers will only show to matching students
                let searchCategory = categoryName;
                if (categoryName.includes("Food")) searchCategory = "Food";
                if (categoryName.includes("Fashion")) searchCategory = "Fashion";
                if (categoryName.includes("Tech") || categoryName.includes("Electronics")) searchCategory = "Tech";
                if (categoryName.includes("Fitness") || categoryName.includes("Health")) searchCategory = "Fitness";
                if (categoryName.includes("Beauty")) searchCategory = "Beauty";

                // Pass student location - brands with PAN_INDIA offers will always appear
                const brands = await onlineBrandService.getAllBrands(searchCategory, studentLocation);
                setOnlineBrands(brands);

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

                            <Link href="/verify" className="block">
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

                {/* Tabs - Stable counts (only shown after load) */}
                <div className="flex bg-white/20 backdrop-blur rounded-xl p-1">
                    <button
                        onClick={() => handleTabChange('online')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors active:opacity-80 ${activeTab === 'online' ? 'bg-white text-black shadow' : 'text-white/80'
                            }`}
                    >
                        <Wifi className="h-4 w-4" />
                        Online{!loading && onlineBrands.length > 0 ? ` (${onlineBrands.length})` : ''}
                    </button>
                    <button
                        onClick={() => handleTabChange('offline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors active:opacity-80 ${activeTab === 'offline' ? 'bg-white text-black shadow' : 'text-white/80'
                            }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Nearby{!loading && offers.length > 0 ? ` (${offers.length})` : ''}
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
                    <>
                        {/* ONLINE TAB */}
                        {activeTab === 'online' && (
                            <MasonryGrid
                                items={onlineBrands}
                                columns={{ default: 2 }}
                                gap={12}
                                renderItem={(brand) => (
                                    <OnlineBrandCard
                                        brand={brand}
                                        onClick={() => router.push(`/dashboard/online-brand/${brand.id}`)}
                                        priority={true}
                                    />
                                )}
                            />
                        )}

                        {/* OFFLINE TAB */}
                        {activeTab === 'offline' && (
                            <MasonryGrid
                                items={offers}
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

                        {/* Empty States */}
                        {!loading && activeTab === 'online' && onlineBrands.length === 0 && (
                            <div className="text-center py-16 text-white/40">
                                <p className="text-4xl mb-2">🔍</p>
                                <p className="text-sm">No online brand partners yet.</p>
                            </div>
                        )}
                        {!loading && activeTab === 'offline' && offers.length === 0 && (
                            <div className="text-center py-16 text-white/40">
                                <p className="text-4xl mb-2">🔍</p>
                                <p className="text-sm">No nearby offline offers found</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
