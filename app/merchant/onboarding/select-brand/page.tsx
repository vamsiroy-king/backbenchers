"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Search, Building2, MapPin, Store, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Brand {
    id: string;
    name: string;
    slug: string;
    brand_type: string;
    category: string;
    logo_url: string | null;
    total_outlets: number;
}

export default function SelectBrandPage() {
    const router = useRouter();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

    // Fetch available brands
    useEffect(() => {
        async function fetchBrands() {
            try {
                // Use the function or direct query
                const { data, error } = await supabase
                    .from('brands')
                    .select('id, name, slug, brand_type, category, logo_url, total_outlets')
                    .eq('is_active', true)
                    .eq('is_available_for_onboarding', true)
                    .order('name');

                if (error) throw error;
                setBrands(data || []);
            } catch (error) {
                console.error('Error fetching brands:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBrands();
    }, []);

    // Filter brands by search
    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContinue = () => {
        if (!selectedBrand) return;

        // Save selected brand to localStorage
        localStorage.setItem('selected_brand', JSON.stringify(selectedBrand));

        // Go to outlet details
        router.push('/merchant/onboarding/outlet-details');
    };

    const getBrandTypeLabel = (type: string) => {
        switch (type) {
            case 'national_chain': return 'National Chain';
            case 'regional_chain': return 'Regional Chain';
            case 'franchise': return 'Franchise';
            default: return 'Brand';
        }
    };

    const getBrandTypeColor = (type: string) => {
        switch (type) {
            case 'national_chain': return 'bg-blue-100 text-blue-700';
            case 'regional_chain': return 'bg-purple-100 text-purple-700';
            case 'franchise': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-lg mx-auto min-h-screen flex flex-col">
                {/* Fixed Header */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/merchant/onboarding/merchant-type">
                            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-extrabold text-gray-900">Select Your Brand</h1>
                            <p className="text-xs text-gray-500">Choose the brand you work for</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-2 mt-4">
                        <div className="h-1.5 flex-1 bg-primary rounded-full" />
                        <div className="h-1.5 flex-1 bg-primary/30 rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full" />
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search brands..."
                            className="w-full h-12 bg-gray-100 rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Brand List */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-gray-500 mt-3">Loading brands...</p>
                        </div>
                    ) : filteredBrands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                <Store className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">No brands found</p>
                            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filteredBrands.map((brand, index) => (
                                    <motion.button
                                        key={brand.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedBrand(brand)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${selectedBrand?.id === brand.id
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Brand Logo */}
                                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${brand.logo_url ? 'bg-white border border-gray-100' : 'bg-gradient-to-br from-primary/20 to-emerald-100'
                                                }`}>
                                                {brand.logo_url ? (
                                                    <img
                                                        src={brand.logo_url}
                                                        alt={brand.name}
                                                        className="h-10 w-10 object-contain"
                                                    />
                                                ) : (
                                                    <Building2 className="h-7 w-7 text-primary" />
                                                )}
                                            </div>

                                            {/* Brand Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{brand.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBrandTypeColor(brand.brand_type)}`}>
                                                        {getBrandTypeLabel(brand.brand_type)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{brand.category}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{brand.total_outlets} outlet{brand.total_outlets !== 1 ? 's' : ''} on BackBenchers</span>
                                                </div>
                                            </div>

                                            {/* Selection Indicator */}
                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedBrand?.id === brand.id
                                                    ? 'border-primary bg-primary'
                                                    : 'border-gray-300'
                                                }`}>
                                                {selectedBrand?.id === brand.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="h-2.5 w-2.5 rounded-full bg-white"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Brand Not Listed */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Brand not listed?</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    If your brand isn't here, please contact us at{' '}
                                    <a href="mailto:brands@backbenchers.com" className="underline font-medium">
                                        brands@backbenchers.com
                                    </a>
                                    {' '}to get it added.
                                </p>
                                <Link
                                    href="/merchant/onboarding/merchant-type"
                                    className="inline-block mt-2 text-xs font-medium text-amber-800 underline"
                                >
                                    Or register as a local store instead →
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Fixed Bottom Button */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5">
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedBrand}
                        className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                    >
                        {selectedBrand ? `Continue with ${selectedBrand.name}` : 'Select a brand'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
