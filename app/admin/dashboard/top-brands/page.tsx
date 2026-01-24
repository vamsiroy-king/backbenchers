"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Plus, Trash2, Loader2, Search, Globe, Store,
    ArrowUp, ArrowDown, Crown, Sparkles, Check
} from "lucide-react";
import { merchantService } from "@/lib/services/merchant.service";
import { topBrandsService } from "@/lib/services/topBrands.service";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { Merchant, OnlineBrand } from "@/lib/types";

export default function TopBrandsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('offline');

    // Data Sources
    const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
    const [allOnlineBrands, setAllOnlineBrands] = useState<OnlineBrand[]>([]);

    // Selected Lists
    const [offlineTopBrands, setOfflineTopBrands] = useState<Merchant[]>([]);
    const [onlineTopBrands, setOnlineTopBrands] = useState<OnlineBrand[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [merchantsResult, onlineBrandsResult, savedBrandsResult] = await Promise.all([
                merchantService.getAll({ status: 'approved' }),
                onlineBrandService.getAllBrands(),
                topBrandsService.getAll()
            ]);

            if (merchantsResult.success && merchantsResult.data) {
                setAllMerchants(merchantsResult.data);
            }

            if (onlineBrandsResult) {
                setAllOnlineBrands(onlineBrandsResult);
            }

            // Distribute saved brands
            if (savedBrandsResult.success && savedBrandsResult.data) {
                const savedOffline: Merchant[] = [];
                const savedOnline: OnlineBrand[] = [];

                savedBrandsResult.data.forEach(b => {
                    if (b.merchant?.isOnline) {
                        savedOnline.push({
                            id: b.merchant.id,
                            name: b.merchant.businessName,
                            category: b.merchant.category,
                            logoUrl: b.merchant.logo,
                            isActive: true,
                            createdAt: b.createdAt
                        } as any);
                    } else if (b.merchant) {
                        savedOffline.push({
                            id: b.merchant.id,
                            businessName: b.merchant.businessName,
                            category: b.merchant.category,
                            city: b.merchant.city,
                            logo: b.merchant.logo,
                        } as Merchant);
                    }
                });

                setOfflineTopBrands(savedOffline);
                setOnlineTopBrands(savedOnline);
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
            // Combine lists for saving
            const brandsToSave = [
                ...offlineTopBrands.map((brand, index) => ({
                    merchantId: brand.id,
                    position: index,
                    isOnline: false
                })),
                ...onlineTopBrands.map((brand, index) => ({
                    merchantId: brand.id,
                    position: index,
                    isOnline: true
                }))
            ];

            const result = await topBrandsService.saveAll(brandsToSave);
            if (result.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert('Error saving: ' + result.error);
            }
        } catch (error) {
            alert('Error saving top brands');
        } finally {
            setSaving(false);
        }
    };

    const moveItem = (index: number, list: any[], setter: (l: any[]) => void, direction: 'up' | 'down') => {
        const newList = [...list];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newList.length) return;

        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setter(newList);
    };

    const removeItem = (id: string, isOnline: boolean) => {
        if (isOnline) {
            setOnlineTopBrands(onlineTopBrands.filter(b => b.id !== id));
        } else {
            setOfflineTopBrands(offlineTopBrands.filter(b => b.id !== id));
        }
    };

    const addItem = (item: Merchant | OnlineBrand) => {
        if (activeTab === 'online') {
            const brand = item as OnlineBrand;
            if (!onlineTopBrands.find(b => b.id === brand.id)) {
                setOnlineTopBrands([...onlineTopBrands, brand]);
            }
        } else {
            const merchant = item as Merchant;
            if (!offlineTopBrands.find(m => m.id === merchant.id)) {
                setOfflineTopBrands([...offlineTopBrands, merchant]);
            }
        }
        // Don't close modal, allow multiple adds
    };

    const getFilteredItems = () => {
        if (activeTab === 'online') {
            return allOnlineBrands.filter(b =>
                !onlineTopBrands.find(sel => sel.id === b.id) &&
                b.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            return allMerchants.filter(m =>
                !offlineTopBrands.find(sel => sel.id === m.id) &&
                m.businessName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    };

    const filteredItems = getFilteredItems();

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
                        <Star className="h-7 w-7 text-yellow-500" />
                        Top Brands & Partners
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage featured brands shown on student app homepage</p>
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

            {/* Strategy Info Card */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5" /> Partner Strategy
                        </h3>
                        <p className="text-sm opacity-90 mt-2 max-w-xl">
                            Curate the <strong>Top Brands</strong> list. These appear horizontally on the home screen.
                            Use this to highlight key partners (Online or Offline).
                        </p>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="bg-white/20 rounded-xl px-4 py-2">
                            <p className="text-2xl font-bold">{onlineTopBrands.length}</p>
                            <p className="text-xs opacity-80">Online</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-4 py-2">
                            <p className="text-2xl font-bold">{offlineTopBrands.length}</p>
                            <p className="text-xs opacity-80">Offline</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('offline')}
                    className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'offline'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Store className="h-4 w-4" /> Offline Partners
                </button>
                <button
                    onClick={() => setActiveTab('online')}
                    className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'online'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Globe className="h-4 w-4" /> Online Partners
                </button>
            </div>

            {/* Content based on tab */}
            {/* Content based on tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'offline' ? (
                    <motion.div
                        key="offline"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Offline Partners Section */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Store className="h-5 w-5 text-purple-500" /> Local Store Partners
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Nearby stores, restaurants, cafes - redeemed via QR scan</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="h-9 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Partner
                                </button>
                            </div>

                            {offlineTopBrands.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {offlineTopBrands.map((brand, index) => (
                                        <div key={brand.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => moveItem(index, offlineTopBrands, setOfflineTopBrands, 'up')} disabled={index === 0}
                                                    className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30">
                                                    <ArrowUp className="h-4 w-4 text-gray-500" />
                                                </button>
                                                <button onClick={() => moveItem(index, offlineTopBrands, setOfflineTopBrands, 'down')} disabled={index === offlineTopBrands.length - 1}
                                                    className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30">
                                                    <ArrowDown className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </div>
                                            <div className="h-14 w-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                {brand.logo ? (
                                                    <img src={brand.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store className="h-7 w-7 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{brand.businessName}</h4>
                                                <p className="text-xs text-gray-500">{brand.category} • {brand.city}</p>
                                            </div>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                                #{index + 1}
                                            </span>
                                            <button onClick={() => removeItem(brand.id, false)}
                                                className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Store className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500">No offline partners added</p>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-3 text-purple-600 text-sm font-medium"
                                    >
                                        + Add your first partner
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="online"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Online Partners Section */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-blue-500" /> Online Brand Partners
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Netflix, Spotify, Adobe - redeemed via coupon codes or links</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="h-9 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Online Partner
                                </button>
                            </div>

                            {/* List of Online Partners */}
                            <div className="p-4">
                                {onlineTopBrands.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {onlineTopBrands.map((partner, index) => (
                                            <div key={partner.id} className="relative group bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-all">
                                                <button onClick={() => removeItem(partner.id, true)}
                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>

                                                {/* Reordering Controls */}
                                                <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => moveItem(index, onlineTopBrands, setOnlineTopBrands, 'up')} disabled={index === 0}
                                                        className="h-5 w-5 bg-white border rounded shadow flex items-center justify-center disabled:opacity-30">
                                                        <ArrowUp className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                    <button onClick={() => moveItem(index, onlineTopBrands, setOnlineTopBrands, 'down')} disabled={index === onlineTopBrands.length - 1}
                                                        className="h-5 w-5 bg-white border rounded shadow flex items-center justify-center disabled:opacity-30">
                                                        <ArrowDown className="h-3 w-3 text-gray-600" />
                                                    </button>
                                                </div>

                                                <div className="h-16 w-16 mx-auto bg-white rounded-full flex items-center justify-center overflow-hidden mb-3 border border-gray-100 shadow-sm">
                                                    {partner.logoUrl ? (
                                                        <img src={partner.logoUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl">🌐</span>
                                                    )}
                                                </div>
                                                <h5 className="font-bold text-sm truncate">{partner.name}</h5>
                                                <p className="text-[10px] text-gray-400 mt-1">{partner.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400 text-sm">
                                        No online partners added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* App Preview */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-4">📱 Preview - How it looks on Student App</h3>
                <div className="bg-white rounded-2xl p-4 text-gray-900">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" /> Top Brands
                    </h4>
                    <div className="grid grid-cols-6 gap-3">
                        {/* Merge lists for preview: Offline first, then Online (or interleaved as needed) */}
                        {[...offlineTopBrands, ...onlineTopBrands].slice(0, 6).map((brand: any) => (
                            <div key={brand.id} className="bg-gray-50 rounded-xl p-3 text-center">
                                <div className="h-12 w-12 mx-auto bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-2">
                                    {(brand.logo || brand.logoUrl) ? (
                                        <img src={brand.logo || brand.logoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-xs font-semibold truncate">{brand.businessName || brand.name}</p>
                                <p className="text-[10px] text-purple-600 font-bold">{brand.category}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Unified Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold">Add {activeTab === 'online' ? 'Online' : 'Offline'} Partner</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" placeholder={`Search ${activeTab === 'online' ? 'brands' : 'merchants'}...`} value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all" autoFocus />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
                            {filteredItems.map((item: any) => {
                                const isAdded = activeTab === 'online'
                                    ? onlineTopBrands.some(b => b.id === item.id)
                                    : offlineTopBrands.some(m => m.id === item.id);

                                return (
                                    <button key={item.id} onClick={() => !isAdded && addItem(item)} disabled={isAdded}
                                        className={`w-full p-4 flex items-center gap-4 text-left rounded-xl transition-colors ${isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                                        <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                                            {(item.logo || item.logoUrl) ?
                                                <img src={item.logo || item.logoUrl} alt="" className="w-full h-full object-cover" />
                                                : (activeTab === 'online' ? <Globe className="h-6 w-6 text-gray-400" /> : <Store className="h-6 w-6 text-gray-400" />)
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm">{item.businessName || item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.category}</p>
                                        </div>
                                        {isAdded ? (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full flex items-center gap-1">
                                                <Check className="h-3 w-3" /> Added
                                            </span>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No results found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

