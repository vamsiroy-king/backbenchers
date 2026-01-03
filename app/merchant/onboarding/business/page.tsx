"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowRight, ArrowLeft, MapPin, Building2, Wifi, Store,
    Loader2, Search, ChevronDown, User, Phone, Clock, Globe,
    Instagram, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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

// Brand interface
interface Brand {
    id: string;
    name: string;
    slug: string;
    category: string;
    logo_url: string | null;
    total_outlets: number;
}

export default function BusinessDetailsPage() {
    const router = useRouter();

    // Core form state
    const [businessType, setBusinessType] = useState<"" | "online" | "offline">("");
    const [brandScale, setBrandScale] = useState<"" | "single" | "regional_chain" | "national_chain">("");

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

    // Outlet details (for chains)
    const [outletName, setOutletName] = useState("");
    const [outletRole, setOutletRole] = useState<"" | "manager" | "franchise_owner" | "owner">("");
    const [outletManagerName, setOutletManagerName] = useState("");
    const [outletManagerPhone, setOutletManagerPhone] = useState("");
    const [outletPhone, setOutletPhone] = useState("");

    // Brand selection (for national chains)
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [brandSearchQuery, setBrandSearchQuery] = useState("");

    // Fetch brands for national chains
    useEffect(() => {
        if (brandScale === 'national_chain') {
            fetchBrands();
        }
    }, [brandScale]);

    const fetchBrands = async () => {
        setLoadingBrands(true);
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name, slug, category, logo_url, total_outlets')
                .eq('is_active', true)
                .eq('is_available_for_onboarding', true)
                .order('name');

            if (error) throw error;
            setAvailableBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoadingBrands(false);
        }
    };

    // Filter brands by search
    const filteredBrands = availableBrands.filter(brand =>
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
    );

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

    // Pre-fill outlet name when brand is selected
    useEffect(() => {
        if (selectedBrand && brandScale === 'national_chain') {
            setOutletName(`${selectedBrand.name} - `);
            if (selectedBrand.category) {
                setCategory(selectedBrand.category);
            }
        }
    }, [selectedBrand, brandScale]);

    // Form validation based on brand scale
    const isFormValid = (): boolean => {
        // Common validations
        if (!businessType) return false;
        if (businessType === 'offline' && !brandScale) return false;

        if (businessType === 'online') {
            return businessName.length > 2 && ownerPhone.length === 10 && category !== "" && subCategory !== "";
        }

        // Offline store validations
        if (brandScale === 'single') {
            // Single store: full details + location
            return (
                businessName.length > 2 &&
                ownerName.length > 1 &&
                ownerPhone.length === 10 &&
                category !== "" &&
                subCategory !== "" &&
                state !== "" &&
                city !== "" &&
                address.length > 5 &&
                pincode.length === 6
            );
        }

        if (brandScale === 'regional_chain') {
            // Regional chain: brand details + outlet details
            return (
                businessName.length > 2 && // Brand name
                ownerName.length > 1 &&
                ownerPhone.length === 10 &&
                category !== "" &&
                subCategory !== "" &&
                city !== "" && // Base city
                state !== "" &&
                outletName.length > 2 &&
                address.length > 5 &&
                pincode.length === 6 &&
                (outletManagerPhone.length === 10 || ownerPhone.length === 10)
            );
        }

        if (brandScale === 'national_chain') {
            // National chain: select brand + outlet details
            return (
                selectedBrand !== null &&
                outletName.length > 2 &&
                outletRole !== "" &&
                state !== "" &&
                city !== "" &&
                address.length > 5 &&
                pincode.length === 6 &&
                (outletManagerPhone.length === 10 || ownerPhone.length === 10)
            );
        }

        return false;
    };

    // Handle form submission
    const handleContinue = () => {
        if (!isFormValid()) return;

        // Determine merchant type
        const merchantType = brandScale === 'single' ? 'local_store' : 'chain_outlet';

        // Build business data
        const businessData: any = {
            businessType,
            brandScale,
            merchantType,
            category,
            subCategory,
            description,
            website,
            instagram,
        };

        // Add fields based on brand scale
        if (brandScale === 'single') {
            businessData.businessName = businessName;
            businessData.ownerName = ownerName;
            businessData.ownerPhone = `+91${ownerPhone}`;
            businessData.phone = businessPhone;
        } else if (brandScale === 'regional_chain') {
            businessData.businessName = businessName; // Brand name for regional
            businessData.ownerName = ownerName;
            businessData.ownerPhone = `+91${ownerPhone}`;
            businessData.outletName = outletName;
            businessData.baseCity = city;
            businessData.baseState = state;
            businessData.outletManagerName = outletManagerName || ownerName;
            businessData.outletManagerPhone = outletManagerPhone ? `+91${outletManagerPhone}` : `+91${ownerPhone}`;
            businessData.phone = outletPhone || businessPhone;
        } else if (brandScale === 'national_chain') {
            businessData.brandId = selectedBrand?.id;
            businessData.brandName = selectedBrand?.name;
            businessData.businessName = selectedBrand?.name || '';
            businessData.outletName = outletName;
            businessData.outletRole = outletRole;
            businessData.outletManagerName = outletManagerName || ownerName;
            businessData.outletManagerPhone = outletManagerPhone ? `+91${outletManagerPhone}` : `+91${ownerPhone}`;
            businessData.ownerName = outletManagerName || ownerName;
            businessData.ownerPhone = outletManagerPhone ? `+91${outletManagerPhone}` : `+91${ownerPhone}`;
            businessData.phone = outletPhone;
        }

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

                        {/* ===== SECTION 2: BRAND SCALE (Offline only) ===== */}
                        <AnimatePresence>
                            {businessType === 'offline' && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand Scale</label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {[
                                            { id: 'single', icon: '🏪', label: 'Single Store', desc: 'Just 1 location' },
                                            { id: 'regional_chain', icon: '🏬', label: 'Regional Chain', desc: 'Few cities' },
                                            { id: 'national_chain', icon: '🏢', label: 'National Chain', desc: 'Pan-India' },
                                        ].map((scale) => (
                                            <motion.button
                                                key={scale.id}
                                                type="button"
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setBrandScale(scale.id as any)}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${brandScale === scale.id
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className={`text-2xl ${brandScale === scale.id ? '' : 'grayscale opacity-60'}`}>{scale.icon}</span>
                                                <span className="font-semibold text-xs text-gray-900">{scale.label}</span>
                                                <span className="text-[9px] text-gray-500 text-center">{scale.desc}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* ===== SECTION 3: NATIONAL CHAIN - BRAND SELECTION ===== */}
                        <AnimatePresence>
                            {brandScale === 'national_chain' && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-blue-50 rounded-2xl p-4 border border-blue-100"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="h-4 w-4 text-blue-600" />
                                        <label className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Select Your Brand</label>
                                    </div>

                                    {loadingBrands ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                            <span className="ml-2 text-sm text-blue-700">Loading brands...</span>
                                        </div>
                                    ) : availableBrands.length === 0 ? (
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-amber-800 font-medium">No brands available</p>
                                                    <p className="text-xs text-amber-700 mt-1">
                                                        Contact <a href="mailto:brands@backbenchers.com" className="underline">brands@backbenchers.com</a> to register your brand.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                                                className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all bg-white ${selectedBrand ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                {selectedBrand ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            {selectedBrand.logo_url ? (
                                                                <img src={selectedBrand.logo_url} alt="" className="h-6 w-6 object-contain" />
                                                            ) : (
                                                                <Building2 className="h-5 w-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-semibold text-gray-900">{selectedBrand.name}</p>
                                                            <p className="text-xs text-gray-500">{selectedBrand.total_outlets} outlets</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Choose your brand...</span>
                                                )}
                                                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {showBrandDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="absolute z-20 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-hidden"
                                                >
                                                    <div className="p-2 border-b border-gray-100">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={brandSearchQuery}
                                                                onChange={(e) => setBrandSearchQuery(e.target.value)}
                                                                placeholder="Search brands..."
                                                                className="w-full h-9 bg-gray-50 rounded-lg pl-9 pr-3 text-sm outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {filteredBrands.map((brand) => (
                                                            <button
                                                                key={brand.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedBrand(brand);
                                                                    setShowBrandDropdown(false);
                                                                    setBrandSearchQuery("");
                                                                }}
                                                                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                                                    {brand.logo_url ? (
                                                                        <img src={brand.logo_url} alt="" className="h-5 w-5 object-contain" />
                                                                    ) : (
                                                                        <Building2 className="h-4 w-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="text-left flex-1">
                                                                    <p className="font-medium text-gray-900">{brand.name}</p>
                                                                    <p className="text-xs text-gray-500">{brand.category}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* ===== SECTION 4: BUSINESS/BRAND DETAILS ===== */}
                        <AnimatePresence>
                            {(businessType === 'online' || brandScale === 'single' || brandScale === 'regional_chain') && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Store className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {brandScale === 'regional_chain' ? 'Brand Details' : 'Business Details'}
                                        </span>
                                    </div>

                                    {/* Business/Brand Name */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {brandScale === 'regional_chain' ? 'Brand Name' : 'Business Name'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder={brandScale === 'regional_chain' ? "e.g., Meghana Foods" : "e.g., Chai Point"}
                                            className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30"
                                        />
                                    </div>

                                    {/* Owner Details */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {brandScale === 'regional_chain' ? 'Founder/Owner' : 'Owner Name'} *
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

                        {/* ===== SECTION 5: OUTLET DETAILS (for chains) ===== */}
                        <AnimatePresence>
                            {(brandScale === 'regional_chain' || (brandScale === 'national_chain' && selectedBrand)) && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                                        <MapPin className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            This Outlet Details
                                        </span>
                                    </div>

                                    {/* Outlet Name */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outlet Name *</label>
                                        <input
                                            type="text"
                                            value={outletName}
                                            onChange={(e) => setOutletName(e.target.value)}
                                            placeholder={brandScale === 'national_chain' ? "Domino's - Koramangala" : "Meghana Foods - BTM Layout"}
                                            className="w-full h-12 bg-white rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 border border-emerald-200"
                                        />
                                        <p className="text-[10px] text-emerald-700 mt-1">Format: Brand - Area/Location</p>
                                    </div>

                                    {/* Role (for national chains) */}
                                    {brandScale === 'national_chain' && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Role *</label>
                                            <select
                                                value={outletRole}
                                                onChange={(e) => setOutletRole(e.target.value as any)}
                                                className="w-full h-12 bg-white rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 border border-emerald-200 appearance-none"
                                            >
                                                <option value="">Select your role</option>
                                                <option value="manager">Store Manager</option>
                                                <option value="franchise_owner">Franchise Owner</option>
                                                <option value="owner">Brand Owner</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Manager Details */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager Name</label>
                                            <input
                                                type="text"
                                                value={outletManagerName}
                                                onChange={(e) => setOutletManagerName(e.target.value)}
                                                placeholder="Your name"
                                                className="w-full h-12 bg-white rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 border border-emerald-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager Phone</label>
                                            <div className="flex gap-1 mt-1">
                                                <div className="flex items-center px-2 bg-emerald-100 rounded-l-xl text-emerald-700 font-medium text-xs">
                                                    +91
                                                </div>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={outletManagerPhone}
                                                    onChange={(e) => setOutletManagerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="10 digits"
                                                    className="flex-1 h-12 bg-white rounded-r-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 border border-emerald-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outlet Phone */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outlet Phone</label>
                                        <input
                                            type="tel"
                                            value={outletPhone}
                                            onChange={(e) => setOutletPhone(e.target.value)}
                                            placeholder="Store landline or mobile"
                                            className="w-full h-12 bg-white rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 border border-emerald-200"
                                        />
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* ===== SECTION 6: LOCATION ===== */}
                        <AnimatePresence>
                            {(businessType === 'offline' && brandScale) && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {brandScale === 'regional_chain' ? 'Outlet Location' :
                                                brandScale === 'national_chain' ? 'Outlet Location' : 'Store Location'}
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
                                        {brandScale === 'single' && (
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
                                        )}
                                    </div>

                                    {/* Google Maps Link */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Maps Link</label>
                                        <input
                                            type="url"
                                            value={googleMapsLink}
                                            onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                            placeholder="Paste your Google Maps share link"
                                            className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {googleMapsLink && (
                                            <div className="mt-1 flex items-center gap-1">
                                                {extractingLocation ? (
                                                    <span className="text-[10px] text-blue-600">⏳ Detecting coordinates...</span>
                                                ) : extractedCoords ? (
                                                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Location detected
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-500">⚠️ Couldn't extract coordinates</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* ===== SECTION 7: OPTIONAL (Website/Social) ===== */}
                        <AnimatePresence>
                            {(businessType === 'online' || brandScale === 'single' || brandScale === 'regional_chain') && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Optional</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</label>
                                            <input
                                                type="url"
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full h-12 bg-gray-50 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instagram</label>
                                            <div className="flex gap-1 mt-1">
                                                <div className="flex items-center px-3 bg-gray-100 rounded-l-xl text-gray-500 text-sm">
                                                    @
                                                </div>
                                                <input
                                                    type="text"
                                                    value={instagram}
                                                    onChange={(e) => setInstagram(e.target.value)}
                                                    placeholder="username"
                                                    className="flex-1 h-12 bg-gray-50 rounded-r-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                    </div>

                    {/* Continue Button */}
                    <div className="mt-8 pb-4">
                        <Button
                            onClick={handleContinue}
                            disabled={!isFormValid()}
                            className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                        >
                            Continue to Photos
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
