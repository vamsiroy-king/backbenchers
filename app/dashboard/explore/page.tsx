"use client";

import { Search, ChevronLeft, Wifi, MapPin, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { offerService } from "@/lib/services/offer.service";
import { favoritesService } from "@/lib/services/favorites.service"; // Import favorites service
import { Offer } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// District-style categories with proper icons and screenshot-matched colors
const CATEGORIES = [
    { id: 'Food', name: "Food", icon: "🍕", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#A855F7]" },
    { id: 'Fashion', name: "Fashion", icon: "👗", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#EC4899]" },
    { id: 'Fitness', name: "Fitness", icon: "💪", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#3B82F6]" },
    { id: 'Entertainment', name: "Fun", icon: "🎬", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#F59E0B]" },
    { id: 'Technology', name: "Tech", icon: "💻", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#6366F1]" },
    { id: 'Beauty', name: "Beauty", icon: "💄", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#8B5CF6]" },
];

const SEARCH_PLACEHOLDERS = ["Search 'Sneakers'", "Search 'Coffee'", "Search 'Gym'", "Search 'Nike'"];

export default function ExplorePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");

    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [activeTab, setActiveTab] = useState<'nearby' | 'online'>('nearby');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    // Placeholder animation
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Fetch data based on view
    useEffect(() => {
        async function fetchData() {
            try {
                let offersRes;
                if (categoryParam) {
                    // Use backend ILIKE search for better matching (e.g. 'Food' matches 'Fast Food')
                    offersRes = await offerService.getByCategory(categoryParam);
                } else {
                    offersRes = await offerService.getActiveOffers();
                }

                if (offersRes.success && offersRes.data) {
                    setOffers(offersRes.data);
                } else {
                    setOffers([]);
                }
            } catch (error) {
                console.error('Error loading explore data:', error);
                setOffers([]);
            }
        }

        // Also fetch saved status
        async function fetchSavedStatus() {
            const savedIds = await favoritesService.getSavedOfferIds();
            setFavorites(new Set(savedIds));
        }

        fetchData();
        fetchSavedStatus();
    }, [categoryParam]); // Re-fetch when category changes

    const toggleFavorite = async (e: React.MouseEvent, offerId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Optimistic update
        const isLiked = favorites.has(offerId);
        const newFavs = new Set(favorites);
        if (isLiked) {
            newFavs.delete(offerId);
            vibrate('light');
        } else {
            newFavs.add(offerId);
            vibrate('success');
        }
        setFavorites(newFavs);

        // API Call
        try {
            await favoritesService.toggleOffer(offerId);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert on error
            setFavorites(prev => {
                const reverted = new Set(prev);
                if (isLiked) reverted.add(offerId);
                else reverted.delete(offerId);
                return reverted;
            });
        }
    };

    // --- VIEW 1: CATEGORY DETAILS (Matches Screenshot 1:1) ---
    if (categoryParam) {
        const categoryData = CATEGORIES.find(c => c.id === categoryParam) || { name: categoryParam, icon: "🔍", headerColor: "bg-purple-600" };

        // Use the fetched filtered offers directly
        // Still separate Online vs Nearby
        const onlineOffers = offers.filter(o => (o.type as any) === 'online' || (o as any).isOnline);
        const nearbyOffers = offers.filter(o => !((o.type as any) === 'online' || (o as any).isOnline));

        // Group by merchant - show each merchant once with their best discount
        const groupByMerchant = (offersList: Offer[]) => {
            const merchantMap = new Map<string, Offer>();
            offersList.forEach(offer => {
                const existing = merchantMap.get(offer.merchantId || '');
                if (!existing || (offer.discountValue || 0) > (existing.discountValue || 0)) {
                    merchantMap.set(offer.merchantId || '', offer);
                }
            });
            return Array.from(merchantMap.values());
        };

        const displayedOffers = activeTab === 'nearby'
            ? groupByMerchant(nearbyOffers)
            : groupByMerchant(onlineOffers);

        return (
            <div className="min-h-screen bg-black">
                {/* Purple Header */}
                <header className={cn("px-5 pt-6 pb-6 sticky top-0 z-50", categoryData.headerColor)}>
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span>{categoryData.icon}</span>
                            <span>{categoryData.name}</span>
                        </h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('online')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'online' ? "bg-white/20 text-white shadow-sm" : "text-white/60 hover:text-white"
                            )}
                        >
                            <Wifi className="h-4 w-4" />
                            <span>Online ({groupByMerchant(onlineOffers).length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('nearby')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'nearby' ? "bg-black text-white shadow-lg" : "text-white/60 hover:text-white"
                            )}
                        >
                            <MapPin className="h-4 w-4" />
                            <span>Nearby ({groupByMerchant(nearbyOffers).length})</span>
                        </button>
                    </div>
                </header>

                {/* Content List Matches Screenshot */}
                <main className="px-4 py-4 space-y-3">
                    {displayedOffers.length > 0 ? (
                        displayedOffers.map((offer) => (
                            <Link href={`/store/${offer.merchantId}`} key={offer.id}>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center gap-4 group"
                                >
                                    {/* Logo */}
                                    <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {offer.merchantLogo ? (
                                            <img src={offer.merchantLogo} alt="" className="h-full w-full object-contain" />
                                        ) : (
                                            <span className="text-xl font-bold text-black">{offer.merchantName?.[0]}</span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-white font-semibold text-[15px] truncate">{offer.merchantName}</h3>
                                            {/* Rating Badge */}
                                            {(offer as any).avgRating > 0 && (
                                                <div className="flex items-center gap-0.5 bg-yellow-500/20 px-1.5 py-0.5 rounded">
                                                    <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-[10px] font-bold text-yellow-400">{(offer as any).avgRating?.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-green-500 font-bold text-sm tracking-wide">
                                            {offer.type === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {offer.merchantCity && (
                                                <div className="flex items-center gap-1 text-[#666] text-xs">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{offer.merchantCity}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Heart/Fav */}
                                    <button
                                        onClick={(e) => toggleFavorite(e, offer.id!)}
                                        className="text-[#444] group-hover:text-white transition-colors"
                                    >
                                        <Heart
                                            className={cn("h-5 w-5", favorites.has(offer.id!) && "fill-red-500 text-red-500")}
                                        />
                                    </button>
                                </motion.div>
                            </Link>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                                <Search className="h-6 w-6 text-[#333]" />
                            </div>
                            <p className="text-white/40 text-sm">No offers found in this category</p>
                        </div>
                    )
                    }
                </main>
            </div>
        );
    }

    // --- VIEW 2: DEFAULT EXPORE REPLICA (If navigated directly) ---
    return (
        <div className="min-h-screen bg-black pb-32">
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#111] px-5 py-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-[#1a1a1a] rounded-2xl pl-11 pr-4 text-[15px] text-white placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-[#333] transition-all"
                        placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                    />
                </div>
            </header>

            <main>
                <div className="flex items-center gap-4 py-4 px-5">
                    <div className="h-px flex-1 bg-[#222]" />
                    <span className="text-[11px] font-medium text-[#555] uppercase tracking-wider">Shop by Category</span>
                    <div className="h-px flex-1 bg-[#222]" />
                </div>

                <div className="grid grid-cols-3 gap-3 px-5 pb-4">
                    {CATEGORIES.map((cat, i) => (
                        <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                vibrate('light');
                                router.push(`/dashboard/explore?category=${cat.id}`);
                            }}
                            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border bg-[#111] border-[#222] hover:border-[#333] transition-all"
                        >
                            <span className="text-3xl">{cat.icon}</span>
                            <span className="text-xs font-medium text-[#888]">{cat.name}</span>
                        </motion.button>
                    ))}
                </div>
            </main>
        </div>
    );
}
