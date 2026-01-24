"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Flame, Plus, Trash2, Loader2, Search, ArrowUp, ArrowDown, Store, Check,
    Globe, ShoppingBag
} from "lucide-react";
import { offerService } from "@/lib/services/offer.service";
import { trendingService } from "@/lib/services/trending.service";
import { Offer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TrendingOffersPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    const [allOffers, setAllOffers] = useState<Offer[]>([]);
    const [trendingOnline, setTrendingOnline] = useState<Offer[]>([]);
    const [trendingOffline, setTrendingOffline] = useState<Offer[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeSection, setActiveSection] = useState<'online' | 'offline'>('offline');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [offersResult, trendingResult] = await Promise.all([
                offerService.getActiveOffers(),
                trendingService.getAll()
            ]);

            if (offersResult.success && offersResult.data) {
                setAllOffers(offersResult.data);
            }

            if (trendingResult.success && trendingResult.data) {
                const mapTrending = (section: string) => trendingResult.data!
                    .filter(t => t.section === section && t.offer)
                    .map(t => ({ ...t.offer!, position: t.position } as unknown as Offer)); // Type cast for simplicity

                setTrendingOffline(mapTrending('offline'));
                setTrendingOnline(mapTrending('online'));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("Failed to load trending data");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
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
                toast.success("Trending lists updated successfully");
            } else {
                toast.error("Failed to save changes");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    // List Management Helpers
    const moveItem = (list: Offer[], index: number, direction: 'up' | 'down', setter: Function) => {
        const newList = [...list];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newList.length) return;

        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setter(newList);
    };

    const removeItem = (list: Offer[], id: string, setter: Function) => {
        setter(list.filter(o => o.id !== id));
    };

    const addItem = (offer: Offer) => {
        const targetList = activeSection === 'online' ? trendingOnline : trendingOffline;
        const setter = activeSection === 'online' ? setTrendingOnline : setTrendingOffline;

        if (targetList.find(o => o.id === offer.id)) {
            toast.warning("Offer is already in this list");
            return;
        }

        setter([...targetList, offer]);
        toast.success("Added to list");
        // Don't close modal to allow multiple adds
    };

    // Filter offers for the Add Modal
    const filteredOffers = allOffers.filter(offer => {
        // Exclude currently selected offers
        const isOffline = trendingOffline.some(o => o.id === offer.id);
        const isOnline = trendingOnline.some(o => o.id === offer.id);
        if (isOffline || isOnline) return false;

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            offer.title.toLowerCase().includes(q) ||
            offer.merchantName?.toLowerCase().includes(q) ||
            offer.merchantBbmId?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Flame className="h-8 w-8 text-orange-500" />
                        Trending Manager
                    </h1>
                    <p className="text-gray-400 mt-1">Curate the student home screen carousel</p>
                </div>

                <button
                    onClick={handleSaveChanges}
                    disabled={saving || loading}
                    className="bg-primary text-black font-bold px-6 py-2.5 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    {saving ? "Publishing..." : "Publish Changes"}
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Offline Section */}
                <TrendingSection
                    title="Offline / In-Store"
                    description="Physical stores & restaurants"
                    icon={Store}
                    color="orange"
                    items={trendingOffline}
                    loading={loading}
                    onMoveUp={(idx: number) => moveItem(trendingOffline, idx, 'up', setTrendingOffline)}
                    onMoveDown={(idx: number) => moveItem(trendingOffline, idx, 'down', setTrendingOffline)}
                    onRemove={(id: string) => removeItem(trendingOffline, id, setTrendingOffline)}
                    onAdd={() => { setActiveSection('offline'); setShowAddModal(true); }}
                />

                {/* Online Section */}
                <TrendingSection
                    title="Online Offers"
                    description="E-commerce & Digital Services"
                    icon={Globe}
                    color="blue"
                    items={trendingOnline}
                    loading={loading}
                    onMoveUp={(idx: number) => moveItem(trendingOnline, idx, 'up', setTrendingOnline)}
                    onMoveDown={(idx: number) => moveItem(trendingOnline, idx, 'down', setTrendingOnline)}
                    onRemove={(id: string) => removeItem(trendingOnline, id, setTrendingOnline)}
                    onAdd={() => { setActiveSection('online'); setShowAddModal(true); }}
                />
            </div>

            {/* Add Offer Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-primary" />
                                        Add to {activeSection === 'online' ? 'Online' : 'Offline'} Trending
                                    </h2>
                                    <p className="text-sm text-gray-400">Select offers to feature in this section</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 bg-gray-900/50">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by title, merchant, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-800 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-gray-600"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {filteredOffers.length > 0 ? (
                                    filteredOffers.map(offer => (
                                        <motion.button
                                            key={offer.id}
                                            layout
                                            onClick={() => addItem(offer)}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all group text-left"
                                        >
                                            <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800 group-hover:border-gray-600">
                                                {offer.merchantLogo ? (
                                                    <img src={offer.merchantLogo} alt="" className="h-8 w-8 object-contain" />
                                                ) : (
                                                    <Store className="h-6 w-6 text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white truncate">{offer.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span>{offer.merchantName}</span>
                                                    {offer.type === 'percentage' ? (
                                                        <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{offer.discountValue}% OFF</span>
                                                    ) : (
                                                        <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">₹{offer.discountValue} OFF</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                        </motion.button>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No matching offers found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TrendingSection({ title, description, icon: Icon, color, items, loading, onMoveUp, onMoveDown, onRemove, onAdd }: any) {
    const isOnline = color === 'blue';
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
            <div className={cn(
                "p-6 border-b border-gray-800 bg-gradient-to-r",
                isOnline ? "from-blue-900/20 to-indigo-900/20" : "from-orange-900/20 to-red-900/20"
            )}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            isOnline ? "bg-blue-500/20 text-blue-500" : "bg-orange-500/20 text-orange-500"
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{title}</h2>
                            <p className="text-xs text-gray-400">{description}</p>
                        </div>
                    </div>
                    <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg text-xs font-mono">
                        {items?.length || 0} Slots
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-gray-800 rounded-2xl" />)
                ) : items.length > 0 ? (
                    items.map((offer: Offer, idx: number) => (
                        <div key={offer.id} className="group relative bg-gray-800/40 hover:bg-gray-800 border border-transparent hover:border-gray-700 rounded-2xl p-4 flex items-center gap-4 transition-all">
                            {/* Rank Badge */}
                            <div className="absolute -left-1 -top-1 h-6 w-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg z-10 border border-gray-600">
                                {idx + 1}
                            </div>

                            {/* Image Placeholder */}
                            <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800 text-gray-600">
                                <ShoppingBag className="h-5 w-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{offer.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{offer.merchantName}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => onMoveUp(idx)}
                                        disabled={idx === 0}
                                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => onMoveDown(idx)}
                                        disabled={idx === items.length - 1}
                                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                    >
                                        <ArrowDown className="h-3 w-3" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemove(offer.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors ml-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <div className="h-16 w-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <Icon className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="text-sm">No offers featured yet</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900">
                <button
                    onClick={onAdd}
                    className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                >
                    <Plus className="h-4 w-4" />
                    Add Offer
                </button>
            </div>
        </div>
    );
}
