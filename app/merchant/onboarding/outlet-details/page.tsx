"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MapPin, Clock, User, Phone, Building2, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { INDIAN_STATES, CITIES_BY_STATE } from "@/lib/data/locations";
import { extractCoordinatesFromGoogleMapsLink } from "@/lib/utils/maps";

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    category: string;
}

export default function OutletDetailsPage() {
    const router = useRouter();
    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        outletName: "",
        state: "",
        city: "",
        address: "",
        pincode: "",
        phone: "",
        managerName: "",
        managerPhone: "",
        googleMapsLink: "",
    });

    const [extractedCoords, setExtractedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [extractingLocation, setExtractingLocation] = useState(false);

    // Load selected brand
    useEffect(() => {
        const savedBrand = localStorage.getItem('selected_brand');
        if (savedBrand) {
            const parsed = JSON.parse(savedBrand);
            setBrand(parsed);
            // Pre-fill outlet name with brand name
            setFormData(prev => ({
                ...prev,
                outletName: `${parsed.name} - `
            }));
        } else {
            // No brand selected, go back
            router.replace('/merchant/onboarding/select-brand');
        }
    }, [router]);

    // Handle Google Maps link
    const handleGoogleMapsLinkChange = async (link: string) => {
        setFormData(prev => ({ ...prev, googleMapsLink: link }));
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

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('merchant_outlet');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({
                    ...prev,
                    outletName: parsed.outletName || prev.outletName,
                    state: parsed.state || prev.state,
                    city: parsed.city || prev.city,
                    address: parsed.address || prev.address,
                    pincode: parsed.pincode || prev.pincode,
                    phone: parsed.phone || prev.phone,
                    managerName: parsed.managerName || prev.managerName,
                    managerPhone: parsed.managerPhone ? parsed.managerPhone.replace('+91', '') : prev.managerPhone,
                    googleMapsLink: parsed.googleMapsLink || prev.googleMapsLink,
                }));
                if (parsed.googleMapsLink) {
                    // Trigger extraction if link exists
                    // Optional: could re-verify, but for now just trusting saved link
                    if (parsed.latitude && parsed.longitude) {
                        setExtractedCoords({ lat: parsed.latitude, lng: parsed.longitude });
                    }
                }
            } catch (e) {
                console.error('Error loading saved outlet data:', e);
            }
        }
    }, []);

    const availableCities = formData.state ? (CITIES_BY_STATE[formData.state] || []) : [];

    const isFormValid =
        formData.outletName.length > 5 &&
        formData.state &&
        formData.city &&
        formData.address.length > 10 &&
        formData.pincode.length === 6 &&
        formData.managerName.length > 2 &&
        formData.managerPhone.length === 10 &&
        formData.googleMapsLink.length > 10; // Added Map Link Validation

    const handleContinue = () => {
        if (!isFormValid || !brand) return;

        // Save outlet data
        localStorage.setItem('merchant_outlet', JSON.stringify({
            brandId: brand.id,
            brandName: brand.name,
            outletName: formData.outletName,
            state: formData.state,
            city: formData.city,
            address: formData.address,
            pincode: formData.pincode,
            phone: formData.phone,
            managerName: formData.managerName,
            managerPhone: `+91${formData.managerPhone}`,
            googleMapsLink: formData.googleMapsLink,
            latitude: extractedCoords?.lat || null,
            longitude: extractedCoords?.lng || null,
        }));

        // Save for business data compatibility
        localStorage.setItem('merchant_business', JSON.stringify({
            businessType: 'offline',
            merchantType: 'chain_outlet',
            brandId: brand.id,
            businessName: formData.outletName,
            ownerName: formData.managerName,
            ownerPhone: `+91${formData.managerPhone}`,
            category: brand.category,
            phone: formData.phone,
        }));

        localStorage.setItem('merchant_location', JSON.stringify({
            state: formData.state,
            city: formData.city,
            address: formData.address,
            pincode: formData.pincode,
            googleMapsLink: formData.googleMapsLink,
            latitude: extractedCoords?.lat || null,
            longitude: extractedCoords?.lng || null,
        }));

        // Go to documents/photos step
        router.push('/merchant/onboarding/documents');
    };

    if (!brand) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-lg mx-auto min-h-screen flex flex-col">
                {/* Fixed Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/merchant/onboarding/select-brand">
                            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-extrabold text-gray-900">Outlet Details</h1>
                            <p className="text-xs text-gray-500">Adding outlet for {brand.name}</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-primary/30 rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-5 py-6">
                    {/* Brand Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-emerald-50 rounded-2xl border border-primary/10 mb-6"
                    >
                        <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                            {brand.logo_url ? (
                                <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 object-contain" />
                            ) : (
                                <Building2 className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{brand.name}</p>
                            <p className="text-xs text-gray-500">{brand.category}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                    </motion.div>

                    <div className="space-y-5">
                        {/* Outlet Name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outlet Name</label>
                            <input
                                type="text"
                                value={formData.outletName}
                                onChange={(e) => setFormData(prev => ({ ...prev, outletName: e.target.value }))}
                                placeholder="Domino's - Koramangala"
                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Format: Brand Name - Location/Area</p>
                        </div>

                        {/* Location Section */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4 text-primary" />
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outlet Location</p>
                            </div>

                            {/* State & City */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value, city: '' }))}
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                                    >
                                        <option value="">Select state</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        disabled={!formData.state}
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Select city</option>
                                        {availableCities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Shop no, building, street, landmark"
                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            {/* Pincode & Phone */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                        placeholder="560001"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="080-12345678"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            {/* Google Maps */}
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Maps Link</label>
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
                                            <span className="text-[10px] text-green-600 font-medium">✓ Location detected</span>
                                        ) : (
                                            <span className="text-[10px] text-orange-500 font-medium">⚠ Couldn't extract location</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manager Section */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-primary" />
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Details (Outlet Manager)</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Name</label>
                                    <input
                                        type="text"
                                        value={formData.managerName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                                        placeholder="Your full name"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Mobile Number</label>
                                    <div className="flex gap-2 mt-1">
                                        <div className="flex items-center px-4 bg-gray-200 rounded-xl text-gray-600 font-semibold text-sm">
                                            🇮🇳 +91
                                        </div>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            value={formData.managerPhone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, managerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                            placeholder="10 digit mobile"
                                            className="flex-1 h-12 bg-gray-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <p className="text-[10px] text-amber-600 mt-1">⚠️ This will be your login number</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
                    <Button
                        onClick={handleContinue}
                        disabled={!isFormValid || loading}
                        className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Continue to Photos
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
