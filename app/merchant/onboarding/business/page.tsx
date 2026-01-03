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
            phone: businessPhone, // Store phone
            category,
            subCategory,
            description,
            website,
            instagram,
            // Defaults for simplified flow
            merchantType: 'local_store', // Default to local/independent
            brandScale: 'single',        // Default to single
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-lg mx-auto min-h-screen">
                <div className="min-h-screen overflow-y-auto pt-6 pb-8 px-5">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/merchant/auth/signup">
                            <button className="h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900">Business Details</h1>
                            <p className="text-xs text-gray-500">Step 1 of 3</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                    </div>

                    {/* Form */}
                    <div className="space-y-6">

                        {/* ===== SECTION 1: BUSINESS TYPE ===== */}
                        <section>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type</label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setBusinessType('offline')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${businessType === 'offline'
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <Store className={`h-8 w-8 ${businessType === 'offline' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-semibold text-sm text-gray-900">Offline Store</span>
                                    <span className="text-[10px] text-gray-500">Physical location</span>
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setBusinessType('online')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${businessType === 'online'
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <Wifi className={`h-8 w-8 ${businessType === 'online' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-semibold text-sm text-gray-900">Online Brand</span>
                                    <span className="text-[10px] text-gray-500">E-commerce / Digital</span>
                                </motion.button>
                            </div>
                        </section>

                        {/* ===== SECTION 2: BUSINESS DETAILS ===== */}
                        <AnimatePresence>
                            {(businessType) && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Store className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Business Details
                                        </span>
                                    </div>

                                    {/* Business Name */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Business Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="e.g., Chai Point"
                                            className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30"
                                        />
                                    </div>

                                    {/* Owner Details */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Owner Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={ownerName}
                                                onChange={(e) => setOwnerName(e.target.value)}
                                                placeholder="Full name"
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Mobile *</label>
                                            <div className="flex gap-1 mt-1">
                                                <div className="flex items-center px-3 bg-gray-100 rounded-l-xl text-gray-600 font-medium text-sm border-r">
                                                    +91
                                                </div>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={ownerPhone}
                                                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="10 digits"
                                                    className="flex-1 h-12 bg-gray-50 rounded-r-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category *</label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                            >
                                                <option value="">Select</option>
                                                {Object.keys(CATEGORIES).map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub-Category *</label>
                                            <select
                                                value={subCategory}
                                                onChange={(e) => setSubCategory(e.target.value)}
                                                disabled={!category}
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50"
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
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Brief description of your business"
                                            rows={2}
                                            className="w-full bg-gray-50 rounded-xl px-4 py-3 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* ===== SECTION 3: LOCATION ===== */}
                        <AnimatePresence>
                            {(businessType === 'offline') && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Store Location
                                        </span>
                                    </div>

                                    {/* State & City */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State *</label>
                                            <select
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                            >
                                                <option value="">Select state</option>
                                                {INDIAN_STATES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City *</label>
                                            <select
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                disabled={!state}
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50"
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
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Area / Locality</label>
                                        <input
                                            type="text"
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            placeholder="e.g., Koramangala, Indiranagar"
                                            className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>

                                    {/* Full Address */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Address *</label>
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Shop no, building, street, landmark"
                                            className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>

                                    {/* Pincode & Store Phone */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode *</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={pincode}
                                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="560001"
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Phone</label>
                                            <input
                                                type="tel"
                                                value={businessPhone}
                                                onChange={(e) => setBusinessPhone(e.target.value)}
                                                placeholder="080-XXXXXXXX"
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </div>

                                    {/* Google Maps Link */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Maps Link</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={googleMapsLink}
                                                onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                                placeholder="Paste map location link"
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 pl-10 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 mt-0.5" />
                                            {extractingLocation && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        {extractedCoords && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Location detected successfully
                                            </div>
                                        )}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <div className="pt-4 pb-10">
                            <Button
                                onClick={handleContinue}
                                disabled={!isFormValid()}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                            >
                                Continue
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
