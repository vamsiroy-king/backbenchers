"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, Gift, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { onlineBrandService } from "@/lib/services/online-brand.service";

const CATEGORIES = ["Food", "Fashion", "Fitness", "Beauty", "Tech", "Entertainment", "Travel"];

export default function NewOnlineBrandPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Brand Form
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Food");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [appUrl, setAppUrl] = useState(""); // App deep link
    const [preferApp, setPreferApp] = useState(false); // Toggle for prefer app vs website
    const [playstoreUrl, setPlaystoreUrl] = useState(""); // Google Play Store URL
    const [appstoreUrl, setAppstoreUrl] = useState(""); // Apple App Store URL

    // First Offer (Required for onboarding)
    const [offerTitle, setOfferTitle] = useState("");
    const [offerCode, setOfferCode] = useState("");
    const [offerDescription, setOfferDescription] = useState("");
    const [offerExpiryDate, setOfferExpiryDate] = useState("");

    // Image handling
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(previewUrl);
        } else {
            setCoverFile(file);
            setCoverPreview(previewUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!logoFile) {
            toast.error("Please upload a logo");
            return;
        }
        if (!coverFile) {
            toast.error("Please upload a cover image");
            return;
        }
        // Validate first offer (required)
        if (!offerTitle.trim()) {
            toast.error("Please enter an offer title");
            return;
        }
        if (!offerCode.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }

        setLoading(true);

        try {
            // 1. Upload Images
            let logoUrl = "";
            let coverUrl = "";

            if (logoFile) {
                logoUrl = await onlineBrandService.uploadImage(logoFile, 'logo');
            }
            if (coverFile) {
                coverUrl = await onlineBrandService.uploadImage(coverFile, 'cover');
            }

            // 2. Create Brand
            const brand = await onlineBrandService.createBrand({
                name,
                category,
                description,
                websiteUrl: website,
                appUrl: appUrl || undefined, // App deep link
                preferApp, // Prefer app toggle
                playstoreUrl: playstoreUrl || undefined, // Google Play Store URL
                appstoreUrl: appstoreUrl || undefined, // Apple App Store URL
                logoUrl: logoUrl,
                coverImageUrl: coverUrl,
                isActive: true
            });

            // 3. Create First Offer (Required for onboarding)
            await onlineBrandService.createOffer({
                brandId: brand.id,
                title: offerTitle,
                code: offerCode,
                description: offerDescription || undefined,
                expiryDate: offerExpiryDate || undefined,
                isActive: true
            });

            toast.success("Brand with offer created successfully!");
            // Redirect to the new Brand Profile page
            router.push(`/admin/dashboard/online-brands/${brand.id}`);

        } catch (error: any) {
            console.error("Failed to create brand:", error);
            toast.error(error.message || "Failed to create brand");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/dashboard/online-brands">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Online Brand</h1>
                    <p className="text-muted-foreground">Create brand profile with first discount offer</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Brand Visuals */}
                <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-1">Brand Visuals</h2>
                    <p className="text-sm text-muted-foreground mb-6">Upload high-quality assets. These define the "District-style" look.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Logo (Square, Transparent)</label>
                            <div className="flex gap-4 items-center">
                                <div className="h-24 w-24 rounded-xl bg-gray-50 border border-dashed flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                                    {logoPreview ? (
                                        <>
                                            <img src={logoPreview} className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">Change</div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Upload className="h-6 w-6 mb-1" />
                                            <span className="text-[10px]">Upload</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageSelect(e, 'logo')}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                                        Select Logo
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">Recommended: 500x500 PNG</p>
                                </div>
                            </div>
                        </div>

                        {/* Cover */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Cover Image (Wide)</label>
                            <div className="space-y-3">
                                <div className="h-32 w-full rounded-xl bg-gray-50 border border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => document.getElementById('cover-upload')?.click()}>
                                    {coverPreview ? (
                                        <>
                                            <img src={coverPreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">Change</div>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload className="h-6 w-6 mx-auto mb-2" />
                                            <span className="text-xs">Click to upload cover image</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="cover-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageSelect(e, 'cover')}
                                />
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('cover-upload')?.click()}>
                                    Select Cover Image
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Brand Details */}
                <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-6">Brand Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Brand Name</label>
                            <Input placeholder="e.g. Swiggy" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Short description about the brand partnership..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Website URL</label>
                            <Input placeholder="https://swiggy.com" value={website} onChange={e => setWebsite(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Brand's main website for redirect</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">App Deep Link (Optional)</label>
                            <Input placeholder="zomato:// or https://link.zomato.com/" value={appUrl} onChange={e => setAppUrl(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Direct app link for faster conversion. Opens brand's app instead of website.</p>
                        </div>

                        {/* Prefer App Toggle */}
                        <div className="col-span-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                            <div>
                                <label className="text-sm font-medium">Prefer App over Website</label>
                                <p className="text-xs text-muted-foreground mt-0.5">When enabled, users are redirected to the app or app store (not website)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreferApp(!preferApp)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferApp ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferApp ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Store URLs - Only show when Prefer App is enabled */}
                        {preferApp && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Google Play Store URL</label>
                                    <Input
                                        placeholder="https://play.google.com/store/apps/details?id=com.brand.app"
                                        value={playstoreUrl}
                                        onChange={e => setPlaystoreUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">For Android users who don't have the app installed</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Apple App Store URL</label>
                                    <Input
                                        placeholder="https://apps.apple.com/app/brand-app/id123456789"
                                        value={appstoreUrl}
                                        onChange={e => setAppstoreUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">For iOS users who don't have the app installed</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. First Offer (Required) */}
                <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 shadow-sm border-green-500/30">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">First Offer (Required)</h2>
                            <p className="text-sm text-muted-foreground">Add at least one discount offer to launch the brand</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Offer Title *</label>
                            <Input
                                placeholder="e.g. Flat 50% Off on First Order"
                                value={offerTitle}
                                onChange={e => setOfferTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Coupon Code *</label>
                            <Input
                                placeholder="e.g. BB50"
                                value={offerCode}
                                onChange={e => setOfferCode(e.target.value.toUpperCase())}
                                required
                                className="font-mono uppercase"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium">Offer Description</label>
                            <Input
                                placeholder="Short description about the offer..."
                                value={offerDescription}
                                onChange={e => setOfferDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Expiry Date (Optional)</label>
                            <Input
                                type="date"
                                value={offerExpiryDate}
                                onChange={e => setOfferExpiryDate(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty if no expiry</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Link href="/admin/dashboard/online-brands">
                        <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" size="lg" disabled={loading} className="min-w-[180px] bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Brand + Offer"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
