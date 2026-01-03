"use client";

import { Heart, Store, ArrowLeft, Tag, Loader2, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { favoritesService, Favorite } from "@/lib/services/favorites.service";
import { MasonryGrid } from "@/components/ui/MasonryGrid";
import { OfferCard } from "@/components/OfferCard";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

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
        <div className="min-h-screen bg-[#0a0a0b] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="px-5 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="h-10 w-10 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-white/60" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5 text-green-400" />
                        <h1 className="text-lg font-bold text-white">Saved</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-5 pb-4">
                    <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                        <button
                            onClick={() => { setActiveTab('merchants'); vibrate('light'); }}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                activeTab === 'merchants' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white/70'
                            )}
                        >
                            Stores ({savedMerchants.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('offers'); vibrate('light'); }}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                                activeTab === 'offers' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white/70'
                            )}
                        >
                            Offers ({savedOffers.length})
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-4">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
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
                                        <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Store className="w-7 h-7 text-white/40" />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">No saved stores</h3>
                                        <p className="text-sm text-white/50">
                                            Tap the heart on any store to save it here
                                        </p>
                                        <Link href="/dashboard/explore" className="inline-block mt-4">
                                            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/25">
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
                                            className="bg-white/[0.04] rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 hover:bg-white/[0.06] transition-colors"
                                        >
                                            <Link href={`/store/${fav.merchantId}`} className="flex-1 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-green-500/15 flex items-center justify-center overflow-hidden">
                                                    {fav.merchant?.logo ? (
                                                        <img src={fav.merchant.logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-6 h-6 text-green-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white truncate">
                                                        {fav.merchant?.businessName || 'Store'}
                                                    </h4>
                                                    <p className="text-xs text-white/50">
                                                        {fav.merchant?.category} • {fav.merchant?.city}
                                                    </p>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(fav.id, 'merchant')}
                                                disabled={removingId === fav.id}
                                                className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                            >
                                                {removingId === fav.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
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
                                className="min-h-[50vh]"
                            >
                                {savedOffers.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Tag className="w-7 h-7 text-white/40" />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">No saved offers</h3>
                                        <p className="text-sm text-white/50">
                                            Tap the heart on any offer to save it here
                                        </p>
                                        <Link href="/dashboard/explore" className="inline-block mt-4">
                                            <button className="bg-white text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-white/10 hover:bg-gray-200 transition-colors">
                                                Explore Offers
                                            </button>
                                        </Link>
                                    </div>
                                ) : (
                                    <MasonryGrid
                                        items={savedOffers.filter(f => f.offer)} // Type guard
                                        columns={{ default: 2 }}
                                        gap={12}
                                        renderItem={(fav) => (
                                            fav.offer && (
                                                <OfferCard
                                                    offer={fav.offer}
                                                    isFavorited={true}
                                                    onToggleFavorite={(e) => handleRemove(fav.id, 'offer')}
                                                    onClick={() => {
                                                        vibrate('light');
                                                        router.push(`/offer/${fav.offer!.id}`);
                                                    }}
                                                />
                                            )
                                        )}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
