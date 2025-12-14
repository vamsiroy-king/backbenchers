"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Flame, Plus, Trash2, Loader2, Search, ArrowUp, ArrowDown, Store, Check
} from "lucide-react";
import { offerService } from "@/lib/services/offer.service";
import { trendingService } from "@/lib/services/trending.service";
import { Offer } from "@/lib/types";

export default function TrendingOffersPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allOffers, setAllOffers] = useState<Offer[]>([]);
    const [trendingOnline, setTrendingOnline] = useState<Offer[]>([]);
    const [trendingOffline, setTrendingOffline] = useState<Offer[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingTo, setAddingTo] = useState<'online' | 'offline'>('offline');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all offers
            const offersResult = await offerService.getActiveOffers();
            if (offersResult.success && offersResult.data) {
                setAllOffers(offersResult.data);
            }

            // Fetch current trending from database
            const trendingResult = await trendingService.getAll();
            if (trendingResult.success && trendingResult.data) {
                const offlineItems = trendingResult.data
                    .filter(t => t.section === 'offline' && t.offer)
                    .map(t => ({
                        id: t.offer!.id,
                        title: t.offer!.title,
                        discountValue: t.offer!.discountValue,
                        type: t.offer!.type,
                        merchantName: t.offer!.merchantName,
                        merchantId: t.offer!.merchantId,
                    } as Offer));

                const onlineItems = trendingResult.data
                    .filter(t => t.section === 'online' && t.offer)
                    .map(t => ({
                        id: t.offer!.id,
                        title: t.offer!.title,
                        discountValue: t.offer!.discountValue,
                        type: t.offer!.type,
                        merchantName: t.offer!.merchantName,
                        merchantId: t.offer!.merchantId,
                    } as Offer));

                setTrendingOffline(offlineItems);
                setTrendingOnline(onlineItems);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            // Build array of all trending offers with positions
            const allTrending = [
                ...trendingOffline.map((offer, index) => ({
                    offerId: offer.id,
                    section: 'offline' as const,
                    position: index,
                })),
                ...trendingOnline.map((offer, index) => ({
                    offerId: offer.id,
                    section: 'online' as const,
                    position: index,
                })),
            ];

            const result = await trendingService.saveAll(allTrending);
            if (result.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error saving trending:', error);
        } finally {
            setSaving(false);
        }
    };

    const moveUp = (list: Offer[], index: number, setter: (offers: Offer[]) => void) => {
        if (index === 0) return;
        const newList = [...list];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setter(newList);
    };

    const moveDown = (list: Offer[], index: number, setter: (offers: Offer[]) => void) => {
        if (index === list.length - 1) return;
        const newList = [...list];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        setter(newList);
    };

    const removeFromTrending = (list: Offer[], offerId: string, setter: (offers: Offer[]) => void) => {
        setter(list.filter(o => o.id !== offerId));
    };

    const addToTrending = (offer: Offer) => {
        if (addingTo === 'online') {
            if (!trendingOnline.find(o => o.id === offer.id)) {
                setTrendingOnline([...trendingOnline, offer]);
            }
        } else {
            if (!trendingOffline.find(o => o.id === offer.id)) {
                setTrendingOffline([...trendingOffline, offer]);
            }
        }
        setShowAddModal(false);
    };

    const filteredOffers = allOffers.filter(offer => {
        // Exclude offers already in EITHER trending list (offer can only be in one section)
        const inOffline = trendingOffline.some(o => o.id === offer.id);
        const inOnline = trendingOnline.some(o => o.id === offer.id);
        if (inOffline || inOnline) return false;

        // Filter by search query (title, merchant name, or BBM-ID)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = offer.title.toLowerCase().includes(query);
            const matchesMerchant = offer.merchantName?.toLowerCase().includes(query);
            const matchesBbmId = offer.merchantBbmId?.toLowerCase().includes(query);
            const matchesMerchantId = offer.merchantId?.toLowerCase().includes(query);
            return matchesTitle || matchesMerchant || matchesBbmId || matchesMerchantId;
        }

        return true; // Show all if no search query
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Flame className="h-7 w-7 text-orange-500" />
                        Trending Offers
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Curate the offers shown on the student home carousel</p>
                </div>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className={`h-10 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors ${saveSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveSuccess ? (
                        <Check className="h-4 w-4" />
                    ) : null}
                    {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Two Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Offline Trending */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        <div>
                            <h3 className="font-bold">Offline / In-Store Offers</h3>
                            <p className="text-xs opacity-80">{trendingOffline.length} offers in carousel</p>
                        </div>
                        <button
                            onClick={() => { setAddingTo('offline'); setShowAddModal(true); }}
                            className="h-8 w-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {trendingOffline.length > 0 ? (
                            trendingOffline.map((offer, index) => (
                                <div key={offer.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveUp(trendingOffline, index, setTrendingOffline)}
                                            className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-4 w-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => moveDown(trendingOffline, index, setTrendingOffline)}
                                            className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                            disabled={index === trendingOffline.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-300">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{offer.title}</h4>
                                        <p className="text-xs text-gray-500">{offer.merchantName}</p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                                        {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                    </span>
                                    <button
                                        onClick={() => removeFromTrending(trendingOffline, offer.id, setTrendingOffline)}
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                <Flame className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>No offline offers in trending</p>
                                <button
                                    onClick={() => { setAddingTo('offline'); setShowAddModal(true); }}
                                    className="mt-2 text-purple-600 text-sm font-medium"
                                >
                                    + Add offers
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Online Trending */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <div>
                            <h3 className="font-bold">Online Offers</h3>
                            <p className="text-xs opacity-80">{trendingOnline.length} offers in carousel</p>
                        </div>
                        <button
                            onClick={() => { setAddingTo('online'); setShowAddModal(true); }}
                            className="h-8 w-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {trendingOnline.length > 0 ? (
                            trendingOnline.map((offer, index) => (
                                <div key={offer.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveUp(trendingOnline, index, setTrendingOnline)}
                                            className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-4 w-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => moveDown(trendingOnline, index, setTrendingOnline)}
                                            className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                            disabled={index === trendingOnline.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl font-bold text-gray-300">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{offer.title}</h4>
                                        <p className="text-xs text-gray-500">{offer.merchantName}</p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                                        {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                    </span>
                                    <button
                                        onClick={() => removeFromTrending(trendingOnline, offer.id, setTrendingOnline)}
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                <Flame className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>No online offers in trending</p>
                                <button
                                    onClick={() => { setAddingTo('online'); setShowAddModal(true); }}
                                    className="mt-2 text-purple-600 text-sm font-medium"
                                >
                                    + Add offers
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold">Add to {addingTo === 'online' ? 'Online' : 'Offline'} Trending</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by offer title, merchant name, or BBM-ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                            {filteredOffers.length > 0 ? (
                                filteredOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        onClick={() => addToTrending(offer)}
                                        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 text-left"
                                    >
                                        <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <Store className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm truncate">{offer.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-gray-500 truncate">{offer.merchantName}</p>
                                                {offer.merchantBbmId && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                                                        {offer.merchantBbmId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                                            {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400">
                                    <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No offers found</p>
                                    <p className="text-xs mt-1">Create offers in the Merchants section first</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
