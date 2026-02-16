"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, Sparkles, X, ShieldCheck, Wifi, Bell, TrendingUp, Store, Loader2, ChevronDown, ChevronRight, Search, Clock, Globe, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AutoScrollingRow } from "@/components/ui/AutoScrollingRow";
import { ScrollVelocityMarquee } from "@/components/ui/ScrollVelocityMarquee";
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
import Image from "next/image";
import { Offer } from "@/lib/types";
import { dashboardCache } from "@/lib/services/cache.service";
import { categoryService, Category } from "@/lib/services/category.service";
import { HeartButton } from "@/components/HeartButton";
import { BBInlineLoader, BBCardPlaceholder } from "@/components/BBLoader";
import { MasonryGrid } from "@/components/ui/MasonryGrid";
import { OfferCard } from "@/components/OfferCard";
import { DistrictOfferCard } from "@/components/DistrictOfferCard";
import { TrendingSection } from "@/components/dashboard/TrendingSection";
import { HeroCarousel } from "@/components/dashboard/HeroCarousel";
import { DiscountTicker } from "@/components/dashboard/DiscountTicker";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { SearchOverlay } from "@/components/SearchOverlay";
import { useStudentStore, isCacheValid } from "@/lib/store/useStudentStore";

// Hero Banner - Premium #India's 1st
const HERO_CONTENT = {
    badge: "#India's 1st",
    headline: "Student Discount Platform",
    subtext: "Exclusive deals for verified college students",
    cta: "Explore Deals"
};

// Category gradient color mapping (Tailwind dynamic classes don't work - use inline styles)
const getCategoryGradient = (from: string, to: string, isLight: boolean = false): React.CSSProperties => {
    const colorMap: Record<string, string> = {
        'orange-100': '#ffedd5', 'orange-200': '#fed7aa', 'orange-300': '#fdba74',
        'pink-100': '#fce7f3', 'pink-200': '#fbcfe8', 'pink-300': '#f9a8d4',
        'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
        'purple-100': '#f3e8ff', 'purple-200': '#e9d5ff', 'purple-300': '#d8b4fe',
        'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-300': '#86efac',
        'indigo-100': '#e0e7ff', 'indigo-200': '#c7d2fe', 'indigo-300': '#a5b4fc',
        'yellow-100': '#fef9c3', 'yellow-200': '#fef08a', 'yellow-300': '#fde047',
        'cyan-100': '#cffafe', 'cyan-200': '#a5f3fc', 'cyan-300': '#67e8f9',
        'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5',
    };
    const fromColor = colorMap[from] || '#1a1a1a';
    const toColor = colorMap[to] || '#111111';

    if (isLight) {
        return { background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})` };
    }
    // Dark mode: use colors with reduced opacity overlay effect
    return { background: `linear-gradient(to bottom right, ${fromColor}40, ${toColor}20)` };
};

// Categories - Limited to 4 essential categories in 2x2 grid
const DEFAULT_CATEGORIES = [
    { id: '1', name: "Food & Dining", tagline: "Dine for less", gradient_from: "orange-100", gradient_to: "orange-200", icon: "🍕", image_url: "/assets/categories/food_ultra.png", display_order: 1 },
    { id: '2', name: "Fashion & Apparel", tagline: "Style on budget", gradient_from: "pink-100", gradient_to: "pink-200", icon: "👗", image_url: "/assets/categories/fashion_ultra.png", display_order: 2 },
    { id: '3', name: "Groceries & Essentials", tagline: "Save on daily needs", gradient_from: "green-100", gradient_to: "green-200", icon: "🛒", image_url: "/assets/categories/groceries_ultra.png", display_order: 3 },
    { id: '4', name: "Fitness & Wellness", tagline: "Train smarter", gradient_from: "blue-100", gradient_to: "blue-200", icon: "💪", image_url: "/assets/categories/fitness_ultra.png", display_order: 4 },
];

// Top Brands (Static Fallback - Demo Data)
const STATIC_TOP_BRANDS = {
    online: [
        { id: 'o1', name: "Amazon", logo: "/brands/amazon.png", category: "Online" },
        { id: 'o2', name: "Flipkart", logo: "/brands/flipkart.png", category: "Online" },
        { id: 'o3', name: "Zomato", logo: "/brands/zomato.png", category: "Online" },
        { id: 'o4', name: "Swiggy", logo: "/brands/swiggy.png", category: "Online" },
        { id: 'o5', name: "Netflix", logo: "/brands/netflix.png", category: "Online" },
        { id: 'o6', name: "Spotify", logo: "/brands/spotify.png", category: "Online" },
    ],
    offline: [
        { id: 's1', name: "Starbucks", logo: "/brands/starbucks.png", category: "Food" },
        { id: 's2', name: "McDonald's", logo: "/brands/mcdonalds.png", category: "Food" },
        { id: 's3', name: "Nike", logo: "/brands/nike.png", category: "Fashion" },
        { id: 's4', name: "Adidas", logo: "/brands/adidas.png", category: "Fashion" },
        { id: 's5', name: "Domino's", logo: "/brands/dominos.png", category: "Food" },
        { id: 's6', name: "KFC", logo: "/brands/kfc.png", category: "Food" },
    ]
};

// Demo Trending Offers (Fallback when database is empty)
const DEMO_TRENDING_OFFERS = {
    online: [
        { id: 'demo-o1', title: 'Flat 50% Off', discountValue: 50, type: 'percentage' as const, merchantId: 'zomato', merchantName: 'Zomato', merchantLogo: '/brands/zomato.png', code: 'BB50' },
        { id: 'demo-o2', title: 'Student Plan ₹59/mo', discountValue: 59, type: 'flat' as const, merchantId: 'spotify', merchantName: 'Spotify', merchantLogo: '/brands/spotify.png', code: 'STUDENT' },
        { id: 'demo-o3', title: '3 Months Free', discountValue: 100, type: 'percentage' as const, merchantId: 'netflix', merchantName: 'Netflix', merchantLogo: '/brands/netflix.png', code: 'BBFREE' },
        { id: 'demo-o4', title: 'Extra ₹100 Off', discountValue: 100, type: 'flat' as const, merchantId: 'amazon', merchantName: 'Amazon', merchantLogo: '/brands/amazon.png', code: 'BBSAVE' },
    ],
    offline: [
        { id: 'demo-s1', title: '20% Off on Meals', discountValue: 20, type: 'percentage' as const, merchantId: 'starbucks', merchantName: 'Starbucks', merchantLogo: '/brands/starbucks.png', merchantCity: 'All Cities' },
        { id: 'demo-s2', title: 'Buy 1 Get 1 Free', discountValue: 50, type: 'bogo' as const, merchantId: 'dominos', merchantName: "Domino's", merchantLogo: '/brands/dominos.png', merchantCity: 'All Cities' },
        { id: 'demo-s3', title: '15% Student Discount', discountValue: 15, type: 'percentage' as const, merchantId: 'mcdonalds', merchantName: "McDonald's", merchantLogo: '/brands/mcdonalds.png', merchantCity: 'All Cities' },
        { id: 'demo-s4', title: 'Flat ₹200 Off', discountValue: 200, type: 'flat' as const, merchantId: 'nike', merchantName: 'Nike', merchantLogo: '/brands/nike.png', merchantCity: 'All Cities' },
    ]
};

const OFFLINE_OFFERS = [
    { id: 1, brand: "Burger King", discount: "15% Student Discount", locations: "6+", isNew: true },
    { id: 2, brand: "Pizza Hut", discount: "20% Off Dine-In", locations: "8+", isNew: false },
];


// All searchable items
const ALL_ITEMS = [
    ...DEFAULT_CATEGORIES.map(c => ({ type: 'category', name: c.name, emoji: c.icon, color: c.gradient_from })),
    { type: 'offer', name: 'Spotify', emoji: '🎵', discount: 'Student Plan' },
    { type: 'offer', name: 'Netflix', emoji: '🎬', discount: '3 Months Free' },
    { type: 'location', name: 'Bengaluru', emoji: '📍', info: '45 offers' },
    { type: 'location', name: 'Mumbai', emoji: '📍', info: '32 offers' },
];

// Animated search placeholders (slide animation)
const SEARCH_PLACEHOLDERS = [
    "Search deals near you",
    "Find 'Starbucks'",
    "Search 'Pizza'",
    "Explore 'Fashion'",
    "Find nearby gyms",
];

export default function DashboardPage() {
    // State management via Zustand (Persistent)
    const {
        offers: cachedOffers,
        categories: cachedCategories,
        trendingOffline: cachedTrendingOffline,
        trendingOnline: cachedTrendingOnline,
        topBrands: cachedTopBrands,
        newMerchants: cachedNewMerchants,
        heroBanners: cachedHeroBanners,
        favoriteIds,

        setOffers,
        setCategories: setStoreCategories,
        setTrendingOffline,
        setTrendingOnline,
        setTopBrands,
        setNewMerchants,
        setHeroBanners,
        setFavoriteIds,
        toggleFavoriteId,
        clearCityData
    } = useStudentStore();


    const router = useRouter();
    const { theme } = useTheme();
    const isLightTheme = theme === 'light';
    const { unreadCount } = useNotifications();

    // Local UI states
    const [heroIndex, setHeroIndex] = useState(0);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showCitySelector, setShowCitySelector] = useState(false);

    // Initialize city from localStorage immediately to avoid loading flash
    const [selectedCity, setSelectedCity] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedCity') || null;
        }
        return null;
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    // Derived state for rendering
    const categories = cachedCategories?.data || DEFAULT_CATEGORIES;
    const realOffers = cachedOffers?.data || [];
    const trendingOffline = cachedTrendingOffline?.data || [];
    const trendingOnline = cachedTrendingOnline?.data || [];
    const newMerchants = cachedNewMerchants?.data || [];
    const heroBanners = cachedHeroBanners?.data || [];

    // Loading states (only true if NO data exists in cache)
    const [loadingOffers, setLoadingOffers] = useState(() => !cachedOffers);
    const [loadingBrands, setLoadingBrands] = useState(() => !cachedTopBrands);

    // Split Top Brands
    const [topBrandsState, setTopBrandsState] = useState<{ online: any[], offline: any[] }>({
        online: [],
        offline: []
    });

    // Content visibility settings
    const [contentSettings, setContentSettings] = useState({
        showTopBrands: true,
        showHeroBanners: true,
        showTrending: true,
    });

    const [isVerified, setIsVerified] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    // Slide animation for search placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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
        loadContentSettings();

        async function subscribeToRealtime() {
            const { supabase } = await import('@/lib/supabase');
            channel = supabase
                .channel('site_settings_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.content_visibility' },
                    (payload: any) => {
                        if (payload.new?.value) setContentSettings(payload.new.value);
                    }
                ).subscribe();
        }
        subscribeToRealtime();
        return () => { if (channel) channel.unsubscribe(); };
    }, []);

    // EFFECT: Process Cached Top Brands into Split State
    useEffect(() => {
        if (cachedTopBrands?.data) {
            const mapped = cachedTopBrands.data.map((b: any) => ({
                id: b.merchantId || b.id,
                name: b.merchant?.businessName || b.name || 'Unknown',
                logo: b.merchant?.logo || b.logo || null,
                category: b.merchant?.category || b.category || 'Store',
            }));
            const online = mapped.filter((b: any) => b.category === 'Startups/Apps' || b.category === 'Online');
            const offline = mapped.filter((b: any) => b.category !== 'Startups/Apps' && b.category !== 'Online');
            setTopBrandsState({ online, offline });
            setLoadingBrands(false);
        }
    }, [cachedTopBrands]);


    // Fetch real offers and check verification status
    useEffect(() => {
        async function fetchData() {
            try {
                // STEP 1: Determine the city 
                let cityToUse = selectedCity || cityService.getSelectedCity();

                // 1. Categories (Static-ish, only fetch if expired/missing)
                if (!isCacheValid(cachedCategories)) {
                    categoryService.getAll().then(res => {
                        if (res.success && res.data) setStoreCategories(res.data);
                    });
                }

                // 2. Offers (Critical)
                if (!isCacheValid(cachedOffers, cityToUse || undefined)) {
                    // Fetch in background, store updates will trigger re-render
                    const promise = cityToUse
                        ? offerService.getOffersByCity(cityToUse)
                        : offerService.getActiveOffers();

                    promise.then(result => {
                        if (result.success && result.data) {
                            setOffers(result.data, cityToUse || undefined);
                            setLoadingOffers(false);
                        }
                    });
                } else {
                    setLoadingOffers(false);
                }

                // STEP 2: Check student profile (Always check for favorites sync)
                const { studentService } = await import('@/lib/services/student.service');
                const profileResult = await studentService.getMyProfile();

                if (profileResult.success && profileResult.data) {
                    setIsVerified(true);
                    setStudentId(profileResult.data.id);

                    // Sync city
                    if (!cityToUse) {
                        const userCity = profileResult.data.selectedCity || profileResult.data.city;
                        if (userCity) {
                            cityToUse = userCity;
                            cityService.setSelectedCity(userCity);
                            setSelectedCity(userCity);
                        }
                    }

                    // Sync favorites
                    if (favoriteIds.length === 0) {
                        favoritesService.getSavedOfferIds().then(ids => setFavoriteIds(ids));
                    }
                }

                // Update city state if changed
                if (cityToUse && cityToUse !== selectedCity) setSelectedCity(cityToUse);


                // STEP 3: Background Fetches for other sections

                // Hero Banners
                if (!isCacheValid(cachedHeroBanners, cityToUse || undefined)) {
                    heroBannerService.getActiveForCity(cityToUse || 'All').then(res => {
                        if (res.success && res.data) setHeroBanners(res.data, cityToUse || undefined);
                    });
                }

                // Trending Offline
                if (!isCacheValid(cachedTrendingOffline, cityToUse || undefined)) {
                    trendingService.getMergedTrending('offline', 10, cityToUse || undefined).then(data => {
                        if (data) setTrendingOffline(data as any, cityToUse || undefined);
                    });
                }

                // Trending Online
                if (!isCacheValid(cachedTrendingOnline)) {
                    // Need user loc for online? maybe not strict
                    trendingService.getMergedTrending('online', 10, cityToUse || undefined).then(data => {
                        if (data) setTrendingOnline(data as any);
                    });
                }

                // Top Brands
                if (contentSettings.showTopBrands && !isCacheValid(cachedTopBrands)) {
                    topBrandsService.getAll().then(res => {
                        if (res.success && res.data) setTopBrands(res.data);
                    });
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setLoadingOffers(false);
            }
        }
        fetchData();
    }, [selectedCity]); // Re-run when city changes

    // Re-fetch new merchants when city changes
    useEffect(() => {
        if (selectedCity && !isCacheValid(cachedNewMerchants, selectedCity)) {
            newMerchantService.getNewMerchants(7, 10, selectedCity).then(res => {
                if (res.success && res.data) setNewMerchants(res.data, selectedCity);
            });
        }
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

        // Optimistic update via store action
        toggleFavoriteId(offerId, !isFav);

        // Actual API call
        const result = await favoritesService.toggleOffer(offerId);
        if (!result.success) {
            // Revert on failure
            toggleFavoriteId(offerId, isFav); // Revert to original state
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



            {/* Real-Time Search Overlay */}
            <SearchOverlay
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                city={selectedCity}
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            />

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
                        setOffers(result.data, city);
                    }
                }}
            />

            {/* Header - Minimal Premium */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLightTheme ? 'bg-white/90' : 'bg-black/90'}`}>
                <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
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

            <main className="max-w-7xl mx-auto space-y-4 px-5 pt-4 pb-4">
                {/* Search Bar with Slide Animation */}
                <button
                    onClick={() => setShowSearch(true)}
                    className={`w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-colors border press-scale ${isLightTheme ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05]'}`}
                >
                    <Search className={`h-4 w-4 flex-shrink-0 ${isLightTheme ? 'text-gray-400' : 'text-white/30'}`} />
                    <div className="flex-1 text-left overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={placeholderIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className={`text-sm block ${isLightTheme ? 'text-gray-400' : 'text-white/40'}`}
                            >
                                {SEARCH_PLACEHOLDERS[placeholderIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </button>

                {/* Hero Banner - NEW COMPONENT */}
                {contentSettings.showHeroBanners && (
                    <div className="-mx-5 md:mx-0 md:rounded-2xl overflow-hidden mb-4">
                        <HeroCarousel banners={heroBanners} />
                    </div>
                )}

                {/* Categories - Image Background Style (Like District) */}
                <section className="pb-4 relative z-10">
                    {/* Horizontal Scroll Categories with Image Backgrounds */}
                    <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 gap-3 pb-2 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
                        {categories.slice(0, 4).map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    vibrate('light');
                                    router.push(`/dashboard/explore?category=${cat.name}`);
                                }}
                                className="flex-shrink-0 relative w-[90px] h-[100px] lg:w-full lg:h-36 rounded-2xl overflow-hidden border border-white/10 shadow-lg group press-scale img-container"
                            >
                                {/* Background Image — explicit dimensions prevent layout shifts */}
                                {cat.image_url ? (
                                    <Image
                                        src={cat.image_url}
                                        alt={cat.name}
                                        fill
                                        sizes="(max-width: 1024px) 90px, 25vw"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        priority={true}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                                )}
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                {/* Category Name */}
                                <div className="absolute bottom-2 left-2 right-2">
                                    <span className="text-[11px] font-bold text-white leading-tight block">
                                        {cat.name?.split(' & ')[0] || 'Category'}
                                    </span>
                                    {cat.name?.includes('&') && (
                                        <span className="text-[9px] font-medium text-white/70">
                                            & {cat.name?.split(' & ')[1]}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* New Stores Section - District Style */}
                {newMerchants.length > 0 && (
                    <section className="py-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-center mb-5">
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                            <span className={`px-4 text-[10px] tracking-[0.2em] font-semibold uppercase ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>NEW STORES</span>
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                        </div>
                        {/* Horizontal Scroll Cards */}
                        <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4 gap-4 snap-x snap-mandatory">
                            {newMerchants.map((merchant) => (
                                <div
                                    key={merchant.id}
                                    className="w-[280px] flex-shrink-0 snap-center press-scale cursor-pointer"
                                    onClick={() => {
                                        vibrate('light');
                                        if (!isVerified) {
                                            setShowVerifyModal(true);
                                        } else {
                                            router.push(`/store/${merchant.id}`);
                                        }
                                    }}
                                >
                                    {/* Card Container */}
                                    <div className="relative rounded-3xl overflow-hidden border border-white/10 cursor-pointer group">
                                        {/* Store Branding Area - Large Background */}
                                        <div className="relative h-[320px] bg-gradient-to-br from-green-600 via-green-700 to-green-900 overflow-hidden">
                                            {/* Logo/Image Display */}
                                            {merchant.logoUrl ? (
                                                <div className="absolute inset-0 flex items-center justify-center p-8">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={merchant.logoUrl}
                                                            alt={merchant.businessName}
                                                            fill
                                                            className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-6xl font-black text-white/30">{merchant.businessName.charAt(0)}</span>
                                                </div>
                                            )}

                                            {/* Discount Badge - Top Left */}
                                            {merchant.bestDiscount > 0 && (
                                                <div className="absolute top-4 left-4 bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                                    {merchant.discountType === 'flat' ? `₹${merchant.bestDiscount} OFF` : `${merchant.bestDiscount}% OFF`}
                                                </div>
                                            )}

                                            {/* NEW Badge - Top Right */}
                                            <div className="absolute top-4 right-4 bg-white/90 text-black text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                <Sparkles className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                NEW
                                            </div>

                                            {/* Rating - Bottom Right */}
                                            {merchant.avgRating > 0 && (
                                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                    {merchant.avgRating.toFixed(1)} <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                    {merchant.totalRatings > 0 && <span className="text-white/60">({merchant.totalRatings})</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Store Name & Category - Bottom */}
                                        <div className={`px-4 py-3 ${isLightTheme ? 'bg-white' : 'bg-[#111]'}`}>
                                            <h3 className={`font-bold text-base truncate ${isLightTheme ? 'text-gray-900' : 'text-white'}`}>
                                                {merchant.businessName}
                                            </h3>
                                            <p className={`text-[12px] truncate ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>
                                                {merchant.category}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Brands Section - Combined Row */}
                {contentSettings.showTopBrands && (loadingBrands || topBrandsState.online.length > 0 || topBrandsState.offline.length > 0) && (
                    <section className="py-4">
                        <div className="flex items-center justify-center mb-4">
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                            <span className={`px-4 text-[10px] tracking-[0.2em] font-semibold uppercase ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>TOP BRANDS</span>
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                        </div>
                        <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 gap-4 pb-2">
                            {loadingBrands && topBrandsState.online.length === 0 && topBrandsState.offline.length === 0 ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                                            <div className={`h-20 w-20 rounded-2xl animate-pulse ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                            <div className={`h-2.5 w-14 rounded animate-pulse ${isLightTheme ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {/* All brands combined */}
                                    {[...topBrandsState.online, ...topBrandsState.offline].map((brand, index) => (
                                        <div
                                            key={brand.id}
                                            onClick={() => {
                                                vibrate('light');
                                                const isOnline = topBrandsState.online.some(b => b.id === brand.id);
                                                if (isOnline) {
                                                    router.push(`/dashboard/online-brand/${brand.id}`);
                                                } else {
                                                    router.push(`/store/${brand.id}`);
                                                }
                                            }}
                                            className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 w-20 group press-scale"
                                        >
                                            <div className={`h-20 w-20 rounded-2xl p-3 flex items-center justify-center transition-all duration-200 img-container ${isLightTheme
                                                ? 'bg-white border border-gray-100 shadow-lg hover:shadow-xl'
                                                : 'bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]'
                                                }`}>
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={brand.logo}
                                                        alt={brand.name}
                                                        fill
                                                        className="object-contain"
                                                        sizes="56px"
                                                        loading={index < 6 ? 'eager' : 'lazy'}
                                                    />
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-medium text-center line-clamp-1 w-full ${isLightTheme ? 'text-gray-600' : 'text-white/60'}`}>
                                                {brand.name}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </section>
                )}




                {/* Trending Offers - Online/Offline Tabs with Discount Cards */}
                {
                    contentSettings.showTrending && (
                        <TrendingSection
                            onlineOffers={trendingOnline.length > 0 ? trendingOnline : DEMO_TRENDING_OFFERS.online as any}
                            offlineOffers={cityFilteredTrendingOffline.length > 0 ? cityFilteredTrendingOffline : DEMO_TRENDING_OFFERS.offline as any}
                            isVerified={isVerified}
                            onVerifyClick={() => setShowVerifyModal(true)}
                            city={selectedCity}
                        />
                    )
                }
            </main >


        </div >
    );
}
