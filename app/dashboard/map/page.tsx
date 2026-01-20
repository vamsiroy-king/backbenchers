"use client";

import { Button } from "@/components/ui/button";
import { Locate, Navigation, Layers, Coffee, Laptop, Shirt, Sparkles, Scissors, Dumbbell, Store, Loader2, X, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { authService } from "@/lib/services/auth.service";
import { Merchant, Offer } from "@/lib/types";
import { useRouter } from "next/navigation";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// Dynamically import LeafletMap (client-side only)
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#0a0a0b] flex flex-col items-center justify-center text-white/40 font-mono text-xs gap-3">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            LOADING MAP...
        </div>
    )
});

// Category configuration
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; emoji: string }> = {
    "All": { icon: Layers, color: "#9ca3af", emoji: "📍" },
    "Food": { icon: Coffee, color: "#ef4444", emoji: "🍕" },
    "Food & Beverages": { icon: Coffee, color: "#ef4444", emoji: "🍕" },
    "Restaurant": { icon: Coffee, color: "#ef4444", emoji: "🍽️" },
    "Coffee": { icon: Coffee, color: "#d97706", emoji: "☕" },
    "Grocery": { icon: Store, color: "#16a34a", emoji: "🛒" },
    "Tech": { icon: Laptop, color: "#3b82f6", emoji: "💻" },
    "Tech & Electronics": { icon: Laptop, color: "#3b82f6", emoji: "💻" },
    "Electronics": { icon: Laptop, color: "#3b82f6", emoji: "🔌" },
    "Fashion": { icon: Shirt, color: "#8b5cf6", emoji: "👗" },
    "Fashion & Lifestyle": { icon: Shirt, color: "#8b5cf6", emoji: "👗" },
    "Beauty": { icon: Sparkles, color: "#ec4899", emoji: "💄" },
    "Beauty & Wellness": { icon: Sparkles, color: "#ec4899", emoji: "💅" },
    "Services": { icon: Scissors, color: "#6366f1", emoji: "✂️" },
    "Fitness": { icon: Dumbbell, color: "#22c55e", emoji: "💪" },
    "Health & Fitness": { icon: Dumbbell, color: "#22c55e", emoji: "🏃" },
    "Sports": { icon: Dumbbell, color: "#14b8a6", emoji: "🏏" },
    "Entertainment": { icon: Layers, color: "#f97316", emoji: "🎬" },
    "Other": { icon: Store, color: "#6b7280", emoji: "🏪" },
};

const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
};

interface MerchantWithOffer {
    id: string;
    name: string;
    lat: number;
    lng: number;
    discount: string;
    type: string;
    category: string;
    logo?: string;
    address?: string;
    googleMapsLink?: string;
}

export default function MapPage() {
    const router = useRouter();
    // Remember if user has granted location before via localStorage
    const [sessionActive, setSessionActive] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mapLocationGranted') === 'true';
        }
        return false;
    });
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('mapLocationGranted') === 'true') {
            return 'granted';
        }
        return 'prompt';
    });
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [merchants, setMerchants] = useState<MerchantWithOffer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<MerchantWithOffer | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [viewState, setViewState] = useState({ latitude: 12.9716, longitude: 77.5946, zoom: 14 });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [isVerified, setIsVerified] = useState(false);

    // Category zoom feature - bounds to fit all stores in selected category
    const [fitBounds, setFitBounds] = useState<[[number, number], [number, number]] | null>(null);
    const [shouldFitBounds, setShouldFitBounds] = useState(false);

    // Initial Verification Check
    useEffect(() => {
        authService.getCurrentUser().then(user => {
            setIsVerified(!!(user?.role === 'student' && user?.isComplete));
        });
    }, []);

    // Auto-start location if returning user (previously granted)
    useEffect(() => {
        if (sessionActive && permissionStatus === 'granted') {
            // User has returned, auto-start location tracking
            if ("geolocation" in navigator) {
                const geoOptions: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation([latitude, longitude]);
                        // Do NOT zoom to user - keep city view
                        // setViewState({ latitude, longitude, zoom: 15 });
                    },
                    () => {
                        // Fall back to default location
                        setUserLocation([12.9716, 77.5946]);
                    },
                    geoOptions
                );
                navigator.geolocation.watchPosition(
                    (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                    (err) => console.warn(err),
                    geoOptions
                );
            } else {
                setUserLocation([12.9716, 77.5946]);
            }
            // Fetch merchants immediately
            fetchMerchants();
        }
    }, []);

    // Data Fetching Logic (Unified)
    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const [mapResult, offersResult] = await Promise.all([
                merchantService.getForMap(),
                offerService.getActiveOffers()
            ]);

            const merchantMap = new Map<string, MerchantWithOffer>();
            const categorySet = new Set<string>(["All"]);
            const coordsMap = new Map<string, { lat: number; lng: number; logo?: string; googleMapsLink?: string }>();

            // Map Coordinates
            if (mapResult.success && mapResult.data) {
                mapResult.data.forEach(m => {
                    coordsMap.set(m.id, { lat: m.latitude, lng: m.longitude, logo: m.logo, googleMapsLink: m.googleMapsLink });
                    categorySet.add(m.category || "Other");
                });
            }

            // Process Offers
            if (offersResult.success && offersResult.data) {
                offersResult.data.forEach(offer => {
                    if (!offer.merchantId) return;
                    const coords = coordsMap.get(offer.merchantId);
                    if (!coords) return;

                    const category = offer.merchantCategory || "Other";
                    categorySet.add(category);

                    if (!merchantMap.has(offer.merchantId)) {
                        merchantMap.set(offer.merchantId, {
                            id: offer.merchantId,
                            name: offer.merchantName || offer.title,
                            lat: coords.lat,
                            lng: coords.lng,
                            discount: offer.type === 'percentage' ? `${offer.discountValue}% OFF` :
                                offer.type === 'flat' ? `₹${offer.discountValue} OFF` :
                                    `${offer.discountValue}% OFF`,
                            type: category,
                            category: category,
                            logo: coords.logo || offer.merchantLogo,
                            googleMapsLink: coords.googleMapsLink,
                        });
                    }
                });
            }

            // Add Stores without Offers
            if (mapResult.success && mapResult.data) {
                mapResult.data.forEach(m => {
                    if (!merchantMap.has(m.id)) {
                        merchantMap.set(m.id, {
                            id: m.id,
                            name: m.businessName,
                            lat: m.latitude,
                            lng: m.longitude,
                            discount: "Store",
                            type: m.category || "Other",
                            category: m.category || "Other",
                            logo: m.logo,
                            googleMapsLink: m.googleMapsLink,
                        });
                    }
                });
            }

            setMerchants(Array.from(merchantMap.values()));
            setCategories(Array.from(categorySet));

            // Initial City-Wide View: Zoom to fit ALL merchants
            const allMerchants = Array.from(merchantMap.values());
            if (allMerchants.length > 0) {
                let minLat = Infinity, maxLat = -Infinity;
                let minLng = Infinity, maxLng = -Infinity;

                allMerchants.forEach(m => {
                    minLat = Math.min(minLat, m.lat);
                    maxLat = Math.max(maxLat, m.lat);
                    minLng = Math.min(minLng, m.lng);
                    maxLng = Math.max(maxLng, m.lng);
                });

                // Add padding
                const latPadding = (maxLat - minLat) * 0.1;
                const lngPadding = (maxLng - minLng) * 0.1;

                setFitBounds([
                    [minLat - latPadding, minLng - lngPadding],
                    [maxLat + latPadding, maxLng + lngPadding]
                ]);
                setShouldFitBounds(true);
            }

        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTracking = () => {
        vibrate('medium');
        setSessionActive(true);
        // Remember that location has been granted
        localStorage.setItem('mapLocationGranted', 'true');

        if (!("geolocation" in navigator)) {
            setUserLocation([12.9716, 77.5946]);
            setPermissionStatus('granted');
            fetchMerchants();
            return;
        }

        const geoOptions: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                setPermissionStatus('granted');
            },
            () => {
                setUserLocation([12.9716, 77.5946]);
                setPermissionStatus('granted');
            },
            geoOptions
        );

        navigator.geolocation.watchPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.warn(err),
            geoOptions
        );
    };

    useEffect(() => {
        if (permissionStatus === 'granted') fetchMerchants();
    }, [permissionStatus]);

    const openGoogleMaps = () => {
        vibrate('light');
        if (!selectedOffer) return;
        const url = selectedOffer.googleMapsLink ||
            (userLocation
                ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${selectedOffer.lat},${selectedOffer.lng}&travelmode=walking`
                : `https://www.google.com/maps/search/?api=1&query=${selectedOffer.lat},${selectedOffer.lng}`);
        window.open(url, '_blank');
    };

    const filteredMerchants = selectedCategory === "All"
        ? merchants
        : merchants.filter(m => m.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    // Calculate bounds for all merchants in a category - zoom to fit all stores
    const calculateBoundsForCategory = (category: string) => {
        const filtered = category === "All"
            ? merchants
            : merchants.filter(m => m.category.toLowerCase().includes(category.toLowerCase()));

        if (filtered.length === 0) return null;
        if (filtered.length === 1) {
            // Single store - just center on it
            return null;
        }

        // Calculate bounding box
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        filtered.forEach(m => {
            minLat = Math.min(minLat, m.lat);
            maxLat = Math.max(maxLat, m.lat);
            minLng = Math.min(minLng, m.lng);
            maxLng = Math.max(maxLng, m.lng);
        });

        // Add small padding
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;

        return [
            [minLat - latPadding, minLng - lngPadding],
            [maxLat + latPadding, maxLng + lngPadding]
        ] as [[number, number], [number, number]];
    };

    const FILTERS = categories.map(cat => {
        const config = getCategoryConfig(cat);
        return { id: cat, ...config };
    });

    // 1. Dark Start Screen
    if (!sessionActive) {
        return (
            <div className="absolute inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center p-8 space-y-8 z-50 text-center">
                <div className="relative h-28 w-28 flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse delay-75" />
                    <MapPin className="h-12 w-12 text-green-500 relative z-10 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Live Map</h1>
                    <p className="text-white/50 text-base max-w-[260px] mx-auto leading-relaxed">
                        Enable location to find exclusive student deals near you.
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={startTracking}
                    className="w-full max-w-xs h-14 rounded-2xl font-bold bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 text-lg hover:scale-105 transition-all"
                >
                    <Navigation className="w-5 h-5 fill-current" />
                    Enable Location
                </motion.button>
            </div>
        )
    }

    // 2. Loading Screen
    if (loading && merchants.length === 0) {
        return (
            <div className="absolute inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center p-8 z-50">
                <Loader2 className="h-10 w-10 animate-spin text-green-500 mb-4" />
                <p className="text-white/60 font-medium animate-pulse">Scanning area...</p>
            </div>
        )
    }

    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-[#0a0a0b] overflow-hidden">

            {/* Status Pill */}
            <div className="absolute top-6 left-0 right-0 z-[400] flex justify-center pointer-events-none">
                <div className="bg-[#0a0a0b]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </div>
                    <span className="font-mono text-[11px] text-white font-bold tracking-wider uppercase">
                        {filteredMerchants.length} Active Spots {selectedCategory !== "All" && `• ${selectedCategory}`}
                    </span>
                </div>
            </div>

            <LeafletMap
                userLocation={userLocation}
                merchants={filteredMerchants.map(m => ({
                    id: m.id,
                    businessName: m.name,
                    category: m.category,
                    logo: m.logo,
                    latitude: m.lat,
                    longitude: m.lng,
                    discount: m.discount
                }))}
                onMerchantClick={(merchant) => {
                    vibrate('light');
                    const offer = filteredMerchants.find(m => m.id === merchant.id);
                    if (offer) setSelectedOffer(offer);
                }}
                center={userLocation || [viewState.latitude, viewState.longitude]}
                zoom={viewState.zoom}
                selectedCategory={selectedCategory}
                fitBounds={fitBounds}
                shouldFitBounds={shouldFitBounds}
                onBoundsApplied={() => setShouldFitBounds(false)}
            />

            {/* Floating Filter Menu */}
            <div className="absolute right-4 bottom-32 z-[400] flex flex-col-reverse items-end gap-4 pointer-events-auto">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        vibrate('light');
                        setIsFilterMenuOpen(!isFilterMenuOpen);
                    }}
                    className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-20 border border-white/10",
                        isFilterMenuOpen ? "bg-white text-black" : "bg-[#0a0a0b]/90 text-white backdrop-blur-xl"
                    )}
                >
                    {isFilterMenuOpen ? <X className="h-6 w-6" /> : (
                        (() => {
                            const ActiveIcon = FILTERS.find(f => f.id === selectedCategory)?.icon || Layers;
                            return <ActiveIcon className="h-6 w-6" />
                        })()
                    )}
                </motion.button>

                <AnimatePresence>
                    {isFilterMenuOpen && (
                        <div className="flex flex-col-reverse gap-3 items-end mb-2">
                            {FILTERS.map((cat, i) => {
                                if (cat.id === selectedCategory && !isFilterMenuOpen) return null;
                                const Icon = cat.icon;
                                const isSelected = selectedCategory === cat.id;

                                return (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className={cn(
                                            "text-[12px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-xl shadow-lg border",
                                            isSelected
                                                ? "bg-white text-black border-white"
                                                : "bg-black/60 text-white border-white/10"
                                        )}>
                                            {cat.emoji} {cat.id}
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                vibrate('medium');
                                                setSelectedCategory(cat.id);
                                                setSelectedOffer(null);
                                                setIsFilterMenuOpen(false);

                                                // Calculate bounds for this category and trigger zoom
                                                const bounds = calculateBoundsForCategory(cat.id);
                                                if (bounds) {
                                                    setFitBounds(bounds);
                                                    setShouldFitBounds(true);
                                                } else {
                                                    // Single store or no stores - just zoom out a bit
                                                    setViewState(prev => ({ ...prev, zoom: 13 }));
                                                }
                                            }}
                                            className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all border",
                                                isSelected
                                                    ? "bg-white text-black border-white"
                                                    : "bg-black/80 text-white/80 border-white/10"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </motion.button>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Merchant Detail Sheet - Glassmorphism */}
            <AnimatePresence>
                {selectedOffer && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) setSelectedOffer(null);
                        }}
                        className="absolute bottom-0 left-0 right-0 z-[500] p-4 pb-8"
                    >
                        <div className="bg-[#121212]/95 backdrop-blur-2xl rounded-[32px] p-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
                            {/* Drag Indicator */}
                            <div className="w-full h-6 flex items-center justify-center">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            <div className="px-5 pb-5">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                                            {selectedOffer.logo ? (
                                                <img src={selectedOffer.logo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Store className="w-6 h-6 text-white/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="text-xl font-bold text-white">{selectedOffer.name}</h2>
                                                {selectedOffer.discount && (
                                                    <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                                                        {selectedOffer.discount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/40 text-sm font-medium">{selectedOffer.type} • {selectedOffer.category}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOffer(null)}
                                        className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        className="flex-1 bg-white text-black font-bold h-14 rounded-2xl flex items-center justify-center gap-2"
                                        onClick={() => {
                                            vibrate('light');
                                            router.push(isVerified ? `/store/${selectedOffer.id}` : '/signup');
                                        }}
                                    >
                                        <Store className="w-4 h-4" />
                                        View Store
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        className="flex-1 bg-white/10 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 border border-white/5 hover:bg-white/15 transition-colors"
                                        onClick={openGoogleMaps}
                                    >
                                        <Navigation className="w-4 h-4" />
                                        Directions
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
