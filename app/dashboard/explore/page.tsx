"use client";

import { Search, ChevronLeft, Wifi, MapPin, Heart, Star, Zap, Sparkles, TrendingUp } from "lucide-react";
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
import { OfferCard } from "@/components/OfferCard";

// District-style categories with proper icons
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
    const [onlineBrands, setOnlineBrands] = useState<OnlineBrand[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
    const [activeTab, setActiveTab] = useState<'nearby' | 'online'>('nearby');
    const [studentCity, setStudentCity] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // 1. Get location
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

                // 2. Fetch Offline offers
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

                // 3. Fetch Online brands
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
                setLoading(false);
            }
        }

        fetchData();
    }, [categoryParam]);

    // Filter & Group logic
    useEffect(() => {
        if (offers.length === 0) {
            setFilteredOffers([]);
            return;
        }

        let result = offers;

        // City Filter
        if (studentCity) {
            result = result.filter(o =>
                !o.merchantCity ||
                o.merchantCity.toLowerCase() === studentCity.toLowerCase() ||
                o.merchantCity === 'All India' ||
                (o.type as any) === 'online' || (o as any).isOnline
            );
        }

        // Group by Merchant (Best Offer)
        const merchantMap = new Map<string, Offer>();
        result.forEach(offer => {
            const existing = merchantMap.get(offer.merchantId || '');
            if (!existing || (offer.discountValue || 0) > (existing.discountValue || 0)) {
                merchantMap.set(offer.merchantId || '', offer);
            }
        });

        setFilteredOffers(Array.from(merchantMap.values()));
    }, [offers, studentCity]);

    const handleToggleFavorite = async (e: React.MouseEvent, offerId: string) => {
        e.preventDefault();
        e.stopPropagation();
        vibrate('light');
        await toggleFavorite(offerId);
    };

    const isOnlineBrandFavorite = (brandId: string) => isFavorite(brandId);
    const handleToggleOnlineFavorite = async (e: React.MouseEvent, brandId: string) => {
        e.preventDefault();
        e.stopPropagation();
        vibrate('light');
        await toggleFavorite(brandId);
    };

    // --- Data Segmentation for Default View ---
    const techBrands = onlineBrands.filter(b =>
        b.category?.includes('Tech') || b.category?.includes('Gadget') || b.category?.includes('Electronics')
    );
    const genZBrands = onlineBrands.filter(b =>
        b.category?.includes('Fashion') || b.category?.includes('Apparel') || b.category?.includes('Beauty')
    );
    // Use the rest or random for engaging content
    const engagingContent = [...filteredOffers].sort(() => 0.5 - Math.random()).slice(0, 5);


    // --- VIEW 1: CATEGORY DETAILS (Existing Logic) ---
    if (categoryParam) {
        const categoryData = CATEGORIES.find(c => c.id === categoryParam) || { name: categoryParam, icon: "🔍", headerColor: "bg-purple-600" };
        const nearbyOffers = filteredOffers;

        return (
            <div className="min-h-screen bg-black">
                {/* Header */}
                <header className={cn("px-5 pt-6 pb-6 sticky top-0 z-50", categoryData.headerColor)}>
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => router.push('/dashboard/explore')}
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

                <main className="px-4 py-4 space-y-3 pb-32">
                    {activeTab === 'online' && (
                        onlineBrands.length > 0 ? (
                            onlineBrands.map((brand) => (
                                <Link href={`/dashboard/online-brand/${brand.id}`} key={brand.id}>
                                    <motion.div
                                        whileTap={{ scale: 0.99 }}
                                        className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center gap-4 group"
                                    >
                                        <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {brand.logoUrl ? (
                                                <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="text-xl font-bold text-black">{brand.name?.[0]}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold text-[15px] truncate">{brand.name}</h3>
                                            <p className="text-green-500 font-bold text-sm tracking-wide">Online Discounts Available</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button onClick={(e) => handleToggleOnlineFavorite(e, brand.id)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#444] hover:text-white hover:bg-white/20 transition-all">
                                                <Heart className={cn("h-4 w-4", isOnlineBrandFavorite(brand.id) && "fill-red-500 text-red-500")} />
                                            </button>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-white/40 text-sm">No online brand partners yet</p>
                            </div>
                        )
                    )}

                    {activeTab === 'nearby' && (
                        nearbyOffers.length > 0 ? (
                            nearbyOffers.map((offer) => (
                                <div key={offer.id}>
                                    <OfferCard
                                        offer={{ ...offer, avgRating: (offer as any).avgRating, totalRatings: (offer as any).totalRatings }}
                                        isFavorited={isFavorite(offer.merchantId)}
                                        onToggleFavorite={(e) => handleToggleFavorite(e, offer.merchantId)}
                                        onClick={() => router.push(`/store/${offer.merchantId}`)}
                                        variant="horizontal"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-white/40 text-sm">No nearby offers in {studentCity || 'your city'}</p>
                            </div>
                        )
                    )}
                </main>
            </div>
        );
    }

    // --- VIEW 2: NEW ENGAGING EXPLORE PAGE ---
    return (
        <div className="min-h-screen bg-black pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#111]">
                <div className="max-w-7xl mx-auto px-5 py-4 space-y-4">
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
                </div>
            </header>

            <main className="py-2 space-y-8 max-w-7xl mx-auto w-full">

                {/* Categories - RESTORED GRID */}
                <section className="px-5 pt-4">
                    <div className="flex items-center justify-center mb-5">
                        <div className="flex-1 h-px bg-[#222]" />
                        <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-[#555]">SHOP BY CATEGORY</span>
                        <div className="flex-1 h-px bg-[#222]" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
                        {CATEGORIES.map((cat) => (
                            <motion.button
                                key={cat.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    vibrate('light');
                                    router.push(`/dashboard/explore?category=${cat.id}`);
                                }}
                                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border bg-[#111] border-[#222] hover:border-[#333] transition-all group"
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                                <span className="text-xs font-medium text-[#888] group-hover:text-white transition-colors">{cat.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Big Techies - Premium Horizontal Scroll */}
                <section>
                    <div className="flex items-center justify-center mb-5 px-5">
                        <div className="flex-1 h-px bg-[#222]" />
                        <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-[#555]">BIG TECHIES</span>
                        <div className="flex-1 h-px bg-[#222]" />
                    </div>

                    <div className="flex gap-4 px-5 overflow-x-auto hide-scrollbar snap-x">
                        {techBrands.length > 0 ? techBrands.map(brand => (
                            <Link href={`/dashboard/online-brand/${brand.id}`} key={brand.id} className="snap-start">
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className="w-[120px] flex-shrink-0 group"
                                >
                                    <div className="aspect-square bg-[#111] rounded-2xl p-4 flex items-center justify-center border border-[#222] group-hover:border-[#333] transition-all mb-2 relative overflow-hidden">
                                        {brand.logoUrl ? (
                                            <img src={brand.logoUrl} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-3xl">💻</div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-white truncate px-1">{brand.name}</p>
                                        <p className="text-[10px] text-green-500 font-bold">UP TO 50% OFF</p>
                                    </div>
                                </motion.div>
                            </Link>
                        )) : (
                            <div className="w-full text-center py-4 text-[#444] text-xs">More tech brands coming soon</div>
                        )}
                    </div>
                </section>

                {/* GenZ Addicters - Premium Cards */}
                <section>
                    <div className="flex items-center justify-center mb-5 px-5">
                        <div className="flex-1 h-px bg-[#222]" />
                        <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-[#555]">GENZ ADDICTERS</span>
                        <div className="flex-1 h-px bg-[#222]" />
                    </div>

                    <div className="flex gap-4 px-5 overflow-x-auto hide-scrollbar snap-x">
                        {genZBrands.length > 0 ? genZBrands.map(brand => (
                            <Link href={`/dashboard/online-brand/${brand.id}`} key={brand.id} className="snap-start">
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className="w-[150px] flex-shrink-0 group relative"
                                >
                                    <div className="aspect-[3/4] bg-[#111] rounded-2xl overflow-hidden border border-[#222] group-hover:border-[#333] transition-all relative">
                                        {brand.logoUrl ? (
                                            <div className="w-full h-full p-6 flex items-center justify-center bg-[#151515]">
                                                <img src={brand.logoUrl} alt="" className="w-full object-contain max-h-[60px]" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#151515]">
                                                <span className="text-4xl">✨</span>
                                            </div>
                                        )}

                                        {/* Bottom Fade Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent pt-8">
                                            <h3 className="text-white font-bold text-xs truncate text-center">{brand.name}</h3>
                                            <p className="text-white/50 text-[10px] truncate text-center mt-0.5">{brand.category}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        )) : (
                            // Fallback Skeletons
                            ['H&M', 'Zara', 'Urbanic'].map((name, i) => (
                                <div key={i} className="w-[150px] flex-shrink-0 opacity-40">
                                    <div className="aspect-[3/4] bg-[#111] rounded-2xl border border-[#222] mb-2 animate-pulse flex items-center justify-center">
                                        <span className="text-[#333] font-bold text-xl">{name[0]}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Engaging Content - Feed Style */}
                <section className="px-5">
                    <div className="flex items-center justify-center mb-5">
                        <div className="flex-1 h-px bg-[#222]" />
                        <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-[#555]">ENGAGING CONTENT</span>
                        <div className="flex-1 h-px bg-[#222]" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
                        {engagingContent.length > 0 ? engagingContent.map(offer => (
                            <OfferCard
                                key={offer.id}
                                offer={{ ...offer, avgRating: (offer as any).avgRating, totalRatings: (offer as any).totalRatings }}
                                isFavorited={isFavorite(offer.merchantId)}
                                onToggleFavorite={(e) => handleToggleFavorite(e, offer.merchantId)}
                                onClick={() => router.push(`/store/${offer.merchantId}`)}
                                variant="featured"
                            />
                        )) : (
                            <div className="text-center py-10 text-[#444] text-xs">
                                Exploring the universe for more content...
                            </div>
                        )}
                    </div>
                </section>

                <div className="h-12" /> {/* Bottom spacer */}

            </main>
        </div>
    );
}
