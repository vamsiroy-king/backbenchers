"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowRight, ArrowLeft, MapPin, Building2, Wifi, Store,
    Loader2, Search, ChevronDown, User, Phone,
    Instagram, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { extractCoordinatesFromGoogleMapsLink } from "@/lib/utils/maps";
import { INDIAN_STATES, CITIES_BY_STATE } from "@/lib/data/locations";

// Categories with subcategories
const CATEGORIES: { [key: string]: string[] } = {
    "Food & Beverages": ["Restaurant", "Cafe", "Fast Food", "Bakery", "Ice Cream", "Juice & Smoothies", "Street Food", "Fine Dining"],
    "Fashion & Apparel": ["Clothing", "Footwear", "Accessories", "Ethnic Wear", "Sportswear"],
    "Beauty & Wellness": ["Salon", "Spa", "Gym & Fitness", "Skincare", "Cosmetics"],
    "Entertainment": ["Gaming Zone", "Cinema", "Events", "Adventure Sports", "Bowling"],
    "Education": ["Coaching", "Library", "Stationery", "Book Store", "Online Courses"],
    "Electronics": ["Mobile Store", "Computer Shop", "Gadgets", "Repairs", "Accessories"],
    "Services": ["Laundry", "Printing", "Photography", "Travel Agency", "Home Services"],
};

export default function BusinessDetailsPage() {
    const router = useRouter();

    // Core form state
    const [businessType, setBusinessType] = useState<"" | "online" | "offline">("");

    // Business details
    const [businessName, setBusinessName] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [storePhone, setStorePhone] = useState("");
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");
    const [description, setDescription] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [instagram, setInstagram] = useState("");

    // Location details
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [address, setAddress] = useState("");
    const [pincode, setPincode] = useState("");
    const [googleMapsLink, setGoogleMapsLink] = useState("");
    const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [extractingLocation, setExtractingLocation] = useState(false);

    // Available cities based on selected state
    const availableCities = state ? (CITIES_BY_STATE[state] || []) : [];

    // Handle Google Maps link
    const handleGoogleMapsLinkChange = async (link: string) => {
        setGoogleMapsLink(link);
        setExtractedCoords(null);

        if (!link.trim()) return;

        const isShortLink = /goo\.gl|maps\.app/.test(link);

        if (isShortLink) {
            setExtractingLocation(true);
            try {
                const response = await fetch('/api/expand-maps-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: link }),
                });
                const data = await response.json();
                if (data.success && data.lat && data.lng) {
                    setExtractedCoords({ lat: data.lat, lng: data.lng });
                } else if (data.expandedUrl) {
                    const coords = extractCoordinatesFromGoogleMapsLink(data.expandedUrl);
                    if (coords) setExtractedCoords(coords);
                }
            } catch (error) {
                console.error('Error expanding URL:', error);
            } finally {
                setExtractingLocation(false);
            }
        } else {
            const coords = extractCoordinatesFromGoogleMapsLink(link);
            if (coords) setExtractedCoords(coords);
        }
    };

    // Reset city when state changes
    useEffect(() => {
        setCity("");
    }, [state]);

    // Reset subcategory when category changes
    useEffect(() => {
        setSubCategory("");
    }, [category]);


    // Form validation
    const isFormValid = (): boolean => {
        if (!businessType) return false;

        // Common validations
        const basicValid = (
            businessName.length > 2 &&
            ownerName.length > 1 &&
            ownerPhone.length === 10 &&
            storePhone.length === 10 &&
            category !== "" &&
            subCategory !== ""
        );

        if (businessType === 'online') {
            return basicValid;
        }

        // Offline store validations
        return (
            basicValid &&
            state !== "" &&
            city !== "" &&
            address.length > 5 &&
            pincode.length === 6
        );
    };

    // Handle form submission
    const handleContinue = () => {
        if (!isFormValid()) return;

        // Build business data
        const businessData: any = {
            businessType,
            businessName,
            ownerName,
            ownerPhone: `+91${ownerPhone}`,
            phone: `+91${storePhone}`,
            category,
            subCategory,
            description,
            website,
            instagram,
            merchantType: 'local_store',
            brandScale: 'single',
        };

        // Save business data
        localStorage.setItem('merchant_business', JSON.stringify(businessData));

        // Save location data
        localStorage.setItem('merchant_location', JSON.stringify({
            state,
            city,
            area,
            address,
            pincode,
            googleMapsLink,
            latitude: extractedCoords?.lat || null,
            longitude: extractedCoords?.lng || null,
        }));

        // Navigate to next step
        router.push("/merchant/onboarding/documents");
    };

    // District-style input classes
    const inputClass = "w-full h-12 bg-[#111] border border-[#333] rounded-xl px-4 text-white text-sm font-medium placeholder:text-[#555] outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all";
    const selectClass = "w-full h-12 bg-[#111] border border-[#333] rounded-xl px-4 text-white text-sm font-medium outline-none focus:border-green-500/50 appearance-none cursor-pointer disabled:opacity-40";
    const labelClass = "text-[11px] font-semibold text-[#888] uppercase tracking-wider";

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#222]">
                <div className="px-5 py-4 flex items-center gap-4">
                    <Link href="/merchant/auth/signup">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:bg-[#222] transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white">Business Details</h1>
                        <p className="text-xs text-[#666]">Step 1 of 3</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-4 flex gap-2">
                    <div className="h-1 flex-1 bg-green-500 rounded-full" />
                    <div className="h-1 flex-1 bg-[#222] rounded-full" />
                    <div className="h-1 flex-1 bg-[#222] rounded-full" />
                </div>
            </header>

            {/* Main Form */}
            <main className="px-5 py-6 pb-32">
                <div className="space-y-8">

                    {/* ===== SECTION 1: BUSINESS TYPE ===== */}
                    <section>
                        <p className={labelClass}>Business Type</p>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setBusinessType('offline')}
                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${businessType === 'offline'
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-[#333] bg-[#111] hover:border-[#444]'
                                    }`}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${businessType === 'offline' ? 'bg-green-500' : 'bg-[#1a1a1a]'}`}>
                                    <Store className={`h-6 w-6 ${businessType === 'offline' ? 'text-black' : 'text-[#666]'}`} />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold text-white text-sm block">Offline Store</span>
                                    <span className="text-[10px] text-[#666]">Physical location</span>
                                </div>
                            </motion.button>

                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setBusinessType('online')}
                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${businessType === 'online'
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-[#333] bg-[#111] hover:border-[#444]'
                                    }`}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${businessType === 'online' ? 'bg-green-500' : 'bg-[#1a1a1a]'}`}>
                                    <Wifi className={`h-6 w-6 ${businessType === 'online' ? 'text-black' : 'text-[#666]'}`} />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold text-white text-sm block">Online Brand</span>
                                    <span className="text-[10px] text-[#666]">E-commerce / Digital</span>
                                </div>
                            </motion.button>
                        </div>
                    </section>

                    {/* ===== SECTION 2: BUSINESS DETAILS ===== */}
                    <AnimatePresence>
                        {businessType && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-5"
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Store className="h-4 w-4 text-green-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">Business Details</span>
                                </div>

                                {/* Business Name */}
                                <div>
                                    <label className={labelClass}>Business Name *</label>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="e.g., Chai Point"
                                        className={`${inputClass} mt-2`}
                                    />
                                </div>

                                {/* Owner Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Owner Name *</label>
                                        <input
                                            type="text"
                                            value={ownerName}
                                            onChange={(e) => setOwnerName(e.target.value)}
                                            placeholder="Full name"
                                            className={`${inputClass} mt-2`}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Owner Mobile *</label>
                                        <div className="flex gap-0 mt-2">
                                            <div className="flex items-center px-3 bg-[#1a1a1a] border border-r-0 border-[#333] rounded-l-xl text-[#888] font-medium text-sm">
                                                +91
                                            </div>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                value={ownerPhone}
                                                onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                placeholder="10 digits"
                                                className="flex-1 h-12 bg-[#111] border border-[#333] rounded-r-xl px-3 text-white text-sm font-medium placeholder:text-[#555] outline-none focus:border-green-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Store Contact Number */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className={labelClass}>Store Contact Number *</label>
                                        <button
                                            type="button"
                                            onClick={() => setStorePhone(ownerPhone)}
                                            className="text-[10px] font-medium text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                                            disabled={!ownerPhone}
                                        >
                                            <Phone className="h-3 w-3" />
                                            Same as Owner
                                        </button>
                                    </div>
                                    <div className="flex gap-0 mt-2">
                                        <div className="flex items-center px-3 bg-[#1a1a1a] border border-r-0 border-[#333] rounded-l-xl text-[#888] font-medium text-sm">
                                            +91
                                        </div>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            value={storePhone}
                                            onChange={(e) => setStorePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="Store number for customers"
                                            className="flex-1 h-12 bg-[#111] border border-[#333] rounded-r-xl px-3 text-white text-sm font-medium placeholder:text-[#555] outline-none focus:border-green-500/50"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#555] mt-2">
                                        This will be displayed on your store profile for students to call.
                                    </p>
                                </div>

                                {/* Category */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Category *</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className={`${selectClass} mt-2`}
                                        >
                                            <option value="">Select</option>
                                            {Object.keys(CATEGORIES).map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sub-Category *</label>
                                        <select
                                            value={subCategory}
                                            onChange={(e) => setSubCategory(e.target.value)}
                                            disabled={!category}
                                            className={`${selectClass} mt-2`}
                                        >
                                            <option value="">Select</option>
                                            {category && CATEGORIES[category]?.map((sub) => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description of your business"
                                        rows={3}
                                        className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 mt-2 text-white text-sm placeholder:text-[#555] outline-none focus:border-green-500/50 resize-none"
                                    />
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* ===== SECTION 3: LOCATION ===== */}
                    <AnimatePresence>
                        {businessType === 'offline' && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-5"
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <MapPin className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-white">Store Location</span>
                                </div>

                                {/* State & City */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>State *</label>
                                        <select
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            className={`${selectClass} mt-2`}
                                        >
                                            <option value="">Select state</option>
                                            {INDIAN_STATES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>City *</label>
                                        <select
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={!state}
                                            className={`${selectClass} mt-2`}
                                        >
                                            <option value="">Select city</option>
                                            {availableCities.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Area/Locality */}
                                <div>
                                    <label className={labelClass}>Area / Locality</label>
                                    <input
                                        type="text"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        placeholder="e.g., Koramangala, Indiranagar"
                                        className={`${inputClass} mt-2`}
                                    />
                                </div>

                                {/* Full Address */}
                                <div>
                                    <label className={labelClass}>Full Address *</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Shop no, building, street, landmark"
                                        className={`${inputClass} mt-2`}
                                    />
                                </div>

                                {/* Pincode */}
                                <div>
                                    <label className={labelClass}>Pincode *</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="560001"
                                        className={`${inputClass} mt-2`}
                                    />
                                </div>

                                {/* Google Maps Link */}
                                <div>
                                    <label className={labelClass}>Google Maps Link</label>
                                    <div className="relative mt-2">
                                        <input
                                            type="text"
                                            value={googleMapsLink}
                                            onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                            placeholder="Paste map location link"
                                            className={`${inputClass} pl-10`}
                                        />
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#555]" />
                                        {extractingLocation && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                                            </div>
                                        )}
                                    </div>
                                    {extractedCoords && (
                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Location detected successfully
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    disabled={!isFormValid()}
                    className="w-full h-14 bg-green-500 hover:bg-green-400 disabled:bg-[#333] disabled:text-[#666] text-black font-bold rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:shadow-none"
                >
                    Continue
                    <ArrowRight className="h-5 w-5" />
                </motion.button>
            </div>
        </div>
    );
}
