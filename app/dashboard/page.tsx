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
    const [heroIndex, setHeroIndex] = useState(0);
    const [trendingTab, setTrendingTab] = useState<'online' | 'offline'>('offline');
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

    // Rating modal state for post-redemption rating
    const [ratingModalData, setRatingModalData] = useState<{
        isOpen: boolean;
        transactionId: string;
        merchantId: string;
        merchantName: string;
    } | null>(null);

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

    // Check for pending ratings on page load - SHOW IMMEDIATELY in center of screen
    useEffect(() => {
        async function checkPendingRatings() {
            console.log('[RatingCheck] StudentId:', studentId);
            if (!studentId) {
                console.log('[RatingCheck] No studentId, skipping');
                return;
            }

            try {
                console.log('[RatingCheck] Fetching pending ratings from DB...');
                const pendingRating = await getNextPendingRatingFromDB(studentId);
                console.log('[RatingCheck] Result:', pendingRating);

                if (pendingRating) {
                    console.log('[RatingCheck] ✅ Found pending rating! Showing modal for:', pendingRating.merchantName);
                    // Show rating modal immediately
                    setRatingModalData({
                        isOpen: true,
                        transactionId: pendingRating.transactionId,
                        merchantId: pendingRating.merchantId,
                        merchantName: pendingRating.merchantName,
                    });
                } else {
                    console.log('[RatingCheck] No pending ratings found');
                }
            } catch (err) {
                console.error('[RatingCheck] Error:', err);
            }
        }
        checkPendingRatings();
    }, [studentId]);

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
                    const [offlineTrending, onlineTrending] = await Promise.all([
                        trendingService.getMergedTrending('offline', 10),
                        trendingService.getMergedTrending('online', 10)
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

    const currentOffers = trendingTab === 'online'
        ? (trendingOnline.length > 0 ? trendingOnline : ONLINE_OFFERS)
        : (cityFilteredTrendingOffline.length > 0
            ? cityFilteredTrendingOffline
            : (cityFilteredRealOffers.length > 0 ? cityFilteredRealOffers : OFFLINE_OFFERS));

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
        <div className="min-h-screen bg-[#0a0a0b] pb-32">
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

                            <Link href="/signup" className="block">
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
                        className="fixed inset-0 z-[90] bg-[#0a0a0b]"
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
            <header className="sticky top-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-xl">
                <div className="px-5 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-black font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-lg text-white tracking-tight">Backbenchers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* City Selector */}
                        <button
                            onClick={() => setShowCitySelector(true)}
                            className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/[0.04] text-xs font-medium text-white/70 transition-all border border-white/[0.06] hover:bg-white/[0.06]"
                        >
                            <MapPin className="h-3.5 w-3.5 text-white/50" />
                            <span className="max-w-20 truncate">{selectedCity || 'City'}</span>
                        </button>
                        {/* Notifications */}
                        <button
                            onClick={() => router.push('/dashboard/notifications')}
                            className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center relative transition-all border border-white/[0.06] hover:bg-white/[0.06]"
                        >
                            <Bell className="h-4 w-4 text-white/50" />
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
                    className="w-full h-12 bg-white/[0.03] rounded-xl flex items-center gap-3 px-4 hover:bg-white/[0.05] transition-colors border border-white/[0.04]"
                >
                    <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
                    <div className="flex-1 text-left flex items-center gap-1.5 overflow-hidden">
                        <span className="text-sm text-white/30">Search</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={searchPlaceholderIndex}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm text-white/20"
                            >
                                {SEARCH_PLACEHOLDERS[searchPlaceholderIndex].replace('Search ', '')}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </motion.button>

                {/* Hero Banner - Touch/Swipe Carousel */}
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
                            { id: '1', title: 'Student Discounts', subtitle: 'Up to 50% off on 100+ brands', ctaText: 'Explore', backgroundGradient: 'from-primary to-emerald-500' },
                            { id: '2', title: 'Flash Deals', subtitle: 'Limited time offers nearby', ctaText: 'View All', backgroundGradient: 'from-orange-500 to-rose-500' },
                            { id: '3', title: 'New Drops', subtitle: 'Fresh deals every week', ctaText: 'Check Out', backgroundGradient: 'from-blue-500 to-indigo-600' },
                        ]).map((banner: any, index: number) =>
                            index === currentBannerIndex && (
                                <motion.div
                                    key={banner.id}
                                    initial={{ opacity: 0, x: swipeDirection === 'left' ? 300 : -300 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: swipeDirection === 'left' ? -300 : 300 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={`mx-5 h-44 rounded-3xl bg-gradient-to-br ${banner.backgroundGradient} p-6 flex flex-col justify-between relative overflow-hidden cursor-grab active:cursor-grabbing`}
                                >
                                    {/* Shine overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                                    <div className="relative z-10">
                                        <h2 className="text-white text-2xl font-extrabold tracking-tight">{banner.title}</h2>
                                        {banner.subtitle && (
                                            <p className="text-white/80 text-sm mt-1.5 font-medium">{banner.subtitle}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleOfferClick}
                                        className="relative z-10 bg-white text-gray-900 font-bold px-6 py-2.5 rounded-xl w-fit text-sm shadow-lg"
                                    >
                                        {banner.ctaText}
                                    </button>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>

                    {/* Swipe hint + Active dot indicators */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-[10px] text-white/30 mr-2">← Swipe →</span>
                        {(heroBanners.length > 0 ? heroBanners : [1, 2, 3]).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentBannerIndex(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${currentBannerIndex === i ? 'w-8 bg-green-400' : 'w-2 bg-white/20 hover:bg-white/30'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Categories - Minimal Grid */}
                <section className="py-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                            <Store className="h-4 w-4 text-white/50" />
                        </div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">Categories</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { name: "Food", emoji: "🍕", color: "bg-orange-500/10 text-orange-400" },
                            { name: "Fashion", emoji: "👗", color: "bg-pink-500/10 text-pink-400" },
                            { name: "Fitness", emoji: "💪", color: "bg-blue-500/10 text-blue-400" }
                        ].map((cat) => (
                            <Link key={cat.name} href={`/dashboard/category/${cat.name}`}>
                                <motion.div
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all flex flex-col items-center gap-2"
                                >
                                    <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center`}>
                                        <span className="text-xl">{cat.emoji}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white/80">{cat.name}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* New on BackBenchers - Minimal Horizontal Scroll */}
                {newMerchants.length > 0 && (
                    <section className="py-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-green-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-white tracking-tight">New Stores</h2>
                            </div>
                            <span className="text-xs text-white/30">Recently joined</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
                            {newMerchants.map((merchant, i) => (
                                <motion.div
                                    key={merchant.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => {
                                        if (isVerified) {
                                            router.push(`/store/${merchant.id}`);
                                        } else {
                                            router.push('/signup');
                                        }
                                    }}
                                    className="flex-shrink-0 w-28 bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all text-center"
                                >
                                    <div className="h-12 w-12 mx-auto bg-white/[0.04] rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                                        {merchant.logoUrl ? (
                                            <img src={merchant.logoUrl} alt={merchant.businessName} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="h-5 w-5 text-white/30" />
                                        )}
                                    </div>
                                    <p className="font-medium text-xs text-white truncate">{merchant.businessName}</p>
                                    <p className="text-[10px] text-white/30 truncate mt-0.5">{merchant.category}</p>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Offers - Ultra Minimal Premium Design */}
                <section className="py-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">Trending</h2>
                        </div>

                        {/* Premium Tab Switcher */}
                        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.04]">
                            <button
                                onClick={() => setTrendingTab('offline')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${trendingTab === 'offline'
                                    ? 'bg-white text-black'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                In-Store
                            </button>
                            <button
                                onClick={() => setTrendingTab('online')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${trendingTab === 'online'
                                    ? 'bg-white text-black'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                Online
                            </button>
                        </div>
                    </div>

                    {/* Offers Grid - Clean Minimal Cards */}
                    <div className="space-y-3">
                        {currentOffers.slice(0, 5).map((offer: any, index: number) => {
                            const isFav = offer.id && favoriteIds.includes(offer.id);
                            const expiryText = getExpiryText(offer.validUntil);
                            const isExpired = expiryText === 'Expired';

                            return (
                                <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => {
                                        if (!isVerified) {
                                            setShowVerifyModal(true);
                                        } else if (offer.merchantId) {
                                            router.push(`/store/${offer.merchantId}`);
                                        }
                                    }}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] cursor-pointer
                                        hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200
                                        ${isExpired ? 'opacity-40' : ''}`}
                                >
                                    {/* Logo Container */}
                                    <div className="relative flex-shrink-0">
                                        <div className="h-14 w-14 rounded-xl bg-white/[0.04] flex items-center justify-center overflow-hidden">
                                            {offer.merchantLogo ? (
                                                <img src={offer.merchantLogo} alt="" className="h-10 w-10 object-contain" />
                                            ) : (
                                                <Store className="h-6 w-6 text-white/30" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="text-[15px] font-medium text-white truncate">
                                                    {offer.merchantName || offer.brand || 'Special Offer'}
                                                </h3>
                                                <p className="text-sm text-white/40 truncate mt-0.5">
                                                    {offer.title || 'Limited time offer'}
                                                </p>
                                            </div>

                                            {/* Discount Badge - Minimal */}
                                            <div className="flex-shrink-0">
                                                <span className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-green-500/10 text-green-400 text-sm font-semibold">
                                                    {offer.discountValue
                                                        ? `${offer.type === 'percentage' ? offer.discountValue + '%' : '₹' + offer.discountValue}`
                                                        : (offer.discount || 'Deal')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expiry Tag */}
                                        {expiryText && !isExpired && (
                                            <span className={`inline-block text-[11px] font-medium mt-2 ${expiryText.includes('h') || expiryText.includes('Ends')
                                                ? 'text-orange-400'
                                                : 'text-white/30'
                                                }`}>
                                                {expiryText}
                                            </span>
                                        )}
                                    </div>

                                    {/* Favorite Button - Clean Instagram Style */}
                                    <motion.button
                                        onClick={(e) => offer.id && toggleFavorite(offer.id, e)}
                                        className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
                                        whileTap={{ scale: 0.85 }}
                                    >
                                        <motion.div
                                            animate={isFav ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                        >
                                            <Heart
                                                className={`h-5 w-5 transition-all duration-200 ${isFav
                                                    ? 'fill-red-500 text-red-500'
                                                    : 'text-white/40 hover:text-white/60'
                                                    }`}
                                            />
                                        </motion.div>
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* See All Link */}
                    <Link href="/dashboard/explore" className="block mt-6">
                        <div className="flex items-center justify-center gap-2 py-3 text-white/30 hover:text-white/50 transition-colors">
                            <span className="text-sm">View all offers</span>
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </Link>
                </section>

                {/* Top Brands - Minimal Grid */}
                {contentSettings.showTopBrands && (
                    <section className="py-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-amber-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">Top Brands</h2>
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
                                    className="bg-white/[0.02] rounded-xl p-3 flex flex-col items-center gap-2 border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center overflow-hidden">
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="h-4 w-4 text-white/30" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-white/80 text-center line-clamp-1">{brand.name}</span>
                                    <span className="text-[10px] text-green-400/80">{brand.discount || brand.category}</span>
                                </motion.button>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Rating Modal - Shows after successful redemption */}
            {ratingModalData && studentId && (
                <RatingModal
                    isOpen={ratingModalData.isOpen}
                    onClose={() => {
                        // Dismiss in database when skipped/closed
                        dismissPendingRating(ratingModalData.transactionId);
                        setRatingModalData(null);
                    }}
                    transactionId={ratingModalData.transactionId}
                    merchantId={ratingModalData.merchantId}
                    merchantName={ratingModalData.merchantName}
                    studentId={studentId}
                    onRatingSubmitted={() => {
                        // Delete from database when submitted
                        deletePendingRating(ratingModalData.transactionId);
                        setRatingModalData(null);
                    }}
                />
            )}
        </div >
    );
}
