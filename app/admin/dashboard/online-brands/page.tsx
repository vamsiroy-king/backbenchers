"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Globe, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { OnlineBrand } from "@/lib/types";

export default function OnlineBrandsPage() {
    const [brands, setBrands] = useState<OnlineBrand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            const data = await onlineBrandService.getAllBrands();
            setBrands(data);
        } catch (error) {
            console.error("Failed to load brands:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Online Brands</h1>
                    <p className="text-muted-foreground">Manage online brand partnerships and offers</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/dashboard/tracking">
                        <Button variant="outline" className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Tracking
                        </Button>
                    </Link>
                    <Link href="/admin/dashboard/online-brands/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Brand
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search brands..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-muted-foreground">Loading brands...</div>
            ) : filteredBrands.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-gray-50/50 border-dashed">
                    <Globe className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No brands found</h3>
                    <p className="text-muted-foreground text-sm mb-6">Get started by adding your first online brand partner.</p>
                    <Link href="/admin/dashboard/online-brands/new">
                        <Button variant="outline">Add First Brand</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBrands.map((brand) => (
                        <Link
                            key={brand.id}
                            href={`/admin/dashboard/online-brands/${brand.id}`}
                            className="group bg-white dark:bg-gray-900 border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer block"
                        >
                            {/* Card Header (Cover) */}
                            <div className="h-32 bg-gray-100 relative">
                                {brand.coverImageUrl ? (
                                    <img src={brand.coverImageUrl} alt={brand.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                                        <Globe className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute -bottom-6 left-6">
                                    <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-sm border">
                                        {brand.logoUrl ? (
                                            <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 rounded-lg" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 pt-8">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{brand.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                                            {brand.category}
                                        </span>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                                {brand.description && (
                                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                        {brand.description}
                                    </p>
                                )}
                                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Active</span>
                                    <span>{new Date(brand.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
