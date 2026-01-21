"use client";

import { Search, ChevronLeft, Wifi, MapPin, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { offerService } from "@/lib/services/offer.service";
import { studentService } from "@/lib/services/student.service";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { Offer, OnlineBrand } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// District-style categories with proper icons and screenshot-matched colors
const CATEGORIES = [
    { id: 'Food', name: "Food & Beverages", icon: "🍕", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#A855F7]" },
    { id: 'Fashion', name: "Fashion & Apparel", icon: "👗", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#EC4899]" },
    { id: 'Fitness', name: "Health & Fitness", icon: "💪", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#3B82F6]" },
    { id: 'Entertainment', name: "Entertainment", icon: "🎬", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#F59E0B]" },
    { id: 'Technology', name: "Tech & Gadgets", icon: "💻", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#6366F1]" },
    { id: 'Beauty', name: "Skincare & Beauty", icon: "💄", bgColor: "bg-[#1a1a1a]", headerColor: "bg-[#8B5CF6]" },
];

const SEARCH_PLACEHOLDERS = ["Search 'Sneakers'", "Search 'Coffee'", "Search 'Gym'", "Search 'Nike'"];

export default function ExplorePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");

    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [onlineBrands, setOnlineBrands] = useState<OnlineBrand[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
    const [activeTab, setActiveTab] = useState<'nearby' | 'online'>('nearby');
    const [studentCity, setStudentCity] = useState<string | null>(null);
    const [studentState, setStudentState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Track loading for skeleton counts
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    // Global Favorites
    const { isFavorite, toggleFavorite } = useFavorites();

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
            setLoading(true); // Start loading - show skeleton counts
            try {
                // 1. Get city/state from LocalStorage (User selection) OR Profile (Fallback)
                let city: string | null = null;
                let state: string | null = null;

                if (typeof window !== 'undefined') {
                    city = localStorage.getItem('selectedCity');
                }

                if (!city) {
                    const profileRes = await studentService.getMyProfile();
                    if (profileRes.success && profileRes.data) {
                        city = profileRes.data.city || null;
                        state = profileRes.data.state || null;
                    }
                }

                setStudentCity(city);
                setStudentState(state);

                // 2. Fetch Offline offers (for Nearby tab)
                let offersRes;
                if (categoryParam) {
                    offersRes = await offerService.getByCategory(categoryParam);
                } else {
                    offersRes = await offerService.getActiveOffers();
                }

                if (offersRes.success && offersRes.data) {
                    setOffers(offersRes.data);
                } else {
                    setOffers([]);
                }

                // 3. Fetch Online brands (for Online tab) - uses location-aware filtering
                // PAN_INDIA offers will show to everyone
                // CITIES offers will only show to matching students
                const studentLocation = { city: city || undefined, state: state || undefined };
                const brands = await onlineBrandService.getAllBrands(
                    categoryParam || undefined,
                    studentLocation
                );
                setOnlineBrands(brands);

            } catch (error) {
                console.error('Error loading explore data:', error);
                setOffers([]);
                setOnlineBrands([]);
            } finally {
                setLoading(false); // Done loading - show actual counts
            }
        }

        fetchData();
    }, [categoryParam]); // Re-fetch when category changes

    // Filter AND Group offers by city & merchant
    useEffect(() => {
        if (offers.length === 0) {
            setFilteredOffers([]);
            return;
        }

        let result = offers;

        // 1. City Filter
        if (studentCity) {
            result = result.filter(o =>
                !o.merchantCity ||
                o.merchantCity.toLowerCase() === studentCity.toLowerCase() ||
                o.merchantCity === 'All India' ||
                (o.type as any) === 'online' || (o as any).isOnline // Always show online
            );
        }

        // 2. Group by Merchant (Show 1 card per Store)
        const merchantMap = new Map<string, Offer>();
        result.forEach(offer => {
            const existing = merchantMap.get(offer.merchantId || '');
            // Keep the one with higher discount
            if (!existing || (offer.discountValue || 0) > (existing.discountValue || 0)) {
                merchantMap.set(offer.merchantId || '', offer);
            }
        });

        // Convert map back to array
        const grouped = Array.from(merchantMap.values());

        setFilteredOffers(grouped);
    }, [offers, studentCity]);

    const handleToggleFavorite = async (e: React.MouseEvent, offerId: string) => {
        e.preventDefault();
        e.stopPropagation();
        vibrate('light');
        await toggleFavorite(offerId);
    };

    // --- VIEW 1: CATEGORY DETAILS ---
    if (categoryParam) {
        const categoryData = CATEGORIES.find(c => c.id === categoryParam) || { name: categoryParam, icon: "🔍", headerColor: "bg-purple-600" };

        // Nearby offers = offline merchant offers (already filtered by city)
        const nearbyOffers = filteredOffers;

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

                    {/* Tabs - Instant counts */}
                    <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('online')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'online' ? "bg-white/20 text-white shadow-sm" : "text-white/60 hover:text-white"
                            )}
                        >
                            <Wifi className="h-4 w-4" />
                            <span>Online ({onlineBrands.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('nearby')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'nearby' ? "bg-black text-white shadow-lg" : "text-white/60 hover:text-white"
                            )}
                        >
                            <MapPin className="h-4 w-4" />
                            <span>Nearby ({nearbyOffers.length})</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="px-4 py-4 space-y-3">
                    {/* ONLINE TAB - Show Online Brands */}
                    {activeTab === 'online' && (
                        <>
                            {onlineBrands.length > 0 ? (
                                onlineBrands.map((brand) => (
                                    <Link href={`/dashboard/online-brand/${brand.id}`} key={brand.id}>
                                        <motion.div
                                            whileTap={{ scale: 0.99 }}
                                            transition={{ duration: 0.05 }}
                                            className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center gap-4 group"
                                        >
                                            {/* Logo */}
                                            <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {brand.logoUrl ? (
                                                    <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-contain" />
                                                ) : (
                                                    <span className="text-xl font-bold text-black">{brand.name?.[0]}</span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-semibold text-[15px] truncate">{brand.name}</h3>
                                                <p className="text-green-500 font-bold text-sm tracking-wide">
                                                    Online Discounts Available
                                                </p>
                                                <div className="flex items-center gap-1 text-[#666] text-xs mt-1">
                                                    <Wifi className="h-3 w-3" />
                                                    <span>{brand.category}</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <ChevronLeft className="h-5 w-5 text-[#444] rotate-180" />
                                        </motion.div>
                                    </Link>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="h-16 w-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                                        <Wifi className="h-6 w-6 text-[#333]" />
                                    </div>
                                    <p className="text-white/40 text-sm">No online brand partners yet</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* NEARBY TAB - Show Offline Merchant Offers */}
                    {activeTab === 'nearby' && (
                        <>
                            {nearbyOffers.length > 0 ? (
                                nearbyOffers.map((offer) => (
                                    <Link href={`/store/${offer.merchantId}`} key={offer.id}>
                                        <motion.div
                                            whileTap={{ scale: 0.99 }}
                                            transition={{ duration: 0.05 }}
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
                                                {offer.merchantCity && (
                                                    <div className="flex items-center gap-1 text-[#666] text-xs mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{offer.merchantCity}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Heart/Fav */}
                                            <button
                                                onClick={(e) => handleToggleFavorite(e, offer.merchantId)}
                                                className="text-[#444] group-hover:text-white transition-colors"
                                            >
                                                <Heart
                                                    className={cn("h-5 w-5", isFavorite(offer.merchantId) && "fill-red-500 text-red-500")}
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
                                    <p className="text-white/40 text-sm">No nearby offers in {studentCity || 'your city'}</p>
                                </div>
                            )}
                        </>
                    )}
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
