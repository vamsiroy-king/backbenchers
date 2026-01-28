"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, MapPin, Store, Globe, Tag, ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchService, SearchResult, SearchResults } from "@/lib/services/search.service";
import { vibrate } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    city?: string | null;
    placeholder?: string;
}

export function SearchOverlay({ isOpen, onClose, city, placeholder = "Search brands, stores, categories..." }: SearchOverlayProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [popularSearches] = useState<string[]>(searchService.getPopularSearches());

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setRecentSearches(searchService.getRecentSearches());
        }
    }, [isOpen]);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const searchResults = await searchService.search(query, { city: city || undefined });
            setResults(searchResults);
            setLoading(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query, city]);

    const handleResultClick = useCallback((result: SearchResult) => {
        vibrate('light');
        searchService.saveRecentSearch(result.name);
        onClose();

        switch (result.type) {
            case 'category':
                router.push(`/dashboard/explore?category=${encodeURIComponent(result.name)}`);
                break;
            case 'merchant':
                router.push(`/store/${result.id}`);
                break;
            case 'brand':
                router.push(`/dashboard/online-brand/${result.id}`);
                break;
            case 'offer':
                router.push(`/store/${result.id}`);
                break;
        }
    }, [router, onClose]);

    const handleQuickSearch = useCallback((term: string) => {
        setQuery(term);
        vibrate('light');
    }, []);

    const handleClearRecent = useCallback(() => {
        searchService.clearRecentSearches();
        setRecentSearches([]);
        vibrate('light');
    }, []);

    if (!isOpen) return null;

    const hasResults = results && results.total > 0;
    const showSuggestions = !query.trim() || query.length < 2;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
            >
                {/* Header with Search Input */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] z-10">
                    <div className="flex items-center gap-3 px-4 py-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholder}
                                className="w-full h-12 bg-white/[0.05] border border-white/[0.08] rounded-2xl pl-12 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                                autoComplete="off"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/60 text-sm font-medium hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                style={{ width: "50%" }}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100vh-80px)] pb-20">
                    {showSuggestions ? (
                        // Show suggestions when no query
                        <div className="px-5 py-6 space-y-8">
                            {/* Recent Searches */}
                            {recentSearches.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            Recent Searches
                                        </h3>
                                        <button
                                            onClick={handleClearRecent}
                                            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((term, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleQuickSearch(term)}
                                                className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Popular Searches */}
                            <section>
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Popular Searches
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {popularSearches.map((term, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickSearch(term)}
                                            className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full text-sm text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Quick Actions */}
                            <section>
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Quick Actions
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => router.push('/dashboard/map')}
                                        className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-left group hover:bg-green-500/20 transition-colors"
                                    >
                                        <MapPin className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-white">Near Me</p>
                                            <p className="text-[10px] text-white/40">Stores nearby</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => router.push('/dashboard/explore?category=online')}
                                        className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left group hover:bg-blue-500/20 transition-colors"
                                    >
                                        <Globe className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-white">Online</p>
                                            <p className="text-[10px] text-white/40">Shop online</p>
                                        </div>
                                    </button>
                                </div>
                            </section>
                        </div>
                    ) : hasResults ? (
                        // Show search results
                        <div className="px-5 py-4 space-y-6">
                            {/* Categories */}
                            {results.categories.length > 0 && (
                                <section>
                                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        Categories
                                    </h3>
                                    <div className="space-y-2">
                                        {results.categories.map((cat) => (
                                            <motion.button
                                                key={cat.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleResultClick(cat)}
                                                className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-colors text-left"
                                            >
                                                <span className="text-2xl">{cat.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                                                    <p className="text-xs text-white/40 truncate">{cat.subtitle}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/20" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Online Brands */}
                            {results.brands.length > 0 && (
                                <section>
                                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Globe className="h-3 w-3" />
                                        Online Brands
                                    </h3>
                                    <div className="space-y-2">
                                        {results.brands.map((brand) => (
                                            <motion.button
                                                key={brand.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleResultClick(brand)}
                                                className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-colors text-left"
                                            >
                                                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} alt="" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <span className="text-lg font-bold text-black">{brand.name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{brand.name}</p>
                                                    <p className="text-xs text-blue-400 truncate">Online • {brand.subtitle}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/20" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Stores Near You */}
                            {results.merchants.length > 0 && (
                                <section>
                                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Store className="h-3 w-3" />
                                        Stores {city ? `in ${city}` : 'Near You'}
                                    </h3>
                                    <div className="space-y-2">
                                        {results.merchants.map((merchant) => (
                                            <motion.button
                                                key={merchant.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleResultClick(merchant)}
                                                className="w-full flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-colors text-left"
                                            >
                                                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {merchant.logo ? (
                                                        <img src={merchant.logo} alt="" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <Store className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{merchant.name}</p>
                                                    <p className="text-xs text-green-400 truncate">
                                                        <MapPin className="h-3 w-3 inline mr-1" />
                                                        {merchant.city || 'Store'} • {merchant.subtitle}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/20" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : query.length >= 2 && !loading ? (
                        // No results
                        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
                            <Search className="h-12 w-12 text-white/10 mb-4" />
                            <p className="text-white/40 text-sm">No results found for "{query}"</p>
                            <p className="text-white/20 text-xs mt-1">Try a different search term</p>
                        </div>
                    ) : null}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
