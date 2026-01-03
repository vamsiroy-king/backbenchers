"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, MapPin, Phone, Clock, Edit, Trash2, Store, MoreVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { brandService } from "@/lib/services/brand.service";
import { Brand, Outlet } from "@/lib/types";

export default function OutletsManagementPage() {
    const [brand, setBrand] = useState<Brand | null>(null);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            // Get brands owned by current user
            const brandsResult = await brandService.getMyBrands();
            if (brandsResult.success && brandsResult.data && brandsResult.data.length > 0) {
                const myBrand = brandsResult.data[0];
                setBrand(myBrand);

                // Get outlets for this brand
                const outletsResult = await brandService.getOutletsByBrandId(myBrand.id);
                if (outletsResult.success && outletsResult.data) {
                    setOutlets(outletsResult.data);
                }
            }
        } catch (error) {
            console.error('Error fetching outlets:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteOutlet(outletId: string) {
        if (!confirm('Are you sure you want to delete this outlet?')) return;

        const result = await brandService.deleteOutlet(outletId);
        if (result.success) {
            setOutlets(prev => prev.filter(o => o.id !== outletId));
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link href="/merchant/dashboard">
                            <button className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center">
                                <ArrowLeft className="h-5 w-5 text-white" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-white">Outlets</h1>
                            <p className="text-xs text-gray-400">{brand?.name || 'Manage your store locations'}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Outlet
                    </Button>
                </div>
            </div>

            {/* Outlets List */}
            <div className="p-4 space-y-4">
                {outlets.length === 0 ? (
                    <div className="text-center py-16">
                        <Store className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No outlets yet</h2>
                        <p className="text-gray-400 mb-6">Add your first store location to get started</p>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Outlet
                        </Button>
                    </div>
                ) : (
                    outlets.map((outlet) => (
                        <motion.div
                            key={outlet.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900 rounded-2xl p-4 border border-gray-800"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg">{outlet.name}</h3>
                                    {outlet.outletCode && (
                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                            {outlet.outletCode}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setActionMenuOpen(actionMenuOpen === outlet.id ? null : outlet.id)}
                                        className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center"
                                    >
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </button>
                                    <AnimatePresence>
                                        {actionMenuOpen === outlet.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="absolute right-0 top-10 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-10"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setEditingOutlet(outlet);
                                                        setShowAddModal(true);
                                                        setActionMenuOpen(null);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-gray-700 w-full"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteOutlet(outlet.id);
                                                        setActionMenuOpen(null);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 w-full"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-sm text-gray-400">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                    <span>{outlet.address}, {outlet.city}</span>
                                </div>
                                {outlet.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                                        <span>{outlet.phone}</span>
                                    </div>
                                )}
                                {outlet.operatingHours && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                                        <span>
                                            {outlet.operatingHours.monday?.open} - {outlet.operatingHours.monday?.close}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    {outlet.totalRedemptions} redemptions
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full ${outlet.isActive
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {outlet.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add/Edit Outlet Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <OutletFormModal
                        brand={brand}
                        outlet={editingOutlet}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingOutlet(null);
                        }}
                        onSave={(newOutlet) => {
                            if (editingOutlet) {
                                setOutlets(prev => prev.map(o => o.id === newOutlet.id ? newOutlet : o));
                            } else {
                                setOutlets(prev => [...prev, newOutlet]);
                            }
                            setShowAddModal(false);
                            setEditingOutlet(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Outlet Form Modal Component
function OutletFormModal({
    brand,
    outlet,
    onClose,
    onSave
}: {
    brand: Brand | null;
    outlet: Outlet | null;
    onClose: () => void;
    onSave: (outlet: Outlet) => void;
}) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: outlet?.name || '',
        outletCode: outlet?.outletCode || '',
        address: outlet?.address || '',
        area: outlet?.area || '',
        city: outlet?.city || '',
        state: outlet?.state || '',
        pincode: outlet?.pincode || '',
        phone: outlet?.phone || '',
        email: outlet?.email || '',
        whatsapp: outlet?.whatsapp || '',
        managerName: outlet?.managerName || '',
        managerPhone: outlet?.managerPhone || '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!brand) return;

        setSaving(true);
        try {
            if (outlet) {
                // Update existing
                const result = await brandService.updateOutlet(outlet.id, formData);
                if (result.success && result.data) {
                    onSave(result.data);
                }
            } else {
                // Create new
                const result = await brandService.createOutlet({
                    brandId: brand.id,
                    ...formData,
                });
                if (result.success && result.data) {
                    onSave(result.data);
                }
            }
        } catch (error) {
            console.error('Error saving outlet:', error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
            >
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {outlet ? 'Edit Outlet' : 'Add New Outlet'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Outlet Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Koramangala Branch"
                            className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Outlet Code</label>
                            <input
                                type="text"
                                value={formData.outletCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, outletCode: e.target.value }))}
                                placeholder="KOR-001"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="9876543210"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Address *</label>
                        <textarea
                            required
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Full address"
                            rows={2}
                            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">City *</label>
                            <input
                                type="text"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Bangalore"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Pincode</label>
                            <input
                                type="text"
                                value={formData.pincode}
                                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                                placeholder="560034"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Manager Name</label>
                            <input
                                type="text"
                                value={formData.managerName}
                                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                                placeholder="Manager name"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Manager Phone</label>
                            <input
                                type="tel"
                                value={formData.managerPhone}
                                onChange={(e) => setFormData(prev => ({ ...prev, managerPhone: e.target.value }))}
                                placeholder="9876543210"
                                className="w-full h-12 bg-gray-800 rounded-xl px-4 text-white placeholder:text-gray-500 border border-gray-700 focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
                    >
                        {saving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            outlet ? 'Save Changes' : 'Add Outlet'
                        )}
                    </Button>
                </form>
            </motion.div>
        </motion.div>
    );
}
