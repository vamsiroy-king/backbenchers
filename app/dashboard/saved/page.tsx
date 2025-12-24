"use client";

import { Heart, Store, ArrowLeft, Tag, Loader2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { favoritesService, Favorite } from "@/lib/services/favorites.service";

export default function SavedPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'merchants' | 'offers'>('merchants');
    const [savedMerchants, setSavedMerchants] = useState<Favorite[]>([]);
    const [savedOffers, setSavedOffers] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSaved() {
            setLoading(true);
            try {
                const [merchantsResult, offersResult] = await Promise.all([
                    favoritesService.getSavedMerchants(),
                    favoritesService.getSavedOffers()
                ]);

                if (merchantsResult.success && merchantsResult.data) {
                    setSavedMerchants(merchantsResult.data);
                }
                if (offersResult.success && offersResult.data) {
                    setSavedOffers(offersResult.data);
                }
            } catch (error) {
                console.error('Error fetching saved items:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSaved();
    }, []);

    const handleRemove = async (favoriteId: string, type: 'merchant' | 'offer') => {
        setRemovingId(favoriteId);
        const result = await favoritesService.remove(favoriteId);
        if (result.success) {
            if (type === 'merchant') {
                setSavedMerchants(prev => prev.filter(f => f.id !== favoriteId));
            } else {
                setSavedOffers(prev => prev.filter(f => f.id !== favoriteId));
            }
        }
        setRemovingId(null);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
                <div className="px-5 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold dark:text-white">Saved</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-5 pb-4">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('merchants')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'merchants'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Stores ({savedMerchants.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('offers')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'offers'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Offers ({savedOffers.length})
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-4">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'merchants' ? (
                            <motion.div
                                key="merchants"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                {savedMerchants.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Store className="w-7 h-7 text-gray-400" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">No saved stores</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Tap the heart on any store to save it here
                                        </p>
                                        <Link href="/dashboard/explore" className="inline-block mt-4">
                                            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
                                                Explore Stores
                                            </button>
                                        </Link>
                                    </div>
                                ) : (
                                    savedMerchants.map((fav) => (
                                        <motion.div
                                            key={fav.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4"
                                        >
                                            <Link href={`/store/${fav.merchantId}`} className="flex-1 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                                    {fav.merchant?.logo ? (
                                                        <img src={fav.merchant.logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-6 h-6 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                                        {fav.merchant?.businessName || 'Store'}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {fav.merchant?.category} • {fav.merchant?.city}
                                                    </p>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(fav.id, 'merchant')}
                                                disabled={removingId === fav.id}
                                                className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                                            >
                                                {removingId === fav.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                                ) : (
                                                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                                                )}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="offers"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-3"
                            >
                                {savedOffers.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Tag className="w-7 h-7 text-gray-400" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">No saved offers</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Tap the heart on any offer to save it here
                                        </p>
                                        <Link href="/dashboard/explore" className="inline-block mt-4">
                                            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
                                                Explore Offers
                                            </button>
                                        </Link>
                                    </div>
                                ) : (
                                    savedOffers.map((fav) => (
                                        <motion.div
                                            key={fav.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4"
                                        >
                                            <Link href={`/store/${fav.offer?.merchantId}`} className="flex-1 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white">
                                                    <span className="text-sm font-bold">
                                                        {fav.offer?.type === 'percentage'
                                                            ? `${fav.offer.discountValue}%`
                                                            : `₹${fav.offer?.discountValue}`}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                                        {fav.offer?.title || 'Offer'}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {fav.offer?.merchantName || 'Store'}
                                                    </p>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(fav.id, 'offer')}
                                                disabled={removingId === fav.id}
                                                className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                                            >
                                                {removingId === fav.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                                ) : (
                                                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                                                )}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
