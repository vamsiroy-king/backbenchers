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
import { TrendingSection } from "@/components/dashboard/TrendingSection";
import { HeroCarousel } from "@/components/dashboard/HeroCarousel";
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

    // Initialize Real Offers from Cache (Synchronous to prevent flash)
    const [realOffers, setRealOffers] = useState<Offer[]>(() => {
        if (typeof window !== 'undefined') {
            const city = localStorage.getItem('selectedCity');
            const cached = dashboardCache.getOffers(city || undefined);
            if (cached) return cached;
        }
        return [];
    });

    // Initialize Loading State based on Cache existence
    const [loadingOffers, setLoadingOffers] = useState(() => {
        if (typeof window !== 'undefined') {
            const city = localStorage.getItem('selectedCity');
            return !dashboardCache.hasCachedData(city || undefined);
        }
        return true;
    });

    // Trending offers from admin - Initialize from cache
    const [trendingOnline, setTrendingOnline] = useState<Offer[]>(() =>
        (typeof window !== 'undefined' ? dashboardCache.getTrendingOnline() : null) || []
    );
    const [trendingOffline, setTrendingOffline] = useState<Offer[]>(() => {
        if (typeof window !== 'undefined') {
            const city = localStorage.getItem('selectedCity');
            return dashboardCache.getTrendingOffline(city || undefined) || [];
        }
        return [];
    });

    // Top brands from admin - Initialize from cache
    const [topBrandsData, setTopBrandsData] = useState<{ id: string; name: string; logo: string | null; category: string; discount?: string }[]>(() => {
        if (typeof window !== 'undefined') {
            const cached = dashboardCache.getTopBrands();
            if (cached) {
                return cached.map((b: any) => ({
                    id: b.merchantId || b.id,
                    name: b.merchant?.businessName || b.name || 'Unknown',
                    logo: b.merchant?.logo || b.logo || null,
                    category: b.merchant?.category || b.category || 'Store',
                }));
            }
        }
        return [];
    });

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

                // If all cache exists, we can still load, but let's not block UI
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

                // Fetch offers filtered by city (always fetch in background to update cache)
                // if (!cachedOffers) {  <-- REMOVED check to enable stale-while-revalidate
                const result = cityToUse
                    ? await offerService.getOffersByCity(cityToUse)
                    : await offerService.getActiveOffers();

                // Only update if we get valid data back. 
                // This prevents "disappearing" if the API returns empty temporarily or on error.
                if (result.success && result.data && result.data.length > 0) {
                    setRealOffers(result.data);
                    dashboardCache.setOffers(result.data, cityToUse || undefined);
                }
                // }

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

            <main className="space-y-4 px-5 pt-4 pb-4">
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

                {/* Hero Banner - NEW COMPONENT */}
                {contentSettings.showHeroBanners && (
                    <div className="-mx-5 md:mx-0 md:rounded-2xl overflow-hidden mb-6">
                        <HeroCarousel banners={heroBanners} />
                    </div>
                )}

                {/* Categories - Connected to Hero Fade */}
                <section className="pb-4 relative z-10">
                    <div className="flex items-center justify-center mb-5">
                        <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                        <span className={`px-4 text-[10px] tracking-[0.2em] font-medium ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>SHOP BY CATEGORY</span>
                        <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4">
                        {[
                            { line1: "Food", line2: "& Beverages", image: "🍕", color: isLightTheme ? "from-orange-100 to-orange-200" : "from-orange-900/50 to-orange-950/80", category: "Food" },
                            { line1: "Fashion", line2: "& Apparel", image: "👗", color: isLightTheme ? "from-pink-100 to-pink-200" : "from-pink-900/50 to-pink-950/80", category: "Fashion" },
                            { line1: "Health", line2: "& Fitness", image: "💪", color: isLightTheme ? "from-blue-100 to-blue-200" : "from-blue-900/50 to-blue-950/80", category: "Fitness" },
                            { line1: "Skincare", line2: "& Beauty", image: "💄", color: isLightTheme ? "from-purple-100 to-purple-200" : "from-purple-900/50 to-purple-950/80", category: "Beauty" },
                            // Duplicate for desktop fill (optional, or just keeps 4) - Let's keep 4 on desktop too but wide? No, looks weird. 
                            // Actually, let's keep it centered or spread.
                            // For now, let's just make them bigger on desktop or keep 4 cols but centered?
                            // User asked for responsive layouts. grid-cols-4 on 7xl is huge cards.
                            // Let's stick to grid-cols-4 md:grid-cols-4 lg:grid-cols-8 if we had more. 
                            // Since we only have 4 items, let's keep grid-cols-4 but constrain width?
                            // Or better, let's just let them match the design.
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
                        {/* Section Header - Shop by Category Style */}
                        <div className="flex items-center justify-center mb-5">
                            <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                            <span className={`px-4 text-[10px] tracking-[0.2em] font-medium ${isLightTheme ? 'text-gray-500' : 'text-white/40'}`}>NEW STORES</span>
                            <div className={`flex-1 h-px ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.08]'}`} />
                        </div>
                        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                        <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4 gap-4 md:grid md:grid-cols-4 lg:grid-cols-5 md:mx-0 md:px-0 md:overflow-visible">
                            {newMerchants.map((merchant) => (
                                <div key={merchant.id} className="w-[180px] md:w-auto flex-shrink-0 relative group">
                                    {/* New Badge Ribbon */}
                                    <div className="absolute top-2 right-2 z-10 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-1">
                                        <Sparkles className="h-2.5 w-2.5 fill-black" />
                                        NEW
                                    </div>
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

                            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4">
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

                {/* Trending Offers - Redesigned Component (Removed as per user request) */}
                {/* {
                    contentSettings.showTrending && (
                        <TrendingSection
                            onlineOffers={trendingOnline}
                            offlineOffers={trendingOffline}
                            isVerified={isVerified}
                            onVerifyClick={() => setShowVerifyModal(true)}
                            city={selectedCity}
                        />
                    )
                } */}
            </main >


        </div >
    );
}
