"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MapPin, Building2, Wifi, Store, Link2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { extractCoordinatesFromGoogleMapsLink, isGoogleMapsLink } from "@/lib/utils/maps";

// Categories with subcategories (only what we support)
const CATEGORIES = {
    "Food & Beverages": ["Restaurant", "Cafe", "Fast Food", "Bakery", "Ice Cream", "Juice & Smoothies"],
    "Fashion & Apparel": ["Clothing", "Footwear", "Accessories", "Ethnic Wear"],
    "Beauty & Wellness": ["Salon", "Spa", "Gym & Fitness", "Skincare"],
    "Entertainment": ["Gaming Zone", "Cinema", "Events", "Adventure Sports"],
    "Education": ["Coaching", "Library", "Stationery", "Book Store"],
    "Electronics": ["Mobile Store", "Computer Shop", "Gadgets", "Repairs"],
    "Services": ["Laundry", "Printing", "Photography", "Travel Agency"],
};

// Import locations from centralized file
import { INDIAN_STATES, CITIES_BY_STATE } from "@/lib/data/locations";


export default function BusinessDetailsPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        businessType: "" as "" | "online" | "offline",
        businessName: "",
        ownerName: "", // Owner's full name
        ownerPhone: "", // 10 digit owner mobile (distinct from business phone)
        category: "",
        subCategory: "",
        description: "",
        state: "",
        city: "",
        address: "",
        pincode: "",
        website: "",
        instagram: "",
        businessPhone: "",
        googleMapsLink: ""
    });

    // State for extracted coordinates
    const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [extractingLocation, setExtractingLocation] = useState(false);

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedBusiness = localStorage.getItem('merchant_business');
        const savedLocation = localStorage.getItem('merchant_location');

        if (savedBusiness) {
            try {
                const data = JSON.parse(savedBusiness);
                setFormData(prev => ({
                    ...prev,
                    businessType: data.businessType || prev.businessType,
                    businessName: data.businessName || prev.businessName,
                    ownerName: data.ownerName || prev.ownerName,
                    ownerPhone: data.ownerPhone?.replace('+91', '') || prev.ownerPhone,
                    category: data.category || prev.category,
                    subCategory: data.subCategory || prev.subCategory,
                    description: data.description || prev.description,
                    website: data.website || prev.website,
                    instagram: data.instagram || prev.instagram,
                    businessPhone: data.phone || data.businessPhone || prev.businessPhone,
                }));
            } catch (e) {
                console.error('Error loading saved business data:', e);
            }
        }

        if (savedLocation) {
            try {
                const data = JSON.parse(savedLocation);
                setFormData(prev => ({
                    ...prev,
                    state: data.state || prev.state,
                    city: data.city || prev.city,
                    address: data.address || prev.address,
                    pincode: data.pincode || prev.pincode,
                    googleMapsLink: data.googleMapsLink || prev.googleMapsLink,
                }));
                if (data.latitude && data.longitude) {
                    setExtractedCoords({ lat: data.latitude, lng: data.longitude });
                }
            } catch (e) {
                console.error('Error loading saved location data:', e);
            }
        }
    }, []);

    // Handle Google Maps link change - extract coordinates
    const handleGoogleMapsLinkChange = async (link: string) => {
        setFormData({ ...formData, googleMapsLink: link });
        setExtractedCoords(null);

        if (!link.trim()) return;

        // Check if it's a short link that needs server-side expansion
        const isShortLink = /goo\.gl|maps\.app/.test(link);

        if (isShortLink) {
            // Use API to expand short link
            setExtractingLocation(true);
            try {
                const response = await fetch('/api/maps/expand-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: link }),
                });
                const data = await response.json();
                if (data.success && data.latitude && data.longitude) {
                    setExtractedCoords({ lat: data.latitude, lng: data.longitude });
                }
            } catch (error) {
                console.error('Error expanding URL:', error);
            } finally {
                setExtractingLocation(false);
            }
        } else {
            // Try local extraction for full URLs
            const coords = extractCoordinatesFromGoogleMapsLink(link);
            if (coords) {
                setExtractedCoords(coords);
            }
        }
    };

    const availableCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];
    const availableSubCategories = formData.category ? (CATEGORIES[formData.category as keyof typeof CATEGORIES] || []) : [];

    // Auto-capitalize business name
    const handleBusinessNameChange = (value: string) => {
        const capitalized = value
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        setFormData({ ...formData, businessName: capitalized });
    };

    // Reset city when state changes
    useEffect(() => {
        if (formData.state) {
            setFormData(prev => ({ ...prev, city: "" }));
        }
    }, [formData.state]);

    // Reset subcategory when category changes
    useEffect(() => {
        if (formData.category) {
            setFormData(prev => ({ ...prev, subCategory: "" }));
        }
    }, [formData.category]);

    const isFormValid =
        formData.businessType &&
        formData.businessName.length > 2 &&
        formData.ownerPhone.length === 10 && // Owner phone is mandatory
        formData.category &&
        formData.subCategory &&
        (formData.businessType === 'online' || (formData.state && formData.city && formData.address.length > 5 && formData.pincode.length === 6));

    const handleContinue = () => {
        if (isFormValid) {
            // Save business data to localStorage for later
            localStorage.setItem('merchant_business', JSON.stringify({
                businessType: formData.businessType,
                businessName: formData.businessName,
                ownerName: formData.ownerName, // Owner's full name
                ownerPhone: `+91${formData.ownerPhone}`, // Full phone with country code
                category: formData.category,
                subCategory: formData.subCategory,
                description: formData.description,
                phone: formData.businessPhone, // Business phone (optional)
                website: formData.website,
                instagram: formData.instagram,
            }));

            // Save location data with coordinates (use extractedCoords which handles short links too)
            localStorage.setItem('merchant_location', JSON.stringify({
                state: formData.state,
                city: formData.city,
                address: formData.address,
                pincode: formData.pincode,
                googleMapsLink: formData.googleMapsLink,
                latitude: extractedCoords?.lat || null,
                longitude: extractedCoords?.lng || null,
            }));

            // If offline, go to location. If online, skip to documents
            if (formData.businessType === 'offline') {
                router.push("/merchant/onboarding/location");
            } else {
                router.push("/merchant/onboarding/documents");
            }
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-lg mx-auto min-h-screen">
                <div className="min-h-screen overflow-y-auto pt-6 pb-8 px-5 scrollbar-hide">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/merchant/auth/signup">
                            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-extrabold">Business Details</h1>
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
                    <div className="space-y-5">
                        {/* Business Type Selection */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type</label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFormData({ ...formData, businessType: 'offline' })}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.businessType === 'offline'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <Store className={`h-8 w-8 ${formData.businessType === 'offline' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-semibold text-sm">Offline Store</span>
                                    <span className="text-[10px] text-gray-500">Physical location</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFormData({ ...formData, businessType: 'online' })}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.businessType === 'online'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <Wifi className={`h-8 w-8 ${formData.businessType === 'online' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-semibold text-sm">Online Brand</span>
                                    <span className="text-[10px] text-gray-500">E-commerce / Digital</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Business Name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={(e) => handleBusinessNameChange(e.target.value)}
                                placeholder="Meghana Foods"
                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Owner Name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Name</label>
                            <input
                                type="text"
                                value={formData.ownerName}
                                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                placeholder="Your full name"
                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Owner Mobile Number */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Mobile Number</label>
                            <div className="flex gap-2 mt-1">
                                <div className="flex items-center px-4 bg-gray-200 rounded-xl text-gray-600 font-semibold text-sm">
                                    🇮🇳 +91
                                </div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={formData.ownerPhone}
                                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    placeholder="10 digit mobile"
                                    className="flex-1 h-12 bg-gray-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                ⚠️ Phone cannot be changed after registration
                            </p>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                            >
                                <option value="">Select category</option>
                                {Object.keys(CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sub Category */}
                        {formData.category && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub Category</label>
                                <select
                                    value={formData.subCategory}
                                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                >
                                    <option value="">Select sub-category</option>
                                    {availableSubCategories.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </motion.div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 500) })}
                                placeholder="Tell students about your business..."
                                rows={3}
                                className="w-full bg-gray-100 rounded-xl px-4 py-3 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            />
                            <p className="text-[10px] text-gray-400 text-right mt-1">{formData.description.length}/500</p>
                        </div>

                        {/* Location Section - Only for Offline */}
                        {formData.businessType === 'offline' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-4 border-t border-gray-100"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Store Location</p>
                                </div>

                                {/* State */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                    >
                                        <option value="">Select state</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* City */}
                                {formData.state && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                                        <select
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                        >
                                            <option value="">Select city</option>
                                            {availableCities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}

                                {/* Address & Pincode */}
                                {formData.city && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Address</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Street, building, landmark"
                                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</label>
                                                <input
                                                    type="text"
                                                    value={formData.pincode}
                                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                    placeholder="560001"
                                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={formData.businessPhone}
                                                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                                                    placeholder="080-12345678"
                                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Google Maps Link - For map location */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-3 w-3" />
                                                Google Maps Link
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.googleMapsLink}
                                                onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                                placeholder="Paste your Google Maps share link"
                                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            {formData.googleMapsLink && (
                                                <div className="mt-1 flex items-center gap-1">
                                                    {extractingLocation ? (
                                                        <span className="text-[10px] text-blue-500 font-medium">⏳ Detecting location...</span>
                                                    ) : extractedCoords ? (
                                                        <span className="text-[10px] text-green-600 font-medium">✓ Location detected ({extractedCoords.lat.toFixed(4)}, {extractedCoords.lng.toFixed(4)})</span>
                                                    ) : (
                                                        <span className="text-[10px] text-orange-500 font-medium">⚠ Couldn't extract location - try a different link</span>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Go to Google Maps → Search your store → Click Share → Copy link
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* Online Brand Links */}
                        {formData.businessType === 'online' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-4 border-t border-gray-100"
                            >
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online Presence</p>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website URL</label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://yourbrand.com"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instagram Handle</label>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder="@yourbrand"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Continue Button */}
                    <motion.div className="mt-8">
                        <Button
                            onClick={handleContinue}
                            disabled={!isFormValid}
                            className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base disabled:opacity-50"
                        >
                            {formData.businessType === 'offline' ? 'Continue to Location' : 'Continue to Photos'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
