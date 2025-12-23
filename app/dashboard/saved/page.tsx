"use client";

import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { favoriteService } from "@/lib/services/favorite.service";
import { Offer } from "@/lib/types";

export default function SavedPage() {
    const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSaved() {
            try {
                const result = await favoriteService.getMyFavorites();
                if (result.success && result.data) {
                    setSavedOffers(result.data);
                } else {
                    setError(result.error || 'Failed to load saved offers');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSaved();
    }, []);

    const handleRemove = async (offerId: string) => {
        const result = await favoriteService.removeFavorite(offerId);
        if (result.success) {
            setSavedOffers(prev => prev.filter(o => o.id !== offerId));
        }
    };

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
                <div className="px-5 h-16 flex items-center gap-4">
                    <Link href="/dashboard">
                        <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                        <h1 className="text-xl font-bold">Saved Offers</h1>
                    </div>
                </div>
            </header>

            <main className="px-5 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 mb-4">{error}</p>
                        <p className="text-sm text-gray-400">
                            Make sure to run the favorites SQL migration in Supabase first.
                        </p>
                    </div>
                ) : savedOffers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-10 w-10 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No saved offers yet</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Tap the heart icon on any offer to save it here
                        </p>
                        <Link href="/dashboard/explore">
                            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
                                Explore Offers
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {savedOffers.map((offer) => (
                                <motion.div
                                    key={offer.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-gray-50 rounded-2xl p-4 relative"
                                >
                                    <div className="flex gap-4">
                                        {/* Logo */}
                                        <div className="h-16 w-16 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                            {offer.merchantLogo ? (
                                                <img src={offer.merchantLogo} alt="" className="h-12 w-12 object-contain" />
                                            ) : (
                                                <span className="text-2xl">🏪</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-medium">{offer.merchantName}</p>
                                            <h3 className="font-bold text-gray-900 truncate">{offer.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-bold">
                                                    {offer.type === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                                </span>
                                                {offer.validUntil && (
                                                    <span className="text-xs text-gray-400">
                                                        Expires {new Date(offer.validUntil).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => handleRemove(offer.id)}
                                            className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                                        >
                                            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
