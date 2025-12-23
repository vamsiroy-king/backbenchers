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
import { favoriteService } from "@/lib/services/favorite.service";
import { newMerchantService, NewMerchant } from "@/lib/services/newMerchant.service";
import { notificationService, Notification } from "@/lib/services/notification.service";
import { CitySelector } from "@/components/CitySelector";
import { Offer } from "@/lib/types";

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

// Notifications data
const NOTIFICATIONS = [
    { id: 1, title: "🔥 Flash Deal!", message: "50% off at Nike - ends in 2 hours", time: "2m ago", isNew: true },
    { id: 2, title: "New Drop", message: "Spotify Student Plan now available", time: "1h ago", isNew: true },
    { id: 3, title: "Nearby Offer", message: "Starbucks 2 km away - Free upgrade", time: "3h ago", isNew: false },
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
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
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

    // Real notifications from database
    const [realNotifications, setRealNotifications] = useState<Notification[]>([]);

    // Use real notifications count if available, otherwise mock
    const notificationsToShow = realNotifications.length > 0 ? realNotifications : NOTIFICATIONS.map(n => ({
        id: String(n.id),
        userId: '',
        userType: 'student' as const,
        type: 'general',
        title: n.title,
        body: n.message,
        isRead: !n.isNew,
        createdAt: new Date().toISOString()
    }));
    const unreadCount = notificationsToShow.filter(n => !n.isRead).length;

    // Load content visibility settings
    useEffect(() => {
        const saved = localStorage.getItem('contentSettings');
        if (saved) {
            setContentSettings(JSON.parse(saved));
        }
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
    const bannerCount = heroBanners.length > 0 ? heroBanners.length : 3;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % bannerCount);
        }, 4000);
        return () => clearInterval(interval);
    }, [bannerCount]);

    // Fetch real offers and check verification status
    useEffect(() => {
        // Load saved city from localStorage
        const savedCity = cityService.getSelectedCity();
        if (savedCity) {
            setSelectedCity(savedCity);
        }

        async function fetchData() {
            try {
                // Fetch hero banners from database
                const bannerResult = await heroBannerService.getActiveForCity(savedCity || 'All');
                if (bannerResult.success && bannerResult.data && bannerResult.data.length > 0) {
                    setHeroBanners(bannerResult.data);
                }

                // Fetch offers filtered by city (if selected)
                const result = savedCity
                    ? await offerService.getOffersByCity(savedCity)
                    : await offerService.getActiveOffers();
                if (result.success && result.data) {
                    setRealOffers(result.data);
                }

                // Fetch trending offers from admin dashboard
                const trendingResult = await trendingService.getAll();
                if (trendingResult.success && trendingResult.data) {
                    const offline = trendingResult.data
                        .filter(t => t.section === 'offline' && t.offer)
                        .map(t => ({
                            id: t.offer!.id,
                            title: t.offer!.title,
                            discountValue: t.offer!.discountValue,
                            type: t.offer!.type,
                            merchantName: t.offer!.merchantName,
                            merchantId: t.offer!.merchantId,
                            merchantCity: t.offer!.merchantCity,
                        } as Offer));
                    const online = trendingResult.data
                        .filter(t => t.section === 'online' && t.offer)
                        .map(t => ({
                            id: t.offer!.id,
                            title: t.offer!.title,
                            discountValue: t.offer!.discountValue,
                            type: t.offer!.type,
                            merchantName: t.offer!.merchantName,
                            merchantId: t.offer!.merchantId,
                            merchantCity: t.offer!.merchantCity,
                        } as Offer));
                    setTrendingOffline(offline);
                    setTrendingOnline(online);
                }

                // Fetch top brands from admin dashboard
                const brandsResult = await topBrandsService.getAll();
                if (brandsResult.success && brandsResult.data) {
                    setTopBrandsData(brandsResult.data.map(b => ({
                        id: b.merchantId,
                        name: b.merchant?.businessName || 'Unknown',
                        logo: b.merchant?.logo || null,
                        category: b.merchant?.category || 'Store',
                    })));
                }

                // Fetch new merchants for "New on BackBenchers"
                const newMerchantsResult = await newMerchantService.getNewMerchants(7, 10);
                if (newMerchantsResult.success && newMerchantsResult.data) {
                    setNewMerchants(newMerchantsResult.data);
                }

                // Check if student is verified
                const { studentService } = await import('@/lib/services/student.service');
                const profileResult = await studentService.getMyProfile();
                if (profileResult.success && profileResult.data) {
                    setIsVerified(true);
                    setStudentId(profileResult.data.id);
                    // Load student's saved city from database if available
                    if (profileResult.data.selectedCity) {
                        setSelectedCity(profileResult.data.selectedCity);
                    }

                    // Fetch favorite IDs
                    const favIds = await favoriteService.getFavoriteIds();
                    setFavoriteIds(favIds);

                    // Fetch real notifications
                    const notifResult = await notificationService.getMyNotifications(10);
                    if (notifResult.success && notifResult.data) {
                        setRealNotifications(notifResult.data);
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
        // Optimistic update
        if (isFav) {
            setFavoriteIds(prev => prev.filter(id => id !== offerId));
        } else {
            setFavoriteIds(prev => [...prev, offerId]);
        }

        // Actual API call
        const result = await favoriteService.toggleFavorite(offerId);
        if (!result.success) {
            // Revert on failure
            if (isFav) {
                setFavoriteIds(prev => [...prev, offerId]);
            } else {
                setFavoriteIds(prev => prev.filter(id => id !== offerId));
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
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Get Verified Modal */}
            <AnimatePresence>
                {showVerifyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowVerifyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Get Verified</h2>
                                <p className="text-gray-500 text-sm">
                                    Verify your student status to unlock this offer.
                                </p>
                            </div>

                            <Link href="/signup" className="block">
                                <Button className="w-full h-14 bg-black text-white font-bold rounded-2xl text-base">
                                    Verify Now - Free
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notifications Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowNotifications(false)}
                    >
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-16 right-4 left-4 bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[70vh]"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Notifications</h3>
                                <button
                                    onClick={async () => {
                                        await notificationService.markAllAsRead();
                                        setRealNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                    }}
                                    className="text-xs text-primary font-semibold"
                                >
                                    Mark all read
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[50vh] overflow-y-auto">
                                {notificationsToShow.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notificationsToShow.map((notif) => (
                                        <div key={notif.id} className={`p-4 flex gap-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${!notif.isRead ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                                {notif.type === 'offer_expiring' ? '⏰' :
                                                    notif.type === 'new_deal' ? '🎁' :
                                                        notif.type === 'redemption' ? '✅' : '🔔'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm truncate">{notif.title}</p>
                                                    {!notif.isRead && <span className="h-2 w-2 bg-primary rounded-full" />}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{notif.body}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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
                        className="fixed inset-0 z-[90] bg-white"
                    >
                        <div className="p-4 pt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <X className="h-5 w-5" />
                                </button>
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search brands, categories..."
                                        className="w-full h-12 bg-gray-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            {searchQuery.length === 0 ? (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['Nike', 'Starbucks', 'Netflix'].map((term) => (
                                                <button key={term} onClick={() => setSearchQuery(term)} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trending</h4>
                                        <div className="space-y-2">
                                            {['Spotify Student', 'Apple Education', 'Uber'].map((term, i) => (
                                                <button key={term} onClick={() => setSearchQuery(term)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50">
                                                    <span className="text-lg">🔥</span>
                                                    <span className="font-medium text-sm">{term}</span>
                                                    <span className="text-xs text-gray-400 ml-auto">#{i + 1}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredItems.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
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
                                                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-gray-50 hover:bg-gray-100"
                                            >
                                                <span className="text-2xl">{item.emoji}</span>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                                                </div>
                                                {'discount' in item && (
                                                    <span className="ml-auto text-xs font-semibold text-purple-600">{item.discount}</span>
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

            {/* Header with City & Bell */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100/80">
                <div className="px-5 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-base">B</span>
                        </div>
                        <span className="font-extrabold text-xl tracking-tight">Backbenchers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* City Selector */}
                        <button
                            onClick={() => setShowCitySelector(true)}
                            className="flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-gray-50 text-sm font-medium text-gray-700 active:scale-95 transition-transform border border-gray-100"
                        >
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="max-w-24 truncate">{selectedCity || 'Select City'}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        {/* Notifications */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center relative active:scale-95 transition-transform border border-gray-100"
                        >
                            <Bell className="h-5 w-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="space-y-8 px-5 pt-6 pb-4">
                {/* Animated Search Bar Trigger - "Search" stays stable, only placeholder animates */}
                <motion.button
                    onClick={() => setShowSearch(true)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 bg-gray-100 rounded-2xl flex items-center gap-3 px-5 relative overflow-hidden group hover:bg-gray-200/80 transition-colors"
                >
                    <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-left flex items-center gap-1 overflow-hidden">
                        <span className="text-sm text-gray-400 font-medium">Search</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={searchPlaceholderIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="text-sm text-gray-300 font-medium"
                            >
                                {SEARCH_PLACEHOLDERS[searchPlaceholderIndex].replace('Search ', '')}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <div className="text-xs font-bold text-gray-300 px-2 py-1 bg-gray-200/50 rounded-lg">
                        ⌘K
                    </div>
                </motion.button>

                {/* Hero Banner - Auto-scroll Carousel */}
                <div className="relative -mx-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {(heroBanners.length > 0 ? heroBanners : [
                            { id: '1', title: 'Student Discounts', subtitle: 'Up to 50% off on 100+ brands', ctaText: 'Explore', backgroundGradient: 'from-primary to-emerald-500' },
                            { id: '2', title: 'Flash Deals', subtitle: 'Limited time offers nearby', ctaText: 'View All', backgroundGradient: 'from-orange-500 to-rose-500' },
                            { id: '3', title: 'New Drops', subtitle: 'Fresh deals every week', ctaText: 'Check Out', backgroundGradient: 'from-blue-500 to-indigo-600' },
                        ]).map((banner: any, index: number) =>
                            index === currentBannerIndex && (
                                <motion.div
                                    key={banner.id}
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className={`mx-5 h-44 rounded-3xl bg-gradient-to-br ${banner.backgroundGradient} p-6 flex flex-col justify-between relative overflow-hidden`}
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

                    {/* Active dot indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                        {[0, 1, 2].map((i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentBannerIndex(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${currentBannerIndex === i ? 'w-8 bg-gray-900' : 'w-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* F³ Categories - Premium Green Gradient Triangle */}
                <div className="py-6 -mx-5">
                    {/* Smooth Green Gradient Background */}
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-5 py-8 rounded-3xl mx-5">
                        {/* Triangle Layout Container */}
                        <div className="relative flex flex-col items-center gap-3">
                            {/* Top Row - Food Category */}
                            <Link href="/dashboard/category/Food">
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                        <span className="text-2xl">🍕</span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-600">Food</span>
                                </div>
                            </Link>

                            {/* Middle Row - F³ Center */}
                            <div className="flex items-center justify-center my-1">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-white text-lg font-black">F³</span>
                                </div>
                            </div>

                            {/* Bottom Row - Fashion & Fitness */}
                            <div className="flex items-center justify-center gap-10">
                                <Link href="/dashboard/category/Fashion">
                                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                            <span className="text-2xl">👗</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-600">Fashion</span>
                                    </div>
                                </Link>
                                <Link href="/dashboard/category/Fitness">
                                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                            <span className="text-2xl">💪</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-600">Fitness</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New on BackBenchers Section */}
                {newMerchants.length > 0 && (
                    <div className="py-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">New on BackBenchers</h3>
                            </div>
                            <span className="text-xs text-gray-400">Recently joined</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2">
                            {newMerchants.map((merchant, i) => (
                                <Link key={merchant.id} href={`/store/${merchant.id}`}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex-shrink-0 w-36 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-card border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                                    >
                                        <div className="h-16 w-16 mx-auto bg-gradient-to-br from-primary/10 to-emerald-100 dark:from-primary/20 dark:to-emerald-800 rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                                            {merchant.logoUrl ? (
                                                <img src={merchant.logoUrl} alt={merchant.businessName} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Store className="h-7 w-7 text-primary" />
                                            )}
                                        </div>
                                        <p className="font-semibold text-sm text-center truncate dark:text-white">{merchant.businessName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate">{merchant.category}</p>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[9px] font-semibold">NEW</span>
                                            {merchant.daysOld <= 3 && <span className="text-[9px] text-gray-400">🔥</span>}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trending Offers - Premium Horizontal Scroll */}
                <div className="py-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Trending</h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setTrendingTab('offline')}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${trendingTab === 'offline'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                In-Store
                            </button>
                            <button
                                onClick={() => setTrendingTab('online')}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${trendingTab === 'online'
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Online
                            </button>
                        </div>
                    </div>

                    {/* Horizontal Scroll Cards */}
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-2 pt-1">
                        {currentOffers.map((offer: any) => {
                            const isFav = offer.id && favoriteIds.includes(offer.id);
                            const expiryText = getExpiryText(offer.validUntil);
                            const isExpired = expiryText === 'Expired';

                            return (
                                <motion.div
                                    key={offer.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (!isVerified) {
                                            setShowVerifyModal(true);
                                        } else if (offer.merchantId) {
                                            router.push(`/store/${offer.merchantId}`);
                                        }
                                    }}
                                    className={`flex-none w-[280px] cursor-pointer ${isExpired ? 'opacity-40 grayscale' : ''}`}
                                >
                                    <div className="bg-white rounded-3xl p-5 relative">
                                        {/* Discount Badge - Top Right Inside */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                                                {offer.discountValue
                                                    ? `${offer.type === 'percentage' ? offer.discountValue + '%' : '₹' + offer.discountValue}`
                                                    : (offer.discount || 'Deal')}
                                            </span>
                                        </div>

                                        {/* Content Row */}
                                        <div className="flex items-start gap-4">
                                            {/* Merchant Logo */}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${trendingTab === 'online'
                                                ? 'bg-gradient-to-br from-violet-50 to-purple-50'
                                                : 'bg-gradient-to-br from-emerald-50 to-teal-50'
                                                }`}>
                                                {offer.merchantLogo ? (
                                                    <img src={offer.merchantLogo} alt="" className="w-10 h-10 object-contain rounded-xl" />
                                                ) : (
                                                    <span className="text-2xl">{trendingTab === 'online' ? '🌐' : '🏪'}</span>
                                                )}
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-base text-gray-900 ${isExpired ? 'line-through' : ''}`}>
                                                    {offer.merchantName || offer.brand || 'Special Offer'}
                                                </h4>
                                                <p className={`text-sm text-gray-500 mt-0.5 ${isExpired ? 'line-through' : ''}`}>
                                                    {offer.title || 'Limited time offer'}
                                                </p>

                                                {expiryText && !isExpired && (
                                                    <span className={`inline-block text-[10px] font-medium mt-2 px-2 py-0.5 rounded-full ${expiryText.includes('h')
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {expiryText}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Favorite */}
                                            <button
                                                onClick={(e) => offer.id && toggleFavorite(offer.id, e)}
                                                className="p-1"
                                            >
                                                <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-200 hover:text-gray-400'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <Link href="/dashboard/explore" className="block text-center mt-5">
                        <span className="text-sm text-gray-400">See all offers →</span>
                    </Link>
                </div>

                {/* Top Brands - Conditionally rendered based on admin settings */}
                {
                    contentSettings.showTopBrands && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-lg font-bold tracking-tight text-gray-900">Top Brands</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
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
                                        className="bg-white rounded-xl p-3.5 flex flex-col items-center gap-2 shadow-card border border-gray-100/50 hover:shadow-soft transition-shadow"
                                    >
                                        <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {brand.logo ? (
                                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 text-center line-clamp-1">{brand.name}</span>
                                        <span className="text-[10px] font-medium text-primary">{brand.discount || brand.category}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* App Switcher */}
                < div className="pt-8 border-t border-gray-100/80 mt-4" >
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-2.5">
                        <Link href="/merchant" className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 border border-gray-100">
                            Merchant App
                        </Link>
                        <Link href="/admin/dashboard" className="px-4 py-2.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 border border-gray-100">
                            Admin Panel
                        </Link>
                    </div>
                </div>
            </main>
        </div >
    );
}
