"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X, ChevronDown, Sparkles, MapPin, Ticket, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/locations";

// District Style Select Component (Reusable)
const Select = ({ label, options, placeholder, ...props }: { label?: string; options: { value: string; label: string }[]; placeholder: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="space-y-2">
        {label && <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>}
        <div className="relative">
            <select {...props} className="w-full h-10 bg-white dark:bg-gray-900 border border-input rounded-md px-3 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                <option value="" className="bg-white dark:bg-gray-900 text-muted-foreground">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-gray-900">{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    </div>
);

export default function NewOfferPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;
    const [loading, setLoading] = useState(false);

    // Offer Form
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [link, setLink] = useState("");
    const [redemptionType, setRedemptionType] = useState<'CODE_REVEAL' | 'DIRECT_REDIRECT'>('CODE_REVEAL');
    const [description, setDescription] = useState("");

    // Location Restriction
    const [locationScope, setLocationScope] = useState<'PAN_INDIA' | 'STATE' | 'CITY'>('PAN_INDIA');
    const [locationValuesList, setLocationValuesList] = useState<string[]>([]);

    // Temporary selection states
    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    const availableCities = useMemo(() => {
        if (!selectedState) return [];
        return getCitiesForState(selectedState);
    }, [selectedState]);

    const handleAddLocation = () => {
        if (locationScope === 'STATE' && selectedState) {
            if (!locationValuesList.includes(selectedState)) {
                setLocationValuesList([...locationValuesList, selectedState]);
            }
            setSelectedState("");
        } else if (locationScope === 'CITY' && selectedCity) {
            if (!locationValuesList.includes(selectedCity)) {
                setLocationValuesList([...locationValuesList, selectedCity]);
            }
            setSelectedCity("");
        }
    };

    const handleRemoveLocation = (value: string) => {
        setLocationValuesList(prev => prev.filter(v => v !== value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            toast.error("Offer title is required");
            return;
        }

        // Validation for Redemption Type
        if (redemptionType === 'CODE_REVEAL' && !code) {
            toast.error("Coupon code is required for Code Reveal offers");
            return;
        }

        if (redemptionType === 'DIRECT_REDIRECT' && !link) {
            toast.error("Offer link is required for Direct Redirect offers");
            return;
        }

        // Validation for Location Scope - prevents empty submissions
        if (locationScope !== 'PAN_INDIA' && locationValuesList.length === 0) {
            toast.error(`Please add at least one ${locationScope === 'STATE' ? 'state' : 'city'} to the list (click the + button)`);
            return;
        }

        setLoading(true);

        try {
            await onlineBrandService.createOffer({
                brandId,
                title,
                description,
                code: redemptionType === 'CODE_REVEAL' ? code : undefined,
                link,
                redemptionType,
                locationScope: locationScope === 'STATE' ? 'STATES' : locationScope === 'CITY' ? 'CITIES' : 'PAN_INDIA',
                locationValues: locationScope === 'PAN_INDIA' ? [] : locationValuesList,
                isActive: true
            });

            toast.success("Offer added successfully!");
            router.push(`/admin/dashboard/online-brands/${brandId}`);
        } catch (error: any) {
            console.error("Failed to create offer:", error);
            toast.error(error.message || "Failed to create offer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/admin/dashboard/online-brands/${brandId}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add New Offer</h1>
                    <p className="text-muted-foreground">Create a discount offer for this brand</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm">

                {/* Redemption Type Selector */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">Redemption Type</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Code Reveal Card */}
                        <button
                            type="button"
                            onClick={() => setRedemptionType('CODE_REVEAL')}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${redemptionType === 'CODE_REVEAL'
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${redemptionType === 'CODE_REVEAL' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <Ticket className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Code Reveal</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        User reveals hidden coupon code, auto-copies to clipboard, then pastes at checkout
                                    </p>
                                </div>
                            </div>
                            {redemptionType === 'CODE_REVEAL' && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                            )}
                        </button>

                        {/* Direct Redirect Card */}
                        <button
                            type="button"
                            onClick={() => setRedemptionType('DIRECT_REDIRECT')}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${redemptionType === 'DIRECT_REDIRECT'
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${redemptionType === 'DIRECT_REDIRECT' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <ExternalLink className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Direct Redirect</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        User clicks to go directly to partner site with discount applied (affiliate link)
                                    </p>
                                </div>
                            </div>
                            {redemptionType === 'DIRECT_REDIRECT' && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Offer Title</label>
                        <Input placeholder="e.g. Flat ₹100 Off on First Order" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Coupon Code {redemptionType === 'CODE_REVEAL' ? <span className="text-red-500">*</span> : '(Optional)'}
                            </label>
                            <Input
                                placeholder="e.g. BACKBENCHER100"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                className="font-mono uppercase"
                                disabled={redemptionType === 'DIRECT_REDIRECT'}
                            />
                            {redemptionType === 'DIRECT_REDIRECT' && (
                                <p className="text-xs text-muted-foreground">Not needed for direct redirect offers</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Offer Link {redemptionType === 'DIRECT_REDIRECT' ? <span className="text-red-500">*</span> : '(Recommended)'}
                            </label>
                            <Input placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description / Terms</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Min order value ₹200. Valid for new users."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>


                {/* Location Restriction UI */}
                <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">Target Audience Location</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input type="radio" name="locationScope" value="PAN_INDIA" checked={locationScope === 'PAN_INDIA'} onChange={() => { setLocationScope('PAN_INDIA'); setLocationValuesList([]); }} className="accent-blue-600" />
                                <span className="text-sm font-medium">Pan India 🇮🇳</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input type="radio" name="locationScope" value="STATE" checked={locationScope === 'STATE'} onChange={() => { setLocationScope('STATE'); setLocationValuesList([]); }} className="accent-blue-600" />
                                <span className="text-sm font-medium">Specific States</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input type="radio" name="locationScope" value="CITY" checked={locationScope === 'CITY'} onChange={() => { setLocationScope('CITY'); setLocationValuesList([]); }} className="accent-blue-600" />
                                <span className="text-sm font-medium">Specific Cities</span>
                            </label>
                        </div>

                        {/* State Selection */}
                        {locationScope === 'STATE' && (
                            <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            label="Select State"
                                            placeholder="Choose state..."
                                            options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                                            value={selectedState}
                                            onChange={e => setSelectedState(e.target.value)}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleAddLocation} disabled={!selectedState} size="icon">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Select multiple states where this offer is valid.</p>
                            </div>
                        )}

                        {/* City Selection */}
                        {locationScope === 'CITY' && (
                            <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Filter by State"
                                        placeholder="Choose state..."
                                        options={INDIAN_STATES.map(s => ({ value: s, label: s }))}
                                        value={selectedState}
                                        onChange={e => { setSelectedState(e.target.value); setSelectedCity(""); }}
                                    />
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Select
                                                label="Select City"
                                                placeholder={selectedState ? "Choose city..." : "Select state first"}
                                                options={availableCities.map(c => ({ value: c, label: c }))}
                                                value={selectedCity}
                                                onChange={e => setSelectedCity(e.target.value)}
                                                disabled={!selectedState}
                                            />
                                        </div>
                                        <Button type="button" onClick={handleAddLocation} disabled={!selectedCity} size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Select target cities.</p>
                            </div>
                        )}

                        {/* Tags Display */}
                        {locationValuesList.length > 0 && locationScope !== 'PAN_INDIA' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {locationValuesList.map(val => (
                                    <div key={val} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                                        <span>{val}</span>
                                        <button type="button" onClick={() => handleRemoveLocation(val)} className="hover:text-blue-900 dark:hover:text-blue-100">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <Link href={`/admin/dashboard/online-brands/${brandId}`}>
                        <Button variant="ghost" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" size="lg" disabled={loading} className="min-w-[150px]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Offer"}
                    </Button>
                </div>

            </form>
        </div>
    );
}
