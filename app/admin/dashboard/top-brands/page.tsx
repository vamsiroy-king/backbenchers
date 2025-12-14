"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Plus, Trash2, Loader2, Search, Globe, Store,
    ArrowUp, ArrowDown, Crown, Sparkles, Check
} from "lucide-react";
import { merchantService } from "@/lib/services/merchant.service";
import { topBrandsService } from "@/lib/services/topBrands.service";
import { Merchant } from "@/lib/types";

// Online partners - These are national/global brands with coupon codes
interface OnlinePartner {
    id: string;
    name: string;
    logo: string;
    discount: string;
    category: string;
    couponCode?: string;
    link?: string;
    tier: 'premium' | 'standard';
}

// Mock online partners (in production, fetch from database)
const ONLINE_PARTNERS: OnlinePartner[] = [
    { id: '1', name: 'Netflix', logo: '🎬', discount: 'Student Plan', category: 'Entertainment', tier: 'premium', link: 'https://netflix.com/students' },
    { id: '2', name: 'Spotify', logo: '🎵', discount: '50% OFF', category: 'Music', tier: 'premium', couponCode: 'STUDENT50' },
    { id: '3', name: 'Amazon Prime', logo: '📦', discount: '₹499/year', category: 'Shopping', tier: 'premium', link: 'https://amazon.in/prime-student' },
    { id: '4', name: 'Adobe CC', logo: '🎨', discount: '60% OFF', category: 'Software', tier: 'premium', couponCode: 'STUDENT60' },
    { id: '5', name: 'Canva Pro', logo: '✏️', discount: 'FREE', category: 'Design', tier: 'standard' },
    { id: '6', name: 'GitHub Pro', logo: '💻', discount: 'FREE', category: 'Developer', tier: 'standard' },
    { id: '7', name: 'Notion', logo: '📝', discount: 'FREE Plus', category: 'Productivity', tier: 'standard' },
    { id: '8', name: 'Apple Music', logo: '🍎', discount: '50% OFF', category: 'Music', tier: 'standard' },
];

export default function TopBrandsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('offline');
    const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
    const [topBrands, setTopBrands] = useState<Merchant[]>([]);
    const [onlinePartners, setOnlinePartners] = useState<OnlinePartner[]>(ONLINE_PARTNERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddOnlineModal, setShowAddOnlineModal] = useState(false);

    // New online partner form
    const [newPartner, setNewPartner] = useState({
        name: '', logo: '', discount: '', category: '', couponCode: '', link: '', tier: 'standard' as const
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all approved merchants
            const result = await merchantService.getAll({ status: 'approved' });
            if (result.success && result.data) {
                setAllMerchants(result.data);
            }

            // Fetch existing top brands from database
            const brandsResult = await topBrandsService.getAll();
            if (brandsResult.success && brandsResult.data && brandsResult.data.length > 0) {
                // Map the database results to Merchant objects
                const existingBrands = brandsResult.data
                    .filter(b => b.merchant)
                    .map(b => ({
                        id: b.merchantId,
                        businessName: b.merchant!.businessName,
                        category: b.merchant!.category,
                        city: b.merchant!.city,
                        logo: b.merchant!.logo,
                    } as Merchant));
                setTopBrands(existingBrands);
            } else if (result.success && result.data) {
                // If no saved brands, show first 6 as default preview
                setTopBrands([]);
            }
        } catch (error) {
            console.error('Error fetching merchants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            // Save top brands with positions
            const brandsToSave = topBrands.map((brand, index) => ({
                merchantId: brand.id,
                position: index,
            }));

            const result = await topBrandsService.saveAll(brandsToSave);
            if (result.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                console.error('Error saving:', result.error);
                alert('Error saving: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving top brands:', error);
            alert('Error saving top brands');
        } finally {
            setSaving(false);
        }
    };

    const moveUp = (index: number, list: any[], setter: (l: any[]) => void) => {
        if (index === 0) return;
        const newList = [...list];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setter(newList);
    };

    const moveDown = (index: number, list: any[], setter: (l: any[]) => void) => {
        if (index === list.length - 1) return;
        const newList = [...list];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        setter(newList);
    };

    const removeFromTopBrands = (merchantId: string) => {
        setTopBrands(topBrands.filter(m => m.id !== merchantId));
    };

    const removeOnlinePartner = (partnerId: string) => {
        setOnlinePartners(onlinePartners.filter(p => p.id !== partnerId));
    };

    const addToTopBrands = (merchant: Merchant) => {
        if (!topBrands.find(m => m.id === merchant.id)) {
            setTopBrands([...topBrands, merchant]);
        }
        setShowAddModal(false);
    };

    const addOnlinePartner = () => {
        if (!newPartner.name) return;
        setOnlinePartners([...onlinePartners, {
            ...newPartner,
            id: Date.now().toString(),
        }]);
        setNewPartner({ name: '', logo: '', discount: '', category: '', couponCode: '', link: '', tier: 'standard' });
        setShowAddOnlineModal(false);
    };

    const filteredMerchants = allMerchants.filter(merchant =>
        merchant.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            Like Swiggy & Zomato, we have two types of partners: <strong>Online Partners</strong> (national brands with coupon codes)
                            and <strong>Offline Partners</strong> (local stores with QR scan redemption).
                        </p>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div className="bg-white/20 rounded-xl px-4 py-2">
                            <p className="text-2xl font-bold">{onlinePartners.length}</p>
                            <p className="text-xs opacity-80">Online</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-4 py-2">
                            <p className="text-2xl font-bold">{topBrands.length}</p>
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

                            {topBrands.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {topBrands.map((brand, index) => (
                                        <div key={brand.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => moveUp(index, topBrands, setTopBrands)} disabled={index === 0}
                                                    className="h-6 w-6 rounded hover:bg-gray-200 flex items-center justify-center disabled:opacity-30">
                                                    <ArrowUp className="h-4 w-4 text-gray-500" />
                                                </button>
                                                <button onClick={() => moveDown(index, topBrands, setTopBrands)} disabled={index === topBrands.length - 1}
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
                                            <button onClick={() => removeFromTopBrands(brand.id)}
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
                                    onClick={() => setShowAddOnlineModal(true)}
                                    className="h-9 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Online Partner
                                </button>
                            </div>

                            {/* Premium vs Standard tiers */}
                            <div className="p-4 space-y-4">
                                {/* Premium Partners */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-yellow-500" /> Premium Partners
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {onlinePartners.filter(p => p.tier === 'premium').map((partner) => (
                                            <div key={partner.id} className="relative group bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                                                <button onClick={() => removeOnlinePartner(partner.id)}
                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                                <div className="text-4xl mb-2">{partner.logo}</div>
                                                <h5 className="font-bold text-sm">{partner.name}</h5>
                                                <p className="text-xs text-purple-600 font-semibold">{partner.discount}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{partner.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Standard Partners */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Standard Partners</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {onlinePartners.filter(p => p.tier === 'standard').map((partner) => (
                                            <div key={partner.id} className="relative group bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                                <button onClick={() => removeOnlinePartner(partner.id)}
                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                                <div className="text-4xl mb-2">{partner.logo}</div>
                                                <h5 className="font-bold text-sm">{partner.name}</h5>
                                                <p className="text-xs text-purple-600 font-semibold">{partner.discount}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{partner.category}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                    <div className="grid grid-cols-3 gap-3">
                        {topBrands.slice(0, 6).map((brand, i) => (
                            <div key={brand.id} className="bg-gray-50 rounded-xl p-3 text-center">
                                <div className="h-12 w-12 mx-auto bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-2">
                                    {brand.logo ? (
                                        <img src={brand.logo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-xs font-semibold truncate">{brand.businessName}</p>
                                <p className="text-[10px] text-purple-600 font-bold">{brand.category}</p>
                            </div>
                        ))}
                        {topBrands.length === 0 && (
                            <div className="col-span-3 py-8 text-center text-gray-400 text-sm">
                                Add some partners to see preview
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Offline Partner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold">Add Offline Partner</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" placeholder="Search approved merchants..." value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-10 pr-4 bg-gray-100 rounded-xl text-sm outline-none" />
                            </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                            {filteredMerchants.map((merchant) => {
                                const isAdded = topBrands.some(m => m.id === merchant.id);
                                return (
                                    <button key={merchant.id} onClick={() => !isAdded && addToTopBrands(merchant)} disabled={isAdded}
                                        className={`w-full p-4 flex items-center gap-4 text-left ${isAdded ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                                        <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                                            {merchant.logo ? <img src={merchant.logo} alt="" className="w-full h-full object-cover" /> : <Store className="h-6 w-6 text-gray-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm">{merchant.businessName}</h4>
                                            <p className="text-xs text-gray-500">{merchant.category}</p>
                                        </div>
                                        {isAdded && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Added</span>}
                                    </button>
                                );
                            })}
                            {filteredMerchants.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    No approved merchants found
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Online Partner Modal */}
            {showAddOnlineModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold">Add Online Partner</h3>
                            <button onClick={() => setShowAddOnlineModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Brand Name *</label>
                                <input type="text" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                    placeholder="e.g. Netflix" className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Emoji Logo</label>
                                <input type="text" value={newPartner.logo} onChange={(e) => setNewPartner({ ...newPartner, logo: e.target.value })}
                                    placeholder="e.g. 🎬" className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Discount</label>
                                    <input type="text" value={newPartner.discount} onChange={(e) => setNewPartner({ ...newPartner, discount: e.target.value })}
                                        placeholder="e.g. 50% OFF" className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Category</label>
                                    <input type="text" value={newPartner.category} onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                                        placeholder="e.g. Entertainment" className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Coupon Code (optional)</label>
                                <input type="text" value={newPartner.couponCode} onChange={(e) => setNewPartner({ ...newPartner, couponCode: e.target.value })}
                                    placeholder="e.g. STUDENT50" className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Partner Link (optional)</label>
                                <input type="text" value={newPartner.link} onChange={(e) => setNewPartner({ ...newPartner, link: e.target.value })}
                                    placeholder="https://..." className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Tier</label>
                                <select value={newPartner.tier} onChange={(e) => setNewPartner({ ...newPartner, tier: e.target.value as any })}
                                    className="w-full h-11 px-4 bg-gray-100 rounded-xl text-sm outline-none mt-1">
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium (Featured)</option>
                                </select>
                            </div>
                            <button onClick={addOnlinePartner}
                                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
                                Add Partner
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
