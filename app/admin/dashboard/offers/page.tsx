"use client";

import { Tag, Search, Store, ChevronRight, ArrowLeft, Eye, Pause, Play, Trash2, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { offerService } from "@/lib/services/offer.service";
import { Offer } from "@/lib/types";
import { INDIAN_STATES, CITIES_BY_STATE } from "@/lib/data/locations";

export default function OffersListPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [merchantIdSearch, setMerchantIdSearch] = useState("");
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedCity, setSelectedCity] = useState("All Cities");
    const [stats, setStats] = useState({ active: 0, paused: 0 });

    // Get available cities based on selected state
    const availableCities = selectedState === "All States"
        ? ["All Cities"]
        : ["All Cities", ...(CITIES_BY_STATE[selectedState] || [])];

    // Reset city when state changes
    useEffect(() => {
        setSelectedCity("All Cities");
    }, [selectedState]);

    // Fetch offers
    useEffect(() => {
        async function fetchOffers() {
            setLoading(true);
            try {
                const result = await offerService.getAll({
                    status: filter === 'all' ? undefined : filter,
                    search: searchQuery || undefined,
                    merchantBbmId: merchantIdSearch ? `BBM-${merchantIdSearch}` : undefined
                });

                if (result.success && result.data) {
                    // Filter by state/city locally since offers don't have direct location
                    let filtered = result.data;
                    // Note: Further filtering by merchant location would require joining with merchants table
                    setOffers(filtered);

                    // Calculate stats
                    const all = result.data;
                    setStats({
                        active: all.filter(o => o.status === 'active').length,
                        paused: all.filter(o => o.status === 'paused').length
                    });
                }
            } catch (error) {
                console.error('Error fetching offers:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchOffers();
    }, [filter, searchQuery, merchantIdSearch]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'paused': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Get unique merchants
    const merchantsWithOffers = [...new Set(offers.map(o => o.merchantId))];

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center gap-3">
                    <Link href="/admin/dashboard">
                        <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-extrabold text-lg">Active Offers</h1>
                        <p className="text-xs text-gray-500">{offers.length} offers from {merchantsWithOffers.length} merchants</p>
                    </div>
                </div>
            </header>

            <main className="px-4 pt-4 space-y-4">
                {/* Merchant ID Search */}
                <div className="bg-primary/5 rounded-2xl p-4">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">Search by Merchant ID</label>
                    <div className="flex items-center bg-white rounded-xl border-2 border-primary/20 overflow-hidden">
                        <div className="bg-primary/10 px-3 py-3 text-primary font-mono font-bold text-sm">
                            BBM-
                        </div>
                        <input
                            type="text"
                            value={merchantIdSearch}
                            onChange={(e) => setMerchantIdSearch(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter merchant ID"
                            className="flex-1 h-11 px-3 text-sm font-mono font-medium outline-none"
                            maxLength={6}
                        />
                    </div>
                    {merchantIdSearch && (
                        <p className="text-xs text-gray-500 mt-2">
                            Found {offers.length} offers for BBM-{merchantIdSearch}
                        </p>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search offers or merchants..."
                        className="w-full h-12 bg-gray-100 rounded-xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                {/* State/City Filters */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full h-11 bg-gray-100 rounded-xl px-4 text-sm font-medium outline-none appearance-none cursor-pointer"
                        >
                            <option value="All States">All States</option>
                            {INDIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative">
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full h-11 bg-gray-100 rounded-xl px-4 text-sm font-medium outline-none appearance-none cursor-pointer"
                        >
                            {availableCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {(['all', 'active', 'paused'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {f === 'all' ? 'All Offers' : f === 'active' ? '✓ Active' : '⏸ Paused'}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-green-600">{stats.active}</p>
                        <p className="text-xs text-green-600">Active Offers</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                        <p className="text-2xl font-extrabold text-yellow-600">{stats.paused}</p>
                        <p className="text-xs text-yellow-600">Paused</p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Offers List */}
                {!loading && (
                    <div className="space-y-3">
                        {offers.map((offer, index) => (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-gray-50 rounded-2xl p-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                                        {offer.type === 'percentage' ? `${offer.discountValue}%` : offer.type === 'flat' ? '₹' : '2x'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-sm truncate">{offer.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(offer.status)}`}>
                                                {offer.status}
                                            </span>
                                        </div>
                                        {/* Merchant Info */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <Store className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-600">{offer.merchantName || 'Unknown'}</span>
                                            {offer.merchantBbmId && (
                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                                    {offer.merchantBbmId}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{offer.totalRedemptions || 0} redemptions</p>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                                    <Link href={`/admin/dashboard/merchants/${offer.merchantId}`} className="flex-1">
                                        <button className="w-full h-9 bg-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-gray-200">
                                            <Eye className="h-3 w-3" /> View Merchant
                                        </button>
                                    </Link>
                                    <button className="h-9 w-9 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                        {offer.status === 'active' ? <Pause className="h-4 w-4 text-yellow-600" /> : <Play className="h-4 w-4 text-green-600" />}
                                    </button>
                                    <button className="h-9 w-9 bg-white rounded-lg border border-red-200 flex items-center justify-center">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {offers.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-400">
                                <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-sm">No offers found</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
