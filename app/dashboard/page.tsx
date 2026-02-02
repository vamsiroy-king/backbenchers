"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, Sparkles, X, ShieldCheck, Wifi, Bell, TrendingUp, Store, Loader2, ChevronDown, ChevronRight, Search, Clock, Globe } from "lucide-react";
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
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { SearchOverlay } from "@/components/SearchOverlay";

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
    const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState(0); // For Floating Card Stack
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
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

    // Split Top Brands (Online vs Offline)
    // We use a broader state to hold both lists
    const [topBrandsState, setTopBrandsState] = useState<{ online: any[], offline: any[] }>({
        online: [],
        offline: []
    });
    const [loadingBrands, setLoadingBrands] = useState(true);

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

    // Slide animation for search placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 3000);
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

                // Fetch data concurrently (including categories)
                const [categoriesRes] = await Promise.all([
                    categoryService.getAll()
                ]);

                if (categoriesRes.success && categoriesRes.data && categoriesRes.data.length > 0) {
                    setCategories(categoriesRes.data);
                }

                // If we have cached data, use it immediately (instant render)
                if (cachedOffers) setRealOffers(cachedOffers);
                if (cachedTrendingOffline) setTrendingOffline(cachedTrendingOffline);
                if (cachedTrendingOnline) setTrendingOnline(cachedTrendingOnline);
                if (cachedTopBrands) {
                    const mapped = cachedTopBrands.map((b: any) => ({
                        id: b.merchantId || b.id,
                        name: b.merchant?.businessName || b.name || 'Unknown',
                        logo: b.merchant?.logo || b.logo || null,
                        category: b.merchant?.category || b.category || 'Store',
                    }));
                    const online = mapped.filter((b: any) => b.category === 'Startups/Apps' || b.category === 'Online');
                    const offline = mapped.filter((b: any) => b.category !== 'Startups/Apps' && b.category !== 'Online');
                    setTopBrandsState({ online, offline });
                }
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

                // Fetch top brands and split into Online/Offline for Marquee
                if (contentSettings.showTopBrands) {
                    const brandsResult = await topBrandsService.getAll();
                    if (brandsResult.success && brandsResult.data) {
                        const allBrands = brandsResult.data;

                        // We need to fetch full merchant details to know if they are online/offline
                        // Or we can rely on heuristic: Brands with "online" category or empty city?
                        // Better: Fetch trending online to get online brands, and approved merchants for offline.
                        // Let's mix explicitly featured brands with high-performing ones.

                        // For the Marquee, we strictly want:
                        // Row 1 (Left): Online Brands
                        const online = allBrands.filter(b => b.merchant?.category === 'Startups/Apps' || b.merchant?.category === 'Online').map(b => ({
                            id: b.merchantId,
                            name: b.merchant?.businessName,
                            logo: b.merchant?.logo,
                            category: b.merchant?.category
                        }));

                        // Row 2 (Right): Offline Stores
                        const offline = allBrands.filter(b => b.merchant?.category !== 'Startups/Apps' && b.merchant?.category !== 'Online').map(b => ({
                            id: b.merchantId,
                            name: b.merchant?.businessName,
                            logo: b.merchant?.logo,
                            category: b.merchant?.category
                        }));

                        // If lists are too short, fetch generic top merchants to fill
                        if (online.length < 5) {
                            const { data: trendingOnline } = await trendingService.getBySection('online');
                            if (trendingOnline) {
                                trendingOnline.slice(0, 10).forEach(t => {
                                    if (!online.find(b => b.id === t.offer?.merchantId)) {
                                        online.push({
                                            id: t.offer?.merchantId || 'unknown',
                                            name: t.offer?.merchantName || 'Brand',
                                            logo: t.offer?.merchantLogo,
                                            category: 'Online'
                                        });
                                    }
                                });
                            }
                        }

                        // Sanitize duplicates and empty logos
                        const cleanOnline = online.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i && v.logo);
                        const cleanOffline = offline.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i && v.logo);

                        // Use demo data as fallback if no brands fetched
                        const finalOnline = cleanOnline.length > 0 ? cleanOnline : STATIC_TOP_BRANDS.online;
                        const finalOffline = cleanOffline.length > 0 ? cleanOffline : STATIC_TOP_BRANDS.offline;

                        setTopBrandsState({ online: finalOnline, offline: finalOffline });
                    }
                    setLoadingBrands(false);
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
                        setRealOffers(result.data);
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
                <motion.button
                    onClick={() => setShowSearch(true)}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-colors border ${isLightTheme ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05]'}`}
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
                </motion.button>

                {/* Hero Banner - NEW COMPONENT */}
                {contentSettings.showHeroBanners && (
                    <div className="-mx-5 md:mx-0 md:rounded-2xl overflow-hidden mb-8">
                        <HeroCarousel banners={heroBanners} />
                    </div>
                )}

                {/* Top Brands Marquee - SCROLL LINKED */}

                {/* Categories - Single Line Horizontal Scroll */}
                <section className="pb-4 relative z-10">
                    <div className="flex items-center justify-center mb-4">
                        <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                        <span className={`px-4 text-[10px] tracking-[0.2em] font-semibold uppercase ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>CATEGORIES</span>
                        <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                    </div>
                    {/* Horizontal Scroll Categories */}
                    <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 gap-3 pb-2">
                        {categories.map((cat) => (
                            <motion.button
                                key={cat.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    vibrate('light');
                                    router.push(`/dashboard/explore?category=${cat.name}`);
                                }}
                                className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-2xl border transition-all duration-200 group ${isLightTheme
                                    ? 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                                    : 'bg-[#111] border-[#222] hover:border-[#333]'
                                    }`}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{cat.icon || '🏷️'}</span>
                                <span className={`text-[10px] font-medium text-center line-clamp-1 px-1 ${isLightTheme ? 'text-gray-600' : 'text-white/60'} group-hover:${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                                    {cat.name?.split(' ')[0] || 'Category'}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* New Stores Section */}
                {newMerchants.length > 0 && (
                    <section className="py-6">
                        {/* Section Header - Consistent with Categories */}
                        <div className="flex items-center justify-center mb-6">
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                            <span className={`px-4 text-[10px] tracking-[0.2em] font-semibold uppercase ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>NEW ARRIVALS</span>
                            <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${isLightTheme ? 'via-gray-300' : 'via-white/[0.12]'} to-transparent`} />
                        </div>
                        {/* Horizontal Scroll Cards */}
                        <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4 gap-4 snap-x snap-mandatory">
                            {newMerchants.map((merchant) => (
                                <div key={merchant.id} className="w-[260px] flex-shrink-0 relative group snap-center">
                                    {/* New Badge Ribbon */}
                                    <div className="absolute top-4 left-4 z-10 bg-green-500 text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/20 flex items-center gap-1.5 ring-2 ring-black/20">
                                        <Sparkles className="h-3 w-3 fill-black" />
                                        NEW ARRIVAL
                                    </div>
                                    <div className="h-[350px]">
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
                                                avgRating: merchant.avgRating,
                                                totalRatings: merchant.totalRatings
                                            } as any}
                                            variant="default" // Use Default (Poster) or Featured? Default is Grid. Featured is Large Hero.
                                            // Actually Trending uses TrendingPosterCard which is CUSTOM. 
                                            // OfferCard 'default' is the vertical card. 'featured' is horizontal 16/9.
                                            // User said "Like trending section". Trending uses TrendingPosterCard (260x350).
                                            // OfferCard default is `aspect-[4/5]` ~ 260x325. 
                                            // I will use `TrendingPosterCard` if I can, OR just make OfferCard container matching size.
                                            // I will use OfferCard but forced in a container of 260x350 to match.
                                            // ACTUALLY, TrendingPosterCard is visually distinct (black, big text). OfferCard is Image + Text below.
                                            // User said "design... like trending". He might mean "Big Black Card" look?
                                            // Or just "Big Vertical Card". I will stick to "Big Vertical Card" (260px).
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
                                        <motion.div
                                            key={brand.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                vibrate('light');
                                                // Route based on brand type
                                                const isOnline = topBrandsState.online.some(b => b.id === brand.id);
                                                if (isOnline) {
                                                    router.push(`/dashboard/online-brand/${brand.id}`);
                                                } else {
                                                    router.push(`/store/${brand.id}`);
                                                }
                                            }}
                                            className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 w-20 group"
                                        >
                                            <div className={`h-20 w-20 rounded-2xl p-3 flex items-center justify-center transition-all duration-200 ${isLightTheme
                                                ? 'bg-white border border-gray-100 shadow-lg hover:shadow-xl'
                                                : 'bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]'
                                                }`}>
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={brand.logo}
                                                        alt={brand.name}
                                                        fill
                                                        className="object-contain"
                                                        sizes="80px"
                                                    />
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-medium text-center line-clamp-1 w-full ${isLightTheme ? 'text-gray-600' : 'text-white/60'}`}>
                                                {brand.name}
                                            </span>
                                        </motion.div>
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
