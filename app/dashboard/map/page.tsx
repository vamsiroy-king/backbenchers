"use client";

import { Button } from "@/components/ui/button";
import { Locate, Navigation, Layers, Coffee, Laptop, Shirt, BookOpen, X, Store, Loader2, Sparkles, Scissors, Dumbbell } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { Merchant, Offer } from "@/lib/types";

// Dynamically import LeafletMap (client-side only)
const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 font-mono text-xs">LOADING MAP...</div>
});

// Category icons mapping
const CATEGORY_ICONS: Record<string, any> = {
    "All": Layers,
    "Food": Coffee,
    "Food & Beverages": Coffee,
    "Restaurant": Coffee,
    "Coffee": Coffee,
    "Grocery": Coffee,
    "Tech": Laptop,
    "Tech & Electronics": Laptop,
    "Electronics": Laptop,
    "Fashion": Shirt,
    "Fashion & Lifestyle": Shirt,
    "Beauty": Sparkles,
    "Beauty & Wellness": Sparkles,
    "Services": Scissors,
    "Fitness": Dumbbell,
    "Health & Fitness": Dumbbell,
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
    const [sessionActive, setSessionActive] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [merchants, setMerchants] = useState<MerchantWithOffer[]>([]);
    const [selectedOffer, setSelectedOffer] = useState<MerchantWithOffer | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [viewState, setViewState] = useState({ latitude: 12.9716, longitude: 77.5946, zoom: 14 });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>(["All"]);

    // Fetch real merchants with offers and coordinates
    const fetchMerchants = async () => {
        setLoading(true);
        try {
            // First get merchants with real coordinates
            const mapResult = await merchantService.getForMap();
            const offersResult = await offerService.getActiveOffers();

            const merchantMap = new Map<string, MerchantWithOffer>();
            const categorySet = new Set<string>(["All"]);

            // Create a map of merchant coordinates and links
            const coordsMap = new Map<string, { lat: number; lng: number; logo?: string; googleMapsLink?: string }>();
            if (mapResult.success && mapResult.data) {
                for (const m of mapResult.data) {
                    coordsMap.set(m.id, { lat: m.latitude, lng: m.longitude, logo: m.logo, googleMapsLink: m.googleMapsLink });
                    categorySet.add(m.category || "Other");
                }
            }

            // Match offers with merchant coordinates
            if (offersResult.success && offersResult.data) {
                for (const offer of offersResult.data) {
                    if (!offer.merchantId) continue;

                    const coords = coordsMap.get(offer.merchantId);
                    if (!coords) continue; // Skip merchants without coordinates

                    const category = offer.merchantCategory || "Other";
                    categorySet.add(category);

                    if (!merchantMap.has(offer.merchantId)) {
                        merchantMap.set(offer.merchantId, {
                            id: offer.merchantId,
                            name: offer.merchantName || offer.title,
                            lat: coords.lat,
                            lng: coords.lng,
                            discount: offer.type === 'percentage'
                                ? `${offer.discountValue}% OFF`
                                : offer.type === 'flat'
                                    ? `₹${offer.discountValue} OFF`
                                    : offer.type === 'bogo'
                                        ? 'BOGO'
                                        : `${offer.discountValue}% OFF`,
                            type: category,
                            category: category,
                            logo: coords.logo || offer.merchantLogo,
                            googleMapsLink: coords.googleMapsLink,
                        });
                    }
                }
            }

            // Also add merchants with coords but no active offers
            if (mapResult.success && mapResult.data) {
                for (const m of mapResult.data) {
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
                }
            }

            setMerchants(Array.from(merchantMap.values()));
            setCategories(Array.from(categorySet));
        } catch (error) {
            console.error('Error fetching merchants:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTracking = () => {
        setSessionActive(true);
        if (!("geolocation" in navigator)) {
            // Fallback to Bengaluru if no geolocation
            setUserLocation([12.9716, 77.5946]);
            setPermissionStatus('granted');
            fetchMerchants();
            return;
        }

        // Options for high accuracy real-time location
        const geoOptions: PositionOptions = {
            enableHighAccuracy: true,  // Use GPS if available
            timeout: 10000,            // 10 second timeout
            maximumAge: 0              // Don't use cached location
        };

        // First get a quick position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                setViewState({ latitude, longitude, zoom: 15 });
                setPermissionStatus('granted');
            },
            (error) => {
                console.warn("Location access denied or unavailable, using default location:", error.message || error);
                // Still allow map with default location (Bengaluru)
                setUserLocation([12.9716, 77.5946]);
                setPermissionStatus('granted');
            },
            geoOptions
        );

        // Watch for location changes (live tracking)
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log(`Location updated: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
                setUserLocation([latitude, longitude]);
            },
            (error) => {
                console.warn("Watch position error:", error.message);
            },
            geoOptions
        );
    };

    // Fetch merchants when location is set
    useEffect(() => {
        if (permissionStatus === 'granted') {
            fetchMerchants();
        }
    }, [permissionStatus, userLocation]);

    const openGoogleMaps = () => {
        if (!selectedOffer) return;

        // If merchant has a stored Google Maps link, use it directly
        if (selectedOffer.googleMapsLink) {
            window.open(selectedOffer.googleMapsLink, '_blank');
            return;
        }

        // Fallback: construct directions URL from coordinates
        if (userLocation) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${selectedOffer.lat},${selectedOffer.lng}&travelmode=walking`;
            window.open(url, '_blank');
        } else {
            const url = `https://www.google.com/maps/search/?api=1&query=${selectedOffer.lat},${selectedOffer.lng}`;
            window.open(url, '_blank');
        }
    };

    // Filter merchants by category
    const filteredMerchants = selectedCategory === "All"
        ? merchants
        : merchants.filter(m => m.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    // Build dynamic filters from actual categories
    const FILTERS = categories.map(cat => ({
        id: cat,
        icon: CATEGORY_ICONS[cat] || Layers
    }));

    // 1. Explicit Start Screen (Light Theme)
    if (!sessionActive) {
        return (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 space-y-8 z-50 text-center">
                <div className="relative h-24 w-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping" />
                    <Locate className="h-10 w-10 text-blue-500 relative z-10" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Realtime Map</h1>
                    <p className="text-gray-500 text-sm max-w-[240px] mx-auto">
                        Active GPS helps us find student perks within walking distance of you.
                    </p>
                </div>
                <Button onClick={startTracking} className="w-full max-w-xs h-12 rounded-full font-bold shadow-xl shadow-blue-500/20 text-white bg-black">
                    Enable Location
                </Button>
            </div>
        )
    }

    // 2. Loading state
    if (loading && merchants.length === 0) {
        return (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500">Finding nearby stores...</p>
            </div>
        )
    }

    return (
        // Crucial: Fixed height container to ensure MapGL renders
        <div className="absolute inset-0 w-full h-full bg-gray-100 overflow-hidden text-black">

            {/* Top Status (Light) */}
            <div className="absolute top-12 left-0 right-0 z-30 flex justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-[10px] text-gray-800 font-bold tracking-tight">
                        GPS ACTIVE • {filteredMerchants.length} STORES {selectedCategory !== "All" && `(${selectedCategory})`}
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
                    const offer = filteredMerchants.find(m => m.id === merchant.id);
                    if (offer) {
                        setSelectedOffer(offer);
                        setViewState(prev => ({ ...prev, latitude: offer.lat, longitude: offer.lng }));
                    }
                }}
                center={userLocation || [viewState.latitude, viewState.longitude]}
                zoom={viewState.zoom}
            />

            {/* Expandable Filter Speed Dial */}
            <div className="absolute right-4 bottom-28 z-[400] flex flex-col-reverse items-end gap-3 pointer-events-auto">
                {/* Main Toggle Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-all z-20 ${isFilterMenuOpen ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                    {isFilterMenuOpen ? <X className="h-5 w-5" /> : (
                        // Show active category icon or default Layers
                        (() => {
                            const ActiveIcon = FILTERS.find(f => f.id === selectedCategory)?.icon || Layers;
                            return <ActiveIcon className="h-5 w-5" />
                        })()
                    )}
                </motion.button>

                {/* Expanded Options */}
                <AnimatePresence>
                    {isFilterMenuOpen && (
                        <div className="flex flex-col-reverse gap-3 items-end mb-2">
                            {FILTERS.map((cat) => {
                                if (cat.id === selectedCategory && !isFilterMenuOpen) return null;

                                const Icon = cat.icon;
                                const isSelected = selectedCategory === cat.id;

                                return (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="text-[10px] font-bold bg-white/90 text-black px-2 py-1 rounded-md backdrop-blur-md shadow-sm border border-gray-100">
                                            {cat.id}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setSelectedOffer(null);
                                                setIsFilterMenuOpen(false); // Auto close
                                            }}
                                            className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg border transition-all ${isSelected
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detail Sheet */}
            <AnimatePresence>
                {selectedOffer && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="absolute bottom-6 left-4 right-4 z-[500]"
                    >
                        <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {selectedOffer.logo && (
                                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100">
                                            <img src={selectedOffer.logo} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-blue-600 mb-1 bg-blue-50 inline-block px-1 rounded">
                                            NEARBY
                                        </p>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedOffer.name}</h2>
                                        <p className="text-gray-500 text-xs mt-1 font-medium">{selectedOffer.type} • {selectedOffer.discount}</p>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2 -mt-2 text-gray-400" onClick={() => setSelectedOffer(null)}>
                                    ✕
                                </Button>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <Link href={`/store/${selectedOffer.id}`} className="flex-1">
                                    <Button className="w-full bg-primary text-white font-bold h-12 rounded-xl">
                                        <Store className="mr-2 h-4 w-4" /> View Store
                                    </Button>
                                </Link>
                                <Button className="flex-1 bg-gray-900 text-white font-bold h-12 rounded-xl" onClick={openGoogleMaps}>
                                    <Navigation className="mr-2 h-4 w-4" /> Directions
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No stores message */}
            {!loading && filteredMerchants.length === 0 && (
                <div className="absolute bottom-32 left-4 right-4 z-[400]">
                    <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
                        <p className="text-gray-500 text-sm">No stores found {selectedCategory !== "All" && `in ${selectedCategory}`}</p>
                        <p className="text-xs text-gray-400 mt-1">Try selecting "All" categories</p>
                    </div>
                </div>
            )}
        </div>
    );
}
