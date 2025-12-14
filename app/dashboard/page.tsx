"use client";

import { Button } from "@/components/ui/button";
import { Heart, MapPin, Sparkles, X, ShieldCheck, Wifi, Bell, TrendingUp, Store, Loader2, ChevronDown, Search } from "lucide-react";
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

// Hero Banners
const HERO_BANNERS = [
    { id: 1, title: "Get 15% Student Discount!", cta: "Redeem Now", gradient: "from-orange-400 to-pink-500" },
    { id: 2, title: "Flash Sale: 50% Off Tech!", cta: "Shop Now", gradient: "from-blue-500 to-purple-600" },
    { id: 3, title: "Free Spotify Premium 3 Months", cta: "Claim", gradient: "from-green-400 to-emerald-600" },
];

// Categories - Core 4
const CATEGORIES = [
    { id: 1, name: "Food", emoji: "🍕", color: "bg-orange-500" },
    { id: 2, name: "Fashion", emoji: "👗", color: "bg-pink-500" },
    { id: 3, name: "Fitness", emoji: "💪", color: "bg-blue-600" },
    { id: 4, name: "Sports", emoji: "🏏", color: "bg-emerald-500" },
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
    ...CATEGORIES.map(c => ({ type: 'category', name: c.name, emoji: c.emoji, color: c.color })),
    ...TOP_BRANDS.map(b => ({ type: 'brand', name: b.name, emoji: b.emoji, discount: b.discount })),
    { type: 'offer', name: 'Spotify', emoji: '🎵', discount: 'Student Plan' },
    { type: 'offer', name: 'Netflix', emoji: '🎬', discount: '3 Months Free' },
    { type: 'location', name: 'Bengaluru', emoji: '📍', info: '45 offers' },
    { type: 'location', name: 'Mumbai', emoji: '📍', info: '32 offers' },
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
    const heroRef = useRef<HTMLDivElement>(null);

    // Real offers from database
    const [realOffers, setRealOffers] = useState<Offer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    // Trending offers from admin
    const [trendingOnline, setTrendingOnline] = useState<Offer[]>([]);
    const [trendingOffline, setTrendingOffline] = useState<Offer[]>([]);

    // Top brands from admin
    const [topBrandsData, setTopBrandsData] = useState<{ id: string; name: string; logo: string | null; category: string; discount?: string }[]>([]);

    // Check if student is verified (logged in with profile)
    const [isVerified, setIsVerified] = useState(false);
    const [studentId, setStudentId] = useState<string | null>(null);

    const unreadCount = NOTIFICATIONS.filter(n => n.isNew).length;

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

    // Auto-scroll hero
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % HERO_BANNERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (heroRef.current) {
            const width = heroRef.current.scrollWidth / HERO_BANNERS.length;
            heroRef.current.scrollTo({ left: width * heroIndex, behavior: 'smooth' });
        }
    }, [heroIndex]);

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

    const filteredItems = searchQuery.length > 0
        ? ALL_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-extrabold text-lg tracking-tight">Backbenchers</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* City Selector */}
                        <button
                            onClick={() => setShowCitySelector(true)}
                            className="flex items-center gap-1 px-3 h-9 rounded-full bg-gray-100 text-sm font-medium text-gray-700 active:scale-95 transition-transform"
                        >
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span className="max-w-20 truncate">{selectedCity || 'Select City'}</span>
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                        </button>
                        {/* Notifications */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center relative active:scale-95 transition-transform"
                        >
                            <Bell className="h-5 w-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="space-y-8 px-4 pt-6">
                {/* Hero */}
                <div>
                    <div ref={heroRef} className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                        {(heroBanners.length > 0 ? heroBanners : HERO_BANNERS.map(b => ({
                            id: String(b.id),
                            title: b.title,
                            subtitle: null,
                            ctaText: b.cta,
                            ctaLink: null,
                            backgroundGradient: b.gradient,
                        }))).map((banner) => (
                            <div
                                key={banner.id}
                                className={`snap-center flex-none w-[95%] h-40 rounded-3xl bg-gradient-to-r ${banner.backgroundGradient} p-6 flex flex-col justify-between shadow-lg relative overflow-hidden`}
                            >
                                <div>
                                    <h2 className="text-white text-2xl font-extrabold leading-tight">{banner.title}</h2>
                                    {banner.subtitle && (
                                        <p className="text-white/80 text-sm mt-1">{banner.subtitle}</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleOfferClick}
                                    className="bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full w-fit text-sm shadow-md active:scale-95 transition-transform"
                                >
                                    {banner.ctaText}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                        {(heroBanners.length > 0 ? heroBanners : HERO_BANNERS).map((_, i) => (
                            <button key={i} onClick={() => setHeroIndex(i)} className={`h-2 rounded-full transition-all ${i === heroIndex ? 'w-6 bg-gray-800' : 'w-2 bg-gray-300'}`} />
                        ))}
                    </div>
                </div>

                {/* Categories - 8px grid spacing */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-2xl"
                        >
                            🎯
                        </motion.div>
                        <h3 className="text-xl font-extrabold tracking-tight">Browse Categories</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {CATEGORIES.map((cat) => (
                            <Link key={cat.id} href={`/dashboard/category/${cat.name}`}>
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className={`aspect-square ${cat.color} rounded-2xl flex flex-col items-center justify-center shadow-lg cursor-pointer`}
                                >
                                    <span className="text-3xl mb-1">{cat.emoji}</span>
                                    <span className="text-white text-[10px] font-bold">{cat.name}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Trending Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <TrendingUp className="h-6 w-6 text-orange-500" />
                        </motion.div>
                        <h3 className="text-xl font-extrabold tracking-tight">Trending Offers</h3>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center">
                        <div className="inline-flex bg-gray-100 rounded-2xl p-1.5">
                            <button
                                onClick={() => setTrendingTab('online')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${trendingTab === 'online' ? 'bg-white text-black shadow-md' : 'text-gray-500'
                                    }`}
                            >
                                <Wifi className="h-4 w-4" />
                                Online
                            </button>
                            <button
                                onClick={() => setTrendingTab('offline')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${trendingTab === 'offline' ? 'bg-white text-black shadow-md' : 'text-gray-500'
                                    }`}
                            >
                                <MapPin className="h-4 w-4" />
                                Offline
                            </button>
                        </div>
                    </div>

                    {/* Offers */}
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x">
                        {currentOffers.map((offer: any) => (
                            <motion.div
                                key={offer.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!isVerified) {
                                        setShowVerifyModal(true);
                                    } else if (offer.merchantId) {
                                        // Navigate to merchant store page directly
                                        router.push(`/store/${offer.merchantId}`);
                                    }
                                }}
                                className="snap-start flex-none w-[280px] cursor-pointer"
                            >
                                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className={`h-32 ${trendingTab === 'online' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                                        <div className="p-4 flex justify-between">
                                            {(offer.isNew || (offer.createdAt && new Date(offer.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) && (
                                                <span className="bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full">NEW</span>
                                            )}
                                            <button className="h-8 w-8 bg-white/90 rounded-full flex items-center justify-center ml-auto shadow">
                                                <Heart className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-base">{offer.merchantName || offer.brand || offer.title}</h4>
                                        <p className="text-sm text-purple-600 font-semibold mt-1">
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

                {/* Top Brands */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Sparkles className="h-6 w-6 text-yellow-500" />
                        </motion.div>
                        <h3 className="text-xl font-extrabold tracking-tight">Top Brands</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {(topBrandsData.length > 0 ? topBrandsData : TOP_BRANDS.map(b => ({ id: String(b.id), name: b.name, logo: null, category: b.emoji, discount: b.discount }))).map((brand) => (
                            <motion.button
                                key={brand.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    if (!isVerified) {
                                        e.preventDefault();
                                        setShowVerifyModal(true);
                                    } else {
                                        router.push(`/store/${brand.id}`);
                                    }
                                }}
                                className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 shadow-md border border-gray-50 hover:shadow-lg transition-shadow"
                            >
                                <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                                    {brand.logo ? (
                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-6 w-6 text-gray-400" />
                                    )}
                                </div>
                                <span className="text-xs font-bold text-gray-900 text-center line-clamp-1">{brand.name}</span>
                                <span className="text-[10px] font-semibold text-purple-600">{brand.discount || brand.category}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* App Switcher */}
                <div className="pt-6 border-t border-gray-100 mt-8">
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-3">
                        <Link href="/merchant" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Merchant App
                        </Link>
                        <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Admin Panel
                        </Link>
                    </div>
                </div>
            </main >
        </div >
    );
}
