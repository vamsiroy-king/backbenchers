"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, Trash2, Edit, Eye, EyeOff, Save, X, Loader2, Image as ImageIcon, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { heroBannerService, HeroBanner } from "@/lib/services/heroBanner.service";
import { INDIAN_STATES, CITIES_BY_STATE, IndianState } from "@/lib/data/locations";
import { ImageUpload } from "@/components/ui/ImageUpload";

const GRADIENT_PRESETS = [
    { name: "Green", value: "from-green-500 to-emerald-600" },
    { name: "Purple", value: "from-purple-500 to-indigo-600" },
    { name: "Orange", value: "from-orange-500 to-red-500" },
    { name: "Blue", value: "from-blue-500 to-cyan-500" },
    { name: "Pink", value: "from-pink-500 to-rose-500" },
    { name: "Black", value: "from-gray-800 to-gray-900" },
];

const BANNER_TYPES = [
    { value: "promotion", label: "Promotion", emoji: "🎯" },
    { value: "event", label: "Event", emoji: "🎉" },
    { value: "partner", label: "Partner", emoji: "🤝" },
    { value: "announcement", label: "Announcement", emoji: "📢" },
];

export default function HeroBannersPage() {
    const [banners, setBanners] = useState<HeroBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: "",
        subtitle: "",
        ctaText: "Explore",
        ctaLink: "",
        backgroundGradient: "from-green-500 to-emerald-600",
        imageUrl: "",
        logoUrl: "",
        bannerType: "promotion",
        coverageType: "pan_india",
        selectedState: "" as IndianState | "",
        selectedCities: [] as string[],
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        isActive: true,
    });

    // Fetch banners
    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        const result = await heroBannerService.getAll();
        if (result.success && result.data) {
            setBanners(result.data);
        }
        setLoading(false);
    };

    const openCreateModal = () => {
        setEditingBanner(null);
        setForm({
            title: "",
            subtitle: "",
            ctaText: "Explore",
            ctaLink: "",
            backgroundGradient: "from-green-500 to-emerald-600",
            imageUrl: "",
            logoUrl: "",
            bannerType: "promotion",
            coverageType: "pan_india",
            selectedState: "",
            selectedCities: [],
            startDate: new Date().toISOString().split('T')[0],
            endDate: "",
            isActive: true,
        });
        setShowModal(true);
    };

    const openEditModal = (banner: HeroBanner) => {
        setEditingBanner(banner);
        setForm({
            title: banner.title,
            subtitle: banner.subtitle || "",
            ctaText: banner.ctaText,
            ctaLink: banner.ctaLink || "",
            backgroundGradient: banner.backgroundGradient,
            imageUrl: banner.imageUrl || "",
            logoUrl: banner.logoUrl || "",
            bannerType: banner.bannerType,
            coverageType: banner.coverageType,
            selectedState: "", // Reset state selector on edit, or try to infer if needed (optional)
            selectedCities: banner.cityIds || [],
            startDate: banner.startDate.split('T')[0],
            endDate: banner.endDate ? banner.endDate.split('T')[0] : "",
            isActive: banner.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;

        setSaving(true);
        const bannerData: Partial<HeroBanner> = {
            title: form.title,
            subtitle: form.subtitle || null,
            ctaText: form.ctaText,
            ctaLink: form.ctaLink || null,
            backgroundGradient: form.backgroundGradient,
            imageUrl: form.imageUrl || null,
            logoUrl: form.logoUrl || undefined,
            bannerType: form.bannerType as HeroBanner['bannerType'],
            coverageType: form.coverageType as HeroBanner['coverageType'],
            cityIds: form.coverageType === 'city_specific' ? form.selectedCities : null,
            startDate: form.startDate,
            endDate: form.endDate || null,
            isActive: form.isActive,
        };

        let result;
        if (editingBanner) {
            result = await heroBannerService.update(editingBanner.id, bannerData);
        } else {
            result = await heroBannerService.create(bannerData);
        }

        if (result.success) {
            await fetchBanners();
            setShowModal(false);
        } else {
            console.error("Save failed:", result.error);
            alert(`Failed to save banner: ${result.error}`);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        setDeleting(id);
        const result = await heroBannerService.delete(id);
        if (result.success) {
            setBanners(prev => prev.filter(b => b.id !== id));
        }
        setDeleting(null);
    };

    const toggleActive = async (banner: HeroBanner) => {
        await heroBannerService.update(banner.id, { isActive: !banner.isActive });
        fetchBanners();
    };

    // Get all cities for dropdown
    const allCities = Object.values(CITIES_BY_STATE).flat();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
                <div className="px-4 h-14 flex items-center gap-3">
                    <Link href="/admin/dashboard">
                        <button className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <ArrowLeft className="h-4 w-4 dark:text-white" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-extrabold text-lg dark:text-white">Hero Banners</h1>
                        <p className="text-xs text-gray-500">{banners.length} banners</p>
                    </div>
                    <Button onClick={openCreateModal} className="h-9 bg-primary text-white rounded-xl text-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </div>
            </header>

            <main className="px-4 pt-4 space-y-4">
                {/* Preview of what students see */}
                <div className="bg-gradient-to-r from-primary to-emerald-500 rounded-2xl p-4 text-white">
                    <p className="text-sm font-medium opacity-80 mb-1">📱 Student Home Preview</p>
                    <p className="text-xs opacity-60">These banners appear in the scrollable hero section</p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Banners List */}
                {!loading && banners.length === 0 && (
                    <div className="text-center py-16">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">No hero banners yet</p>
                        <Button onClick={openCreateModal} className="bg-primary text-white">
                            <Plus className="h-4 w-4 mr-2" /> Create First Banner
                        </Button>
                    </div>
                )}

                {!loading && banners.map((banner, index) => (
                    <motion.div
                        key={banner.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 ${!banner.isActive ? 'opacity-60' : ''}`}
                    >
                        {/* Banner Preview - Updated to match Student View */}
                        <div className={`h-32 bg-gradient-to-br ${banner.backgroundGradient} p-4 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                            {banner.imageUrl && (
                                <div className="absolute inset-0 z-0 opacity-100">
                                    <img src={banner.imageUrl} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-black/60" />
                                </div>
                            )}
                            <div className="relative z-10">
                                {(banner.logoUrl || banner.isAutoGenerated) && (
                                    <div className="mx-auto mb-2 h-6 w-6 bg-white/10 rounded flex items-center justify-center">
                                        {banner.logoUrl ? <img src={banner.logoUrl} className="h-4 w-4 object-contain" /> : <span className="text-[8px] text-white">LOGO</span>}
                                    </div>
                                )}
                                <p className="text-white font-bold text-lg leading-tight">{banner.title}</p>
                                {banner.subtitle && <p className="text-white/80 text-xs mt-1">{banner.subtitle}</p>}
                            </div>
                        </div>

                        {/* Banner Info */}
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{BANNER_TYPES.find(t => t.value === banner.bannerType)?.emoji}</span>
                                <span className="text-sm font-medium dark:text-white">{BANNER_TYPES.find(t => t.value === banner.bannerType)?.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {banner.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {banner.isAutoGenerated && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Auto</span>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {banner.coverageType === 'pan_india' ? 'All India' : `${banner.cityIds?.length || 0} cities`}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(banner.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {banner.endDate && ` - ${new Date(banner.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleActive(banner)}
                                    className="flex-1 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                                >
                                    {banner.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    <span className="dark:text-white">{banner.isActive ? 'Hide' : 'Show'}</span>
                                </button>
                                <button
                                    onClick={() => openEditModal(banner)}
                                    className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
                                >
                                    <Edit className="h-4 w-4 dark:text-white" />
                                </button>
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    disabled={deleting === banner.id}
                                    className="h-9 w-9 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center"
                                >
                                    {deleting === banner.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </main>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4 sm:p-0"
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-10">
                                <h2 className="font-bold text-lg dark:text-white">
                                    {editingBanner ? 'Edit Banner' : 'Create Banner'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="h-4 w-4 dark:text-white" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Preview */}
                                <div className={`h-40 bg-gradient-to-br ${form.backgroundGradient} rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden ring-4 ring-gray-100 dark:ring-gray-800`}>
                                    {form.imageUrl && (
                                        <div className="absolute inset-0 z-0 opacity-100">
                                            <img src={form.imageUrl} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-black/60" />
                                        </div>
                                    )}
                                    <div className="relative z-10 flex flex-col items-center w-full">
                                        {form.logoUrl && (
                                            <div className="h-8 w-8 bg-white rounded-lg p-1 flex items-center justify-center shadow-lg mb-2">
                                                <img src={form.logoUrl} className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <p className="text-white font-bold text-2xl leading-tight">{form.title || 'Banner Title'}</p>
                                        {form.subtitle && <p className="text-white/80 text-sm mt-1">{form.subtitle}</p>}
                                        <button className="bg-white text-black font-bold px-5 py-2 rounded-full text-xs mt-3 flex items-center gap-1">
                                            {form.ctaText || 'Button'} <span>→</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g., Flash Sale - 50% OFF"
                                        className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                    />
                                </div>

                                {/* Subtitle */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Subtitle</label>
                                    <input
                                        type="text"
                                        value={form.subtitle}
                                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                        placeholder="e.g., Limited time offer"
                                        className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                    />
                                </div>

                                {/* Image & Logo Upload */}
                                <div className="grid grid-cols-2 gap-3">
                                    <ImageUpload
                                        label="Banner Image"
                                        value={form.imageUrl}
                                        onChange={(url) => setForm({ ...form, imageUrl: url })}
                                        bucketName="campaigns"
                                        folderPath="hero-banners"
                                        aspectRatio="video"
                                    />
                                    <ImageUpload
                                        label="Partner Logo"
                                        value={form.logoUrl}
                                        onChange={(url) => setForm({ ...form, logoUrl: url })}
                                        bucketName="campaigns"
                                        folderPath="logos"
                                        aspectRatio="square"
                                    />
                                </div>

                                {/* CTA Text & Link */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Button Text</label>
                                        <input
                                            type="text"
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                            placeholder="e.g., Claim Now"
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Redirect Link</label>
                                        <input
                                            type="text"
                                            value={form.ctaLink}
                                            onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                                            placeholder="e.g., /store/123"
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Gradient - Only show if no image */}
                                {!form.imageUrl && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Background Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {GRADIENT_PRESETS.map((g) => (
                                                <button
                                                    key={g.value}
                                                    onClick={() => setForm({ ...form, backgroundGradient: g.value })}
                                                    className={`h-10 w-16 rounded-xl bg-gradient-to-r ${g.value} ${form.backgroundGradient === g.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rest of the form (Banner Type, Coverage, Dates, Save) */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {BANNER_TYPES.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => setForm({ ...form, bannerType: t.value })}
                                                className={`h-12 rounded-xl flex flex-col items-center justify-center ${form.bannerType === t.value ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'}`}
                                            >
                                                <span>{t.emoji}</span>
                                                <span className="text-[10px]">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Coverage</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setForm({ ...form, coverageType: 'pan_india' })}
                                            className={`h-11 rounded-xl text-sm font-medium ${form.coverageType === 'pan_india' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'}`}
                                        >
                                            🇮🇳 All India
                                        </button>
                                        <button
                                            onClick={() => setForm({ ...form, coverageType: 'city_specific' })}
                                            className={`h-11 rounded-xl text-sm font-medium ${form.coverageType === 'city_specific' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'}`}
                                        >
                                            📍 Specific Cities
                                        </button>
                                    </div>
                                </div>

                                {form.coverageType === 'city_specific' && (
                                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">1. Select State</label>
                                            <select
                                                value={form.selectedState}
                                                onChange={(e) => setForm({ ...form, selectedState: e.target.value as IndianState, selectedCities: [] })} // Reset cities when state changes
                                                className="w-full h-10 bg-white dark:bg-gray-900 rounded-lg px-2 text-xs outline-none border border-gray-200 dark:border-gray-700"
                                            >
                                                <option value="">-- Choose State --</option>
                                                {INDIAN_STATES.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {form.selectedState && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">2. Select Cities in {form.selectedState}</label>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                    {CITIES_BY_STATE[form.selectedState]?.map((city) => (
                                                        <button
                                                            key={city}
                                                            onClick={() => {
                                                                // Toggle city selection
                                                                if (form.selectedCities.includes(city)) {
                                                                    setForm({ ...form, selectedCities: form.selectedCities.filter(c => c !== city) });
                                                                } else {
                                                                    setForm({ ...form, selectedCities: [...(form.selectedCities), city] });
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.selectedCities.includes(city)
                                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-gray-300 hover:border-primary/50'
                                                                }`}
                                                        >
                                                            {city}
                                                        </button>
                                                    ))}
                                                </div>
                                                {form.selectedCities.length > 0 && (
                                                    <p className="text-[10px] text-gray-500 mt-2">
                                                        Selected: {form.selectedCities.join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-sm outline-none dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <span className="text-sm font-medium dark:text-white">Active (visible to students)</span>
                                    <button
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute h-5 w-5 bg-white rounded-full top-0.5 transition-all ${form.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !form.title.trim()}
                                    className="w-full h-12 bg-primary text-white font-semibold rounded-xl"
                                >
                                    {saving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {editingBanner ? 'Update Banner' : 'Create Banner'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
