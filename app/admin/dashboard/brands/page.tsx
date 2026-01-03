"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Plus, Search, MapPin, Store, Edit, Trash2,
    MoreVertical, ChevronRight, CheckCircle2, Clock, X, Loader2,
    AlertCircle, Globe, Phone, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Brand {
    id: string;
    name: string;
    slug: string;
    brand_type: string;
    category: string;
    logo_url: string | null;
    cover_image_url: string | null;
    description: string | null;
    website: string | null;
    corporate_phone: string | null;
    is_active: boolean;
    is_available_for_onboarding: boolean;
    total_outlets: number;
    created_at: string;
}

interface Outlet {
    id: string;
    brand_id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string | null;
    manager_name: string | null;
    is_active: boolean;
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [brandOutlets, setBrandOutlets] = useState<Outlet[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch brands
    useEffect(() => {
        async function fetchBrands() {
            try {
                const { data, error } = await supabase
                    .from('brands')
                    .select('*')
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

    // Fetch outlets when brand selected
    useEffect(() => {
        async function fetchOutlets() {
            if (!selectedBrand) {
                setBrandOutlets([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('outlets')
                    .select('*')
                    .eq('brand_id', selectedBrand.id)
                    .order('name');

                if (error) throw error;
                setBrandOutlets(data || []);
            } catch (error) {
                console.error('Error fetching outlets:', error);
            }
        }

        fetchOutlets();
    }, [selectedBrand]);

    // Filter brands
    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Toggle brand availability for onboarding
    const toggleOnboardingAvailability = async (brand: Brand) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('brands')
                .update({ is_available_for_onboarding: !brand.is_available_for_onboarding })
                .eq('id', brand.id);

            if (error) throw error;

            setBrands(prev => prev.map(b =>
                b.id === brand.id
                    ? { ...b, is_available_for_onboarding: !b.is_available_for_onboarding }
                    : b
            ));
        } catch (error) {
            console.error('Error updating brand:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const getBrandTypeLabel = (type: string) => {
        switch (type) {
            case 'national_chain': return 'National';
            case 'regional_chain': return 'Regional';
            case 'franchise': return 'Franchise';
            case 'local': return 'Local';
            default: return type;
        }
    };

    const getBrandTypeColor = (type: string) => {
        switch (type) {
            case 'national_chain': return 'bg-blue-100 text-blue-700';
            case 'regional_chain': return 'bg-purple-100 text-purple-700';
            case 'franchise': return 'bg-orange-100 text-orange-700';
            case 'local': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Brand Management</h1>
                                <p className="text-xs text-gray-500">{brands.length} brands registered</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Brand
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Brands List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Search */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search brands..."
                                        className="w-full h-10 bg-gray-50 rounded-lg pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Brand List */}
                            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : filteredBrands.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Store className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No brands found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {filteredBrands.map((brand) => (
                                            <button
                                                key={brand.id}
                                                onClick={() => setSelectedBrand(brand)}
                                                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedBrand?.id === brand.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${brand.logo_url ? 'bg-white border' : 'bg-gradient-to-br from-primary/20 to-emerald-100'
                                                        }`}>
                                                        {brand.logo_url ? (
                                                            <img src={brand.logo_url} alt="" className="h-6 w-6 object-contain" />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900 truncate">{brand.name}</p>
                                                            {brand.is_available_for_onboarding && (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getBrandTypeColor(brand.brand_type)}`}>
                                                                {getBrandTypeLabel(brand.brand_type)}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{brand.total_outlets} outlets</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-gray-300" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Brand Details */}
                    <div className="lg:col-span-2">
                        {selectedBrand ? (
                            <div className="space-y-6">
                                {/* Brand Info Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    {/* Header Image */}
                                    <div className="h-32 bg-gradient-to-r from-primary/20 to-emerald-100 relative">
                                        {selectedBrand.cover_image_url && (
                                            <img
                                                src={selectedBrand.cover_image_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute -bottom-8 left-6">
                                            <div className="h-16 w-16 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                                                {selectedBrand.logo_url ? (
                                                    <img src={selectedBrand.logo_url} alt="" className="h-10 w-10 object-contain" />
                                                ) : (
                                                    <Building2 className="h-8 w-8 text-primary" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand Info */}
                                    <div className="pt-12 px-6 pb-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">{selectedBrand.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getBrandTypeColor(selectedBrand.brand_type)}`}>
                                                        {getBrandTypeLabel(selectedBrand.brand_type)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{selectedBrand.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleOnboardingAvailability(selectedBrand)}
                                                    disabled={actionLoading}
                                                    className={selectedBrand.is_available_for_onboarding
                                                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }
                                                >
                                                    {selectedBrand.is_available_for_onboarding ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                            Available
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            Not Available
                                                        </>
                                                    )}
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {selectedBrand.description && (
                                            <p className="text-gray-600 text-sm mt-4">{selectedBrand.description}</p>
                                        )}

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-3 gap-4 mt-6">
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-2xl font-bold text-gray-900">{selectedBrand.total_outlets}</p>
                                                <p className="text-xs text-gray-500">Total Outlets</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-2xl font-bold text-gray-900">{brandOutlets.filter(o => o.is_active).length}</p>
                                                <p className="text-xs text-gray-500">Active</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-2xl font-bold text-gray-900">{brandOutlets.filter(o => !o.is_active).length}</p>
                                                <p className="text-xs text-gray-500">Inactive</p>
                                            </div>
                                        </div>

                                        {/* Contact */}
                                        {(selectedBrand.website || selectedBrand.corporate_phone) && (
                                            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                                                {selectedBrand.website && (
                                                    <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-sm text-primary hover:underline">
                                                        <Globe className="h-4 w-4" />
                                                        Website
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                                {selectedBrand.corporate_phone && (
                                                    <a href={`tel:${selectedBrand.corporate_phone}`}
                                                        className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Phone className="h-4 w-4" />
                                                        {selectedBrand.corporate_phone}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Outlets List */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Outlets ({brandOutlets.length})</h3>
                                        <Button size="sm" variant="outline">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Outlet
                                        </Button>
                                    </div>

                                    {brandOutlets.length === 0 ? (
                                        <div className="text-center py-12">
                                            <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No outlets yet</p>
                                            <p className="text-gray-400 text-xs mt-1">Outlets will appear when merchants join this brand</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {brandOutlets.map((outlet) => (
                                                <div key={outlet.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${outlet.is_active ? 'bg-green-100' : 'bg-gray-100'
                                                                }`}>
                                                                <Store className={`h-5 w-5 ${outlet.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{outlet.name}</p>
                                                                <p className="text-xs text-gray-500">{outlet.city}, {outlet.state}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {outlet.manager_name && (
                                                                <span className="text-xs text-gray-400">
                                                                    {outlet.manager_name}
                                                                </span>
                                                            )}
                                                            <span className={`text-xs px-2 py-1 rounded-full ${outlet.is_active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {outlet.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-96 flex items-center justify-center">
                                <div className="text-center">
                                    <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-500">Select a brand to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Brand Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddBrandModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={(newBrand) => {
                            setBrands(prev => [...prev, newBrand]);
                            setShowAddModal(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Add Brand Modal Component
function AddBrandModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (brand: Brand) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        brand_type: 'national_chain',
        category: 'Food & Beverages',
        description: '',
        website: '',
        corporate_phone: '',
        logo_url: '',
        cover_image_url: '',
        headquarters_address: '',
        contact_email: '',
    });

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError("Brand name is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Generate slug
            const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Check if slug already exists
            const { data: existing } = await supabase
                .from('brands')
                .select('id')
                .eq('slug', slug)
                .single();

            if (existing) {
                setError(`A brand with similar name already exists. Try a different name.`);
                setLoading(false);
                return;
            }

            const { data, error: insertError } = await supabase
                .from('brands')
                .insert({
                    name: formData.name.trim(),
                    slug: slug,
                    brand_type: formData.brand_type,
                    category: formData.category,
                    description: formData.description || null,
                    website: formData.website || null,
                    corporate_phone: formData.corporate_phone || null,
                    logo_url: formData.logo_url || null,
                    cover_image_url: formData.cover_image_url || null,
                    headquarters_address: formData.headquarters_address || null,
                    contact_email: formData.contact_email || null,
                    verification_status: 'admin_verified',
                    is_active: true,
                    is_available_for_onboarding: true,
                    total_outlets: 0,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            onSuccess(data);
        } catch (err: any) {
            console.error('Error adding brand:', err);
            setError(err.message || 'Failed to add brand. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Add New Brand</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Brand Name */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Brand Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Starbucks"
                            className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Brand Type & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Brand Type</label>
                            <select
                                value={formData.brand_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, brand_type: e.target.value }))}
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="national_chain">National Chain</option>
                                <option value="regional_chain">Regional Chain</option>
                                <option value="franchise">Franchise</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="Food & Beverages">Food & Beverages</option>
                                <option value="Fashion & Apparel">Fashion & Apparel</option>
                                <option value="Beauty & Wellness">Beauty & Wellness</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Education">Education</option>
                                <option value="Services">Services</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of the brand"
                            rows={2}
                            className="w-full bg-gray-50 rounded-lg px-4 py-3 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                    </div>

                    {/* Logo & Cover Image URLs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Logo URL</label>
                            <input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                                placeholder="https://..."
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Direct link to logo image</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Cover Image URL</label>
                            <input
                                type="url"
                                value={formData.cover_image_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                                placeholder="https://..."
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Banner/cover image</p>
                        </div>
                    </div>

                    {/* Website & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://..."
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Corporate Phone</label>
                            <input
                                type="tel"
                                value={formData.corporate_phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, corporate_phone: e.target.value }))}
                                placeholder="1800-XXX-XXXX"
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Email & Address */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Contact Email</label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                                placeholder="info@brand.com"
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Headquarters</label>
                            <input
                                type="text"
                                value={formData.headquarters_address}
                                onChange={(e) => setFormData(prev => ({ ...prev, headquarters_address: e.target.value }))}
                                placeholder="Mumbai, India"
                                className="w-full h-11 bg-gray-50 rounded-lg px-4 mt-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0 border-t border-gray-100">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name.trim() || loading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Brand'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

