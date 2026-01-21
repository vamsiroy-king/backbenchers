"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, Sparkles, X, ShieldCheck, Wifi, Bell, TrendingUp, Store, Loader2, ChevronDown, ChevronRight, Search, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { offerService } from "@/lib/services/offer.service";
import { trendingService } from "@/lib/services/trending.service";
import { topBrandsService } from "@/lib/services/topBrands.service";
import { cityService } from "@/lib/services/city.service";
import { heroBannerService, HeroBanner } from "@/lib/services/heroBanner.service";
import { favoritesService } from "@/lib/services/favorites.service";
import { newMerchantService, NewMerchant } from "@/lib/services/newMerchant.service";
import { notificationService, Notification } from "@/lib/services/notification.service";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { getNextPendingRatingFromDB, dismissPendingRating, deletePendingRating } from "@/lib/services/pendingRatings";
import { CitySelector } from "@/components/CitySelector";
import { RatingModal } from "@/components/RatingModal";
import { Offer } from "@/lib/types";
import { dashboardCache } from "@/lib/services/cache.service";
import { HeartButton } from "@/components/HeartButton";
import { BBInlineLoader, BBCardPlaceholder } from "@/components/BBLoader";
import { MasonryGrid } from "@/components/ui/MasonryGrid";
import { OfferCard } from "@/components/OfferCard";
import { DistrictOfferCard } from "@/components/DistrictOfferCard";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

// Hero Banner - Premium #India's 1st
const HERO_CONTENT = {
    badge: "#India's 1st",
    headline: "Student Discount Platform",
    subtext: "Exclusive deals for verified college students",
    cta: "Explore Deals"
};

// Categories - F³ Cube (Food, Fashion, Fitness) with solid colors
const CATEGORIES = [
    { id: 1, name: "Food", symbol: "F¹", tagline: "Dine for less", color: "bg-orange-500", icon: "🍕" },
    { id: 2, name: "Fashion", symbol: "F²", tagline: "Style on budget", color: "bg-rose-500", icon: "👗" },
    { id: 3, name: "Fitness", symbol: "F³", tagline: "Train smarter", color: "bg-blue-600", icon: "💪" },
];

// Top Brands
const TOP_BRANDS = [
    { id: 1, name: "Starbucks", emoji: "☕", discount: "15% OFF" },
    { id: 2, name: "McDonald's", emoji: "🍔", discount: "10% OFF" },
    { id: 3, name: "Nike", emoji: "👟", discount: "20% OFF" },
    { id: 4, name: "Apple", emoji: "🍎", discount: "EDU Price" },
    { id: 5, name: "Zara", emoji: "👕", discount: "25% OFF" },
    { id: 6, name: "Netflix", emoji: "🎬", discount: "Student" },
];

// Offers
const ONLINE_OFFERS = [
    { id: 1, brand: "Spotify", discount: "Student Plan ₹59/mo", type: "Music", isNew: true },
    { id: 2, brand: "Netflix", discount: "3 Months Free", type: "Streaming", isNew: true },
];

const OFFLINE_OFFERS = [
    { id: 1, brand: "Burger King", discount: "15% Student Discount", locations: "6+", isNew: true },
    { id: 2, brand: "Pizza Hut", discount: "20% Off Dine-In", locations: "8+", isNew: false },
];


// All searchable items
const ALL_ITEMS = [
    ...CATEGORIES.map(c => ({ type: 'category', name: c.name, emoji: c.icon, color: c.color })),
    ...TOP_BRANDS.map(b => ({ type: 'brand', name: b.name, emoji: b.emoji, discount: b.discount })),
    { type: 'offer', name: 'Spotify', emoji: '🎵', discount: 'Student Plan' },
    { type: 'offer', name: 'Netflix', emoji: '🎬', discount: '3 Months Free' },
    { type: 'location', name: 'Bengaluru', emoji: '📍', info: '45 offers' },
    { type: 'location', name: 'Mumbai', emoji: '📍', info: '32 offers' },
];

// Animated search placeholders
const SEARCH_PLACEHOLDERS = [
    "Search Food deals...",
    "Search Fashion...",
    "Search Fitness...",
    "Search Starbucks...",
    "Search Nike...",
    "Search Netflix...",
    "Search near you...",
];

export default function DashboardPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isLightTheme = theme === 'light';

    const [heroIndex, setHeroIndex] = useState(0);
    // Remember trending tab selection via localStorage
    const [trendingTab, setTrendingTab] = useState<'online' | 'offline'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('trendingTab') as 'online' | 'offline') || 'offline';
        }
        return 'offline';
    });
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showCitySelector, setShowCitySelector] = useState(false);
    // Initialize city from localStorage immediately to avoid loading flash
    const [selectedCity, setSelectedCity] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedCity') || null;
        }
        return null;
    });
    const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(0); // For Floating Card Stack
    const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    // Real offers from database
    const [realOffers, setRealOffers] = useState<Offer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    // Trending offers from admin
    const [trendingOnline, setTrendingOnline] = useState<Offer[]>([]);
    const [trendingOffline, setTrendingOffline] = useState<Offer[]>([]);

    // Top brands from admin
    const [topBrandsData, setTopBrandsData] = useState<{ id: string; name: string; logo: string | null; category: string; discount?: string }[]>([]);

    // New merchants for "New on BackBenchers" section
    const [newMerchants, setNewMerchants] = useState<NewMerchant[]>([]);

    // Content visibility settings (from admin)
    const [contentSettings, setContentSettings] = useState({
        showTopBrands: true,
        showHeroBanners: true,
        showTrending: true,
    });

    // Check if student is verified (logged in with profile)
    const [isVerified, setIsVerified] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    // Favorite offers
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    // Real-time notifications with Supabase realtime subscription
    const { unreadCount, markAllAsRead } = useNotifications();

    // Load content visibility settings from DATABASE with REALTIME subscription
    useEffect(() => {
        let channel: any = null;

        async function loadContentSettings() {
            try {
                const { settingsService } = await import('@/lib/services/settings.service');
                const settings = await settingsService.getContentSettings();
                setContentSettings(settings);
            } catch (error) {
                console.error('Error loading content settings:', error);
            }
        }

        // Initial load
        loadContentSettings();

        // Subscribe to realtime changes for instant admin toggle updates
        async function subscribeToRealtime() {
            const { supabase } = await import('@/lib/supabase');
            channel = supabase
                .channel('site_settings_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'site_settings',
                        filter: 'key=eq.content_visibility'
                    },
                    (payload: any) => {
                        console.log('Content settings changed via realtime:', payload);
                        if (payload.new?.value) {
                            setContentSettings(payload.new.value);
                        }
                    }
                )
                .subscribe();
        }

        subscribeToRealtime();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, []);

    // Animate search placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setSearchPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll hero banners every 4 seconds
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('left'); // Track swipe direction for animation
    const bannerCount = heroBanners.length > 0 ? heroBanners.length : 3;

    useEffect(() => {
        const interval = setInterval(() => {
            setSwipeDirection('left'); // Auto-scroll always goes "left" (next)
            setCurrentBannerIndex((prev) => (prev + 1) % bannerCount);
        }, 4000);
        return () => clearInterval(interval);
    }, [bannerCount]);

    // Check for pending ratings - REMOVED (Relocated to GlobalRatingProvider)
    const checkPendingRatings = async (sId: string) => {
        // Legacy: Logic moved to GlobalRatingProvider
    };

    // Fetch real offers and check verification status
    useEffect(() => {
        async function fetchData() {
            try {
                // STEP 1: Determine the city (localStorage first, then profile)
                let cityToUse = cityService.getSelectedCity();

                // CHECK CACHE FIRST - instant load if cached
                const cachedOffers = dashboardCache.getOffers(cityToUse || undefined);
                const cachedTrendingOffline = dashboardCache.getTrendingOffline(cityToUse || undefined);
                const cachedTrendingOnline = dashboardCache.getTrendingOnline();
                const cachedTopBrands = dashboardCache.getTopBrands();
                const cachedNewMerchants = dashboardCache.getNewMerchants(cityToUse || undefined);
                const cachedBanners = dashboardCache.getHeroBanners(cityToUse || undefined);
                const cachedFavorites = dashboardCache.getFavoriteIds();

                // If we have cached data, use it immediately (instant render)
                if (cachedOffers) setRealOffers(cachedOffers);
                if (cachedTrendingOffline) setTrendingOffline(cachedTrendingOffline);
                if (cachedTrendingOnline) setTrendingOnline(cachedTrendingOnline);
                if (cachedTopBrands) setTopBrandsData(cachedTopBrands.map((b: any) => ({
                    id: b.merchantId || b.id,
                    name: b.merchant?.businessName || b.name || 'Unknown',
                    logo: b.merchant?.logo || b.logo || null,
                    category: b.merchant?.category || b.category || 'Store',
                })));
                if (cachedNewMerchants) setNewMerchants(cachedNewMerchants);
                if (cachedBanners && cachedBanners.length > 0) setHeroBanners(cachedBanners);
                if (cachedFavorites) setFavoriteIds(cachedFavorites);

                // If all cache exists, stop loading immediately
                if (cachedOffers && cachedTrendingOffline && cachedTopBrands) {
                    setLoadingOffers(false);
                }

                // STEP 2: Check if student is verified and get city from profile
                const { studentService } = await import('@/lib/services/student.service');
                const profileResult = await studentService.getMyProfile();
                if (profileResult.success && profileResult.data) {
                    setIsVerified(true);
                    setStudentId(profileResult.data.id);

                    // If no city in localStorage, use student's city from profile
                    if (!cityToUse) {
                        const userCity = profileResult.data.selectedCity || profileResult.data.city;
                        if (userCity) {
                            cityToUse = userCity;
                            cityService.setSelectedCity(userCity); // Save to localStorage
                        }
                    }

                    // Fetch favorite IDs (saved offers) if not cached
                    if (!cachedFavorites) {
                        const savedOfferIds = await favoritesService.getSavedOfferIds();
                        setFavoriteIds(savedOfferIds);
                        dashboardCache.setFavoriteIds(savedOfferIds);
                    }
                }

                // Set the city in state
                if (cityToUse) {
                    setSelectedCity(cityToUse);
                }

                // STEP 3: Fetch data with proper city filtering
                // Fetch hero banners from database (if not cached)
                if (!cachedBanners || cachedBanners.length === 0) {
                    const bannerResult = await heroBannerService.getActiveForCity(cityToUse || 'All');
                    if (bannerResult.success && bannerResult.data && bannerResult.data.length > 0) {
                        setHeroBanners(bannerResult.data);
                        dashboardCache.setHeroBanners(bannerResult.data, cityToUse || undefined);
                    }
                }

                // Fetch offers filtered by city (if not cached)
                if (!cachedOffers) {
                    const result = cityToUse
                        ? await offerService.getOffersByCity(cityToUse)
                        : await offerService.getActiveOffers();
                    if (result.success && result.data) {
                        setRealOffers(result.data);
                        dashboardCache.setOffers(result.data, cityToUse || undefined);
                    }
                }

                // Fetch trending offers (if not cached)
                if (!cachedTrendingOffline || !cachedTrendingOnline) {
                    // 1. Get User for location-based filtering
                    let userLocation = { city: undefined as string | undefined, state: undefined as string | undefined };
                    try {
                        const { authService } = await import('@/lib/services/auth.service'); // Import authService here
                        const user = await authService.getCurrentUser();
                        if (user) {
                            const u = user as any;
                            userLocation = {
                                city: u.city || u.selectedCity || undefined,
                                state: u.state || undefined
                            };
                        }
                    } catch (e) {
                        console.log("Could not load user for location", e);
                    }

                    const [
                        offlineTrending,
                        onlineTrending
                    ] = await Promise.all([
                        trendingService.getMergedTrending('offline', 10, cityToUse || undefined),
                        trendingService.getMergedTrending('online', 10, cityToUse || userLocation.city, userLocation.state), // Pass selected city
                    ]);
                    if (!cachedTrendingOffline) {
                        setTrendingOffline(offlineTrending as any);
                        dashboardCache.setTrendingOffline(offlineTrending, cityToUse || undefined);
                    }
                    if (!cachedTrendingOnline) {
                        setTrendingOnline(onlineTrending as any);
                        dashboardCache.setTrendingOnline(onlineTrending);
                    }
                }

                // Fetch top brands from admin dashboard (if not cached)
                if (!cachedTopBrands) {
                    const brandsResult = await topBrandsService.getAll();
                    if (brandsResult.success && brandsResult.data) {
                        dashboardCache.setTopBrands(brandsResult.data);
                        setTopBrandsData(brandsResult.data.map(b => ({
                            id: b.merchantId,
                            name: b.merchant?.businessName || 'Unknown',
                            logo: b.merchant?.logo || null,
                            category: b.merchant?.category || 'Store',
                        })));
                    }
                }

                // Fetch new merchants for "New on BackBenchers" (if not cached)
                if (!cachedNewMerchants) {
                    const newMerchantsResult = await newMerchantService.getNewMerchants(7, 10, cityToUse || undefined);
                    if (newMerchantsResult.success && newMerchantsResult.data) {
                        setNewMerchants(newMerchantsResult.data);
                        dashboardCache.setNewMerchants(newMerchantsResult.data, cityToUse || undefined);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingOffers(false);
            }
        }
        fetchData();
    }, []);

    // Re-fetch new merchants when city changes
    useEffect(() => {
        async function refetchNewMerchants() {
            if (selectedCity) {
                const result = await newMerchantService.getNewMerchants(7, 10, selectedCity);
                if (result.success && result.data) {
                    setNewMerchants(result.data);
                }
            }
        }
        refetchNewMerchants();
    }, [selectedCity]);


    const handleOfferClick = (e: React.MouseEvent) => {
        if (!isVerified) {
            e.preventDefault();
            setShowVerifyModal(true);
        }
    };

    // Toggle favorite with optimistic update
    const toggleFavorite = async (offerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isVerified) {
            setShowVerifyModal(true);
            return;
        }

        const isFav = favoriteIds.includes(offerId);
        // Optimistic update (both state and cache)
        if (isFav) {
            setFavoriteIds(prev => prev.filter(id => id !== offerId));
            dashboardCache.updateFavoriteIds(offerId, false);
        } else {
            setFavoriteIds(prev => [...prev, offerId]);
            dashboardCache.updateFavoriteIds(offerId, true);
        }

        // Actual API call
        const result = await favoritesService.toggleOffer(offerId);
        if (!result.success) {
            // Revert on failure (both state and cache)
            if (isFav) {
                setFavoriteIds(prev => [...prev, offerId]);
                dashboardCache.updateFavoriteIds(offerId, true);
            } else {
                setFavoriteIds(prev => prev.filter(id => id !== offerId));
                dashboardCache.updateFavoriteIds(offerId, false);
            }
        }
    };

    // Get expiry text
    const getExpiryText = (validUntil?: string) => {
        if (!validUntil) return null;
        const expiry = new Date(validUntil);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days === 0) return `${hours}h left`;
        if (days <= 3) return `${days}d left`;
        return null;
    };

    // Filter offers based on tab - apply city filter to offline offers
    const cityFilteredTrendingOffline = selectedCity
        ? trendingOffline.filter(o => o.merchantCity?.toLowerCase() === selectedCity.toLowerCase())
        : trendingOffline;

    const cityFilteredRealOffers = selectedCity
        ? realOffers.filter(o => o.merchantCity?.toLowerCase() === selectedCity.toLowerCase())
        : realOffers;

    // Group by merchant - show each merchant once with their best discount
    const groupByMerchant = (offersList: Offer[]) => {
        const merchantMap = new Map<string, Offer>();
        offersList.forEach(offer => {
            const merchantId = offer.merchantId || '';
            const existing = merchantMap.get(merchantId);
            if (!existing || (offer.discountValue || 0) > (existing.discountValue || 0)) {
                merchantMap.set(merchantId, offer);
            }
        });
        return Array.from(merchantMap.values());
    };

    const currentOffers = trendingTab === 'online'
        ? groupByMerchant(trendingOnline.length > 0 ? trendingOnline : ONLINE_OFFERS as any)
        : groupByMerchant(cityFilteredTrendingOffline.length > 0
            ? cityFilteredTrendingOffline
            : (cityFilteredRealOffers.length > 0 ? cityFilteredRealOffers : OFFLINE_OFFERS as any));

    // Enhanced search: merge local items with real offers from database
    const filteredItems = searchQuery.length > 0
        ? [
            // Local categories/brands
            ...ALL_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
            // Real offers from database
            ...realOffers
                .filter(offer =>
                    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    offer.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    offer.merchantCategory?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 10) // Limit to 10 offer results
                .map(offer => ({
                    type: 'offer' as const,
                    name: offer.title,
                    emoji: offer.merchantCategory === 'Food' ? '🍕' : offer.merchantCategory === 'Fashion' ? '👗' : offer.merchantCategory === 'Fitness' ? '💪' : '🏷️',
                    discount: `${offer.discountValue}${offer.type === 'percentage' ? '%' : '₹'} OFF`,
                    id: offer.id,
                    merchantName: offer.merchantName
                }))
        ]
        : [];

    return (
        <div className={`min-h-screen pb-32 ${isLightTheme ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Get Verified Modal */}
            <AnimatePresence>
                {showVerifyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowVerifyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#121212] rounded-3xl p-8 w-full max-w-sm shadow-2xl relative border border-white/[0.08]"
                        >
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                            >
                                <X className="h-4 w-4 text-white/60" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Get Verified</h2>
                                <p className="text-white/50 text-sm">
                                    Verify your student status to unlock this offer.
                                </p>
                            </div>

                            <Link href="/verify" className="block">
                                <Button className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all">
                                    Verify Now - Free
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



            {/* Search Panel */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black"
                    >
                        <div className="p-4 pt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="h-10 w-10 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                                    <X className="h-5 w-5 text-white/60" />
                                </button>
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search brands, categories..."
                                        className="w-full h-12 bg-white/[0.05] rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-green-500/30 text-white placeholder:text-white/40 border border-white/[0.06]"
                                    />
                                </div>
                            </div>

                            {searchQuery.length === 0 ? (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Recent Searches</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Nike', 'Starbucks', 'Netflix'].map((term) => (
                                                <button key={term} onClick={() => setSearchQuery(term)} className="px-4 py-2 bg-white/[0.05] rounded-full text-sm font-medium text-white hover:bg-white/[0.1] transition-colors">
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Trending</h4>
                                        <div className="space-y-2">
                                            {['Spotify Student', 'Apple Education', 'Uber'].map((term, i) => (
                                                <button key={term} onClick={() => setSearchQuery(term)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.05] transition-colors">
                                                    <span className="text-lg">🔥</span>
                                                    <span className="font-medium text-sm text-white">{term}</span>
                                                    <span className="text-xs text-white/40 ml-auto">#{i + 1}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredItems.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <p className="text-4xl mb-2">🔍</p>
                                            <p className="text-sm">No results for "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        filteredItems.map((item, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
                                            >
                                                <span className="text-2xl">{item.emoji}</span>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm text-white">{item.name}</p>
                                                    <p className="text-xs text-white/50 capitalize">{item.type}</p>
                                                </div>
                                                {'discount' in item && (
                                                    <span className="ml-auto text-xs font-semibold text-green-400">{item.discount}</span>
                                                )}
                                            </motion.button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* City Selector Modal */}
            <CitySelector
                isOpen={showCitySelector}
                onClose={() => setShowCitySelector(false)}
                currentCity={selectedCity}
                onSelectCity={async (city) => {
                    setSelectedCity(city);
                    setShowCitySelector(false);
                    // Save to localStorage
                    cityService.setSelectedCity(city);
                    // Save to Supabase if student is logged in
                    if (studentId) {
                        await cityService.updateStudentCity(studentId, city);
                    }
                    // Refetch offers for new city
                    const result = await offerService.getOffersByCity(city);
                    if (result.success && result.data) {
                        setRealOffers(result.data);
                    }
                }}
            />

            {/* Header - Minimal Premium */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLightTheme ? 'bg-white/90' : 'bg-black/90'}`}>
                <div className="px-5 h-14 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className={`font-bold text-lg italic tracking-tight ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>BACKBENCHERS</span>
                        <span className="text-[10px] font-semibold text-green-500 tracking-wide">BORN TO SAVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* City Selector */}
                        <button
                            onClick={() => setShowCitySelector(true)}
                            className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all border ${isLightTheme ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'bg-white/[0.04] text-white/70 border-white/[0.06] hover:bg-white/[0.06]'}`}
                        >
                            <MapPin className={`h-3.5 w-3.5 ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`} />
                            <span className="max-w-20 truncate">{selectedCity || 'City'}</span>
                        </button>
                        {/* Notifications */}
                        <button
                            onClick={() => router.push('/dashboard/notifications')}
                            className={`h-8 w-8 rounded-full flex items-center justify-center relative transition-all border ${isLightTheme ? 'bg-gray-100 border-gray-200 hover:bg-gray-200' : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]'}`}
                        >
                            <Bell className={`h-4 w-4 ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="space-y-2 px-5 pt-4 pb-4">
                {/* Minimal Search Bar */}
                <motion.button
                    onClick={() => setShowSearch(true)}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-colors border ${isLightTheme ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05]'}`}
                >
                    <Search className={`h-4 w-4 flex-shrink-0 ${isLightTheme ? 'text-gray-400' : 'text-white/30'}`} />
                    <div className="flex-1 text-left flex items-center gap-1.5 overflow-hidden">
                        <span className={`text-sm ${isLightTheme ? 'text-gray-500' : 'text-white/30'}`}>Search</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={searchPlaceholderIndex}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className={`text-sm ${isLightTheme ? 'text-gray-400' : 'text-white/20'}`}
                            >
                                {SEARCH_PLACEHOLDERS[searchPlaceholderIndex].replace('Search ', '')}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </motion.button>

                {/* Hero Banner - Touch/Swipe Carousel */}
                {contentSettings.showHeroBanners && (
                    <div
                        className="relative -mx-5 overflow-hidden touch-pan-y"
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            (e.currentTarget as any).startX = touch.clientX;
                        }}
                        onTouchEnd={(e) => {
                            const target = e.currentTarget as any;
                            if (!target.startX) return;
                            const touch = e.changedTouches[0];
                            const diff = target.startX - touch.clientX;
                            const count = heroBanners.length > 0 ? heroBanners.length : 3;
                            if (diff > 50) {
                                // Swipe left on screen = go to next banner
                                setSwipeDirection('left');
                                setCurrentBannerIndex((prev) => (prev + 1) % count);
                            } else if (diff < -50) {
                                // Swipe right on screen = go to previous banner
                                setSwipeDirection('right');
                                setCurrentBannerIndex((prev) => (prev - 1 + count) % count);
                            }
                            target.startX = null;
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {(heroBanners.length > 0 ? heroBanners : [
                                { id: '1', title: 'END OF SEASON', highlight: 'SALE', subtitle: 'Up to 60% Off + Rewards up to ₹10,000', ctaText: 'Go out and shop', bgColor: 'from-slate-800 via-slate-900 to-black' },
                                { id: '2', title: 'FLASH', highlight: 'DEALS', subtitle: 'Limited time offers nearby', ctaText: 'View All', bgColor: 'from-orange-900 via-orange-950 to-black' },
                                { id: '3', title: 'NEW', highlight: 'DROPS', subtitle: 'Fresh deals every week', ctaText: 'Check Out', bgColor: 'from-emerald-900 via-emerald-950 to-black' },
                            ]).map((banner: any, index: number) =>
                                index === currentBannerIndex && (
                                    <motion.div
                                        key={banner.id}
                                        initial={{ opacity: 0, x: swipeDirection === 'left' ? 100 : -100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: swipeDirection === 'left' ? -100 : 100 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                        className={`mx-5 min-h-[220px] rounded-t-2xl rounded-b-none bg-gradient-to-br ${banner.bgColor || 'from-slate-800 to-black'} p-6 flex flex-col justify-center items-center text-center relative overflow-hidden cursor-grab active:cursor-grabbing`}
                                    >
                                        {/* Decorative Elements */}
                                        <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <p className="text-white/60 text-xs tracking-[0.2em] mb-1">{banner.title}</p>
                                            <h2 className="text-white text-4xl font-black tracking-tight mb-2">{banner.highlight}</h2>
                                            {banner.subtitle && (
                                                <p className="text-white/70 text-sm mb-4">{banner.subtitle}</p>
                                            )}
                                            <button
                                                onClick={handleOfferClick}
                                                className="bg-white text-black font-semibold px-5 py-2.5 rounded-full text-xs shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                {banner.ctaText} →
                                            </button>
                                        </div>

                                        {/* Bottom Fade - Seamless connection to categories */}
                                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-green-900/20 via-transparent to-transparent opacity-40 mix-blend-screen pointer-events-none" />
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Categories - Connected to Hero Fade */}
                <section className="pb-4 -mt-4 relative z-10">
                    <div className="flex items-center justify-center mb-5">
                        <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                        <span className={`px-4 text-[10px] tracking-[0.2em] font-medium ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>SHOP BY CATEGORY</span>
                        <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { line1: "Food", line2: "& Beverages", image: "🍕", color: isLightTheme ? "from-orange-100 to-orange-200" : "from-orange-900/50 to-orange-950/80", category: "Food" },
                            { line1: "Fashion", line2: "& Apparel", image: "👗", color: isLightTheme ? "from-pink-100 to-pink-200" : "from-pink-900/50 to-pink-950/80", category: "Fashion" },
                            { line1: "Health", line2: "& Fitness", image: "💪", color: isLightTheme ? "from-blue-100 to-blue-200" : "from-blue-900/50 to-blue-950/80", category: "Fitness" },
                            { line1: "Skincare", line2: "& Beauty", image: "💄", color: isLightTheme ? "from-purple-100 to-purple-200" : "from-purple-900/50 to-purple-950/80", category: "Beauty" },
                        ].map((cat) => (
                            <motion.div
                                key={cat.category}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    vibrate('light');
                                    router.push(`/dashboard/explore?category=${cat.category}`);
                                }}
                                className={`aspect-square rounded-xl bg-gradient-to-br ${cat.color} border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${isLightTheme ? 'border-gray-200 hover:border-gray-300' : 'border-white/[0.06] hover:border-white/[0.12]'}`}
                            >
                                <span className="text-2xl mb-1">{cat.image}</span>
                                <span className={`text-[10px] font-semibold leading-tight ${isLightTheme ? 'text-gray-700' : 'text-white/90'}`}>{cat.line1}</span>
                                <span className={`text-[8px] font-medium leading-tight ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>{cat.line2}</span>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* New Stores - Real App Style */}
                {newMerchants.length > 0 && (
                    <section className="py-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-green-400" />
                                </div>
                                <h2 className="text-base font-semibold text-white">New Stores</h2>
                            </div>
                            <span className="text-[11px] text-[#666]">Recently joined</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4">
                            {newMerchants.map((merchant) => (
                                <div key={merchant.id} className="w-[180px] flex-shrink-0">
                                    <OfferCard
                                        offer={{
                                            id: merchant.id,
                                            merchantId: merchant.id,
                                            merchantName: merchant.businessName,
                                            merchantLogo: merchant.logoUrl,
                                            title: merchant.category || "New Store",
                                            description: merchant.hasOffers ? "New Arrival" : "Coming Soon",
                                            type: merchant.discountType || "percentage",
                                            discountValue: merchant.bestDiscount || 0,
                                            status: "active",
                                            totalRedemptions: 0,
                                            createdAt: merchant.createdAt,
                                            // Rating data
                                            avgRating: merchant.avgRating,
                                            totalRatings: merchant.totalRatings
                                        } as any}
                                        onClick={() => {
                                            if (!isVerified) {
                                                setShowVerifyModal(true);
                                            } else {
                                                router.push(`/store/${merchant.id}`);
                                            }
                                        }}
                                        priority={false}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Brands - Minimal Grid - MOVED TO MIDDLE */}
                {
                    contentSettings.showTopBrands && (
                        <section className="py-6">
                            {/* Section Header - Shop by Category Style */}
                            <div className="flex items-center justify-center mb-5">
                                <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                                <span className={`px-4 text-[10px] tracking-[0.2em] font-medium ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>TOP BRANDS</span>
                                <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {(topBrandsData.length > 0 ? topBrandsData : TOP_BRANDS.map(b => ({ id: String(b.id), name: b.name, logo: null, category: b.emoji, discount: b.discount }))).map((brand) => (
                                    <motion.button
                                        key={brand.id}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={(e) => {
                                            if (!isVerified) {
                                                e.preventDefault();
                                                setShowVerifyModal(true);
                                            } else {
                                                router.push(`/store/${brand.id}`);
                                            }
                                        }}
                                        className={`rounded-xl p-3 flex flex-col items-center gap-2 border transition-all ${isLightTheme ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'}`}
                                    >
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden ${isLightTheme ? 'bg-gray-100' : 'bg-white/[0.04]'}`}>
                                            {brand.logo ? (
                                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className={`h-4 w-4 ${isLightTheme ? 'text-gray-400' : 'text-white/30'}`} />
                                            )}
                                        </div>
                                        <span className={`text-xs font-medium text-center line-clamp-1 ${isLightTheme ? 'text-gray-700' : 'text-white/80'}`}>{brand.name}</span>
                                        <span className="text-[10px] text-green-500">{brand.discount || brand.category}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </section>
                    )
                }

                {/* Trending Offers - Real App Style */}
                {
                    contentSettings.showTrending && (
                        <section id="trending-section" className="py-6">
                            {/* Section Header - Shop by Category Style with Tabs */}
                            <div className="flex items-center justify-center mb-4">
                                <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                                <div className="px-4 flex items-center gap-3">
                                    <span className={`text-[10px] tracking-[0.2em] font-medium ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>TRENDING</span>
                                    {/* Tab Switcher */}
                                    <div className={`flex gap-1 p-0.5 rounded-full ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.06]'}`}>
                                        <button
                                            onClick={() => { setTrendingTab('offline'); localStorage.setItem('trendingTab', 'offline'); vibrate('light'); }}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all duration-200",
                                                trendingTab === 'offline'
                                                    ? (isLightTheme ? 'bg-white text-gray-900 shadow-sm' : 'bg-white text-black')
                                                    : (isLightTheme ? 'text-gray-500 hover:text-gray-700' : 'text-white/40 hover:text-white/60')
                                            )}
                                        >
                                            OFFLINE
                                        </button>
                                        <button
                                            onClick={() => { setTrendingTab('online'); localStorage.setItem('trendingTab', 'online'); vibrate('light'); }}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all duration-200",
                                                trendingTab === 'online'
                                                    ? (isLightTheme ? 'bg-white text-gray-900 shadow-sm' : 'bg-white text-black')
                                                    : (isLightTheme ? 'text-gray-500 hover:text-gray-700' : 'text-white/40 hover:text-white/60')
                                            )}
                                        >
                                            ONLINE
                                        </button>
                                    </div>
                                </div>
                                <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                            </div>

                            {/* Offers Grid - District-Quality Masonry Layout */}
                            <MasonryGrid
                                items={currentOffers.slice(0, 10)}
                                columns={{ default: 2 }}
                                gap={12}
                                renderItem={(offer, index) => (
                                    <DistrictOfferCard
                                        offer={offer}
                                        priority={index < 4}
                                        onClick={() => {
                                            if (!isVerified) {
                                                setShowVerifyModal(true);
                                            } else if (offer.id) {
                                                // Redirect to new Online Brand page if it's a new system offer
                                                if ((offer as any).isNewSystem) {
                                                    router.push(`/dashboard/online-brand/${offer.merchantId}`);
                                                } else {
                                                    router.push(`/offer/${offer.id}`);
                                                }
                                            }
                                        }}
                                    />
                                )}
                            />

                            {/* View All Button - District Style */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => router.push('/dashboard/explore')}
                                className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 font-medium text-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all mt-4 active:scale-95"
                            >
                                View All Offers →
                            </motion.button>
                        </section>
                    )
                }
            </main >


        </div >
    );
}
