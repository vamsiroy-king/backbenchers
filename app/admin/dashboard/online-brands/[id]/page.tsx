"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ExternalLink, Trash2, Power, Globe, Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { OnlineBrand, OnlineOffer } from "@/lib/types";

export default function BrandProfilePage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;

    const [brand, setBrand] = useState<OnlineBrand | null>(null);
    const [offers, setOffers] = useState<OnlineOffer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (brandId) {
            loadData();
        }
    }, [brandId]);

    const loadData = async () => {
        try {
            const [brandData, offersData] = await Promise.all([
                onlineBrandService.getBrandById(brandId),
                onlineBrandService.getOffersByBrandId(brandId, true) // true = include inactive for admin
            ]);
            setBrand(brandData);
            setOffers(offersData);
        } catch (error) {
            console.error("Failed to load brand data:", error);
            toast.error("Failed to load brand details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOffer = async (offerId: string) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;
        try {
            await onlineBrandService.deleteOffer(offerId);
            toast.success("Offer deleted");
            setOffers(prev => prev.filter(o => o.id !== offerId));
        } catch (error) {
            toast.error("Failed to delete offer");
        }
    };

    const handleToggleStatus = async (offerId: string, currentStatus: boolean) => {
        try {
            await onlineBrandService.toggleOfferStatus(offerId, !currentStatus);
            toast.success(`Offer ${!currentStatus ? 'activated' : 'deactivated'}`);
            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, isActive: !currentStatus } : o));
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!brand) return <div className="text-center py-20">Brand not found</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/dashboard/online-brands">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
                    <p className="text-muted-foreground">Manage brand profile and offers</p>
                </div>
                <Link href={`/admin/dashboard/online-brands/${brandId}/new-offer`}>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Offer
                    </Button>
                </Link>
            </div>

            {/* Brand Card */}
            <div className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-100 relative">
                    {brand.coverImageUrl && (
                        <img src={brand.coverImageUrl} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute -bottom-8 left-8">
                        <div className="h-24 w-24 rounded-2xl bg-white p-2 shadow-md border">
                            {brand.logoUrl ? (
                                <img src={brand.logoUrl} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-xl" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-12">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold">{brand.name}</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {brand.category}
                                </span>
                            </div>
                            <p className="text-muted-foreground max-w-2xl">{brand.description}</p>

                            {brand.websiteUrl && (
                                <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-4">
                                    <Globe className="h-3 w-3" />
                                    Visit Website
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Offers Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    Active Offers
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{offers.length}</span>
                </h3>

                {offers.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl bg-gray-50/50 border-dashed">
                        <p className="text-muted-foreground mb-4">No offers created yet for this brand.</p>
                        <Link href={`/admin/dashboard/online-brands/${brandId}/new-offer`}>
                            <Button variant="outline">Create First Offer</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {offers.map((offer) => (
                            <div key={offer.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all ${!offer.isActive ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-semibold text-lg">{offer.title}</h4>
                                            {!offer.isActive && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Inactive</span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{offer.description}</p>

                                        <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                                            {offer.code && (
                                                <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border font-mono">
                                                    Code: <span className="font-bold text-black dark:text-white select-all">{offer.code}</span>
                                                </div>
                                            )}
                                            {offer.expiryDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Expires: {new Date(offer.expiryDate).toLocaleDateString()}
                                                </div>
                                            )}
                                            {/* Location Badge */}
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {/* Note: location_scope not in basic type but usually present in logic */}
                                                Targeting enabled
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-l pl-6">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={offer.isActive ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400"}
                                            onClick={() => handleToggleStatus(offer.id, offer.isActive)}
                                            title={offer.isActive ? "Deactivate" : "Activate"}
                                        >
                                            <Power className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteOffer(offer.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
