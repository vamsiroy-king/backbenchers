"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, Sparkles, X, ShieldCheck, Wifi, Bell, TrendingUp, Store, Loader2, ChevronDown, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { offerService } from "@/lib/services/offer.service";
import { trendingService } from "@/lib/services/trending.service";
import { topBrandsService } from "@/lib/services/topBrands.service";
import { cityService } from "@/lib/services/city.service";
import { heroBannerService, HeroBanner } from "@/lib/services/heroBanner.service";
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

    // Content visibility settings (from admin)
    const [contentSettings, setContentSettings] = useState({
        showTopBrands: true,
        showHeroBanners: true,
        showTrending: true,
    });

    // Check if student is verified (logged in with profile)
    const [isVerified, setIsVerified] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    const unreadCount = NOTIFICATIONS.filter(n => n.isNew).length;

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
                                <span className="text-xs text-primary font-semibold">Mark all read</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {NOTIFICATIONS.map((notif) => (
                                    <div key={notif.id} className={`p-4 flex gap-3 ${notif.isNew ? 'bg-primary/5' : ''}`}>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${notif.isNew ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                            {notif.title.includes('Flash') ? '⚡' : notif.title.includes('Drop') ? '🎁' : '📍'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm truncate">{notif.title}</p>
                                                {notif.isNew && <span className="h-2 w-2 bg-primary rounded-full" />}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                                        </div>
                                    </div>
                                ))}
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
                {/* Animated Search Bar Trigger */}
                <motion.button
                    onClick={() => setShowSearch(true)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 bg-gray-100 rounded-2xl flex items-center gap-3 px-5 relative overflow-hidden group hover:bg-gray-200/80 transition-colors"
                >
                    <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-left overflow-hidden h-6">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={searchPlaceholderIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-sm text-gray-400 font-medium absolute"
                            >
                                {SEARCH_PLACEHOLDERS[searchPlaceholderIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <div className="text-xs font-bold text-gray-300 px-2 py-1 bg-gray-200/50 rounded-lg">
                        ⌘K
                    </div>
                </motion.button>

                {/* Hero Banners - Smooth Drag Scroll with Momentum */}
                <div className="relative -mx-5">
                    <motion.div
                        className="flex gap-4 px-5 cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ left: -((heroBanners.length > 0 ? heroBanners.length : 3) - 1) * 300, right: 0 }}
                        dragElastic={0.1}
                        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
                    >
                        {(heroBanners.length > 0 ? heroBanners : [
                            { id: '1', title: 'Student Discounts', subtitle: 'Up to 50% off on 100+ brands', ctaText: 'Explore', backgroundGradient: 'from-primary to-emerald-500' },
                            { id: '2', title: 'Flash Deals', subtitle: 'Limited time offers nearby', ctaText: 'View All', backgroundGradient: 'from-orange-500 to-rose-500' },
                            { id: '3', title: 'New Drops', subtitle: 'Fresh deals every week', ctaText: 'Check Out', backgroundGradient: 'from-blue-500 to-indigo-600' },
                        ]).map((banner: any, index: number) => (
                            <motion.div
                                key={banner.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleOfferClick}
                                className={`flex-none w-[85vw] max-w-[340px] h-44 rounded-3xl bg-gradient-to-br ${banner.backgroundGradient} p-6 flex flex-col justify-between shadow-2xl cursor-pointer relative overflow-hidden`}
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
                                <button className="relative z-10 bg-white text-gray-900 font-bold px-6 py-2.5 rounded-xl w-fit text-sm shadow-lg hover:shadow-xl transition-shadow">
                                    {banner.ctaText}
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                    {/* Scroll indicator dots */}
                    <div className="flex justify-center gap-2 mt-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-300'}`} />
                        ))}
                    </div>
                </div>

                {/* F³ Categories - Floating Card Stack */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">F³</span>
                        </div>
                        <h3 className="text-base font-bold tracking-tight text-gray-900">Explore Categories</h3>
                    </div>

                    {/* Floating Card Stack */}
                    <div
                        className="relative h-[280px] flex items-center justify-center perspective-1000"
                        style={{ perspective: '1000px' }}
                    >
                        {CATEGORIES.map((cat, index) => {
                            // Calculate position relative to selected
                            const position = index - selectedCategory;
                            const isActive = position === 0;
                            const behind = position < 0 ? Math.abs(position) : 0;
                            const ahead = position > 0 ? position : 0;

                            return (
                                <motion.div
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(index)}
                                    animate={{
                                        scale: isActive ? 1 : 0.85 - Math.abs(position) * 0.05,
                                        y: isActive ? 0 : behind ? -20 - behind * 15 : 20 + ahead * 15,
                                        zIndex: isActive ? 30 : 20 - Math.abs(position) * 5,
                                        rotateX: isActive ? 0 : position > 0 ? 8 : -8,
                                        opacity: isActive ? 1 : 0.6 - Math.abs(position) * 0.15,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                        mass: 0.8
                                    }}
                                    drag="y"
                                    dragConstraints={{ top: 0, bottom: 0 }}
                                    dragElastic={0.3}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.y < -50 && selectedCategory < CATEGORIES.length - 1) {
                                            setSelectedCategory(selectedCategory + 1);
                                        } else if (info.offset.y > 50 && selectedCategory > 0) {
                                            setSelectedCategory(selectedCategory - 1);
                                        }
                                    }}
                                    className={`absolute w-[85%] max-w-[320px] h-[200px] ${cat.color} rounded-3xl p-6 cursor-pointer shadow-2xl overflow-hidden`}
                                    style={{
                                        transformStyle: 'preserve-3d',
                                    }}
                                >
                                    {/* Glass shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" />
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

                                    {/* Content */}
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="flex items-start justify-between">
                                            <motion.span
                                                className="text-6xl"
                                                animate={{ scale: isActive ? 1 : 0.8 }}
                                            >
                                                {cat.icon}
                                            </motion.span>
                                            <span className="text-white/40 text-xs font-bold tracking-wider">
                                                {cat.symbol}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-white font-extrabold text-2xl tracking-tight">
                                                {cat.name}
                                            </p>
                                            <p className="text-white/70 text-sm mt-1">
                                                {cat.tagline}
                                            </p>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    <Link href={`/dashboard/category/${cat.name}`}>
                                                        <button className="mt-4 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-bold border border-white/30 hover:bg-white/30 transition-colors">
                                                            Explore {cat.name} →
                                                        </button>
                                                    </Link>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Navigation dots */}
                    <div className="flex justify-center gap-2">
                        {CATEGORIES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedCategory(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${selectedCategory === index
                                    ? 'w-8 bg-gray-900'
                                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Swipe hint */}
                    <p className="text-center text-xs text-gray-400 font-medium">
                        Swipe up or down to browse
                    </p>
                </div>


                {/* Trending Section */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-bold tracking-tight text-gray-900">Trending Offers</h3>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center">
                        <div className="inline-flex bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setTrendingTab('online')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${trendingTab === 'online' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                                    }`}
                            >
                                <Wifi className="h-4 w-4" />
                                Online
                            </button>
                            <button
                                onClick={() => setTrendingTab('offline')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${trendingTab === 'offline' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                                    }`}
                            >
                                <MapPin className="h-4 w-4" />
                                Offline
                            </button>
                        </div>
                    </div>

                    {/* Offers */}
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x -mx-5 px-5">
                        {currentOffers.map((offer: any) => (
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
                                className="snap-start flex-none w-[260px] cursor-pointer"
                            >
                                <div className="bg-white rounded-2xl shadow-card border border-gray-100/50 overflow-hidden">
                                    <div className={`h-28 ${trendingTab === 'online' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-primary to-emerald-500'}`}>
                                        <div className="p-3.5 flex justify-between">
                                            {(offer.isNew || (offer.createdAt && new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) && (
                                                <span className="bg-white text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-md">NEW</span>
                                            )}
                                            <button className="h-7 w-7 bg-white/90 rounded-lg flex items-center justify-center ml-auto shadow-sm">
                                                <Heart className="h-3.5 w-3.5 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3.5">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{offer.merchantName || offer.brand || offer.title}</h4>
                                        <p className="text-sm text-primary font-medium mt-0.5">
                                            {offer.discountValue
                                                ? `${offer.type === 'percentage' ? offer.discountValue + '% OFF' : '₹' + offer.discountValue + ' OFF'}`
                                                : (offer.discount || offer.title)
                                            }
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
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
