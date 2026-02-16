"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, MapPin, Clock, ChevronRight, Search, Filter,
    Sparkles, Building2, Globe, Laptop, Users, ArrowRight,
    X, SlidersHorizontal, CheckCircle2, Loader2
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { hustleService, Opportunity, OpportunityCategory, OpportunityFilters } from "@/lib/services/hustle.service";
import { cityService } from "@/lib/services/city.service";
import { vibrate } from "@/lib/haptics";

// Type badge colors
const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    freelance: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Freelance' },
    internship: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Internship' },
    part_time: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Part Time' },
    full_time: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Full Time' },
    contract: { bg: 'bg-rose-500/15', text: 'text-rose-400', label: 'Contract' },
};

// Work mode icons
const WORK_MODE_LABELS: Record<string, { icon: any; label: string }> = {
    remote: { icon: Globe, label: 'Remote' },
    onsite: { icon: Building2, label: 'On-site' },
    hybrid: { icon: Laptop, label: 'Hybrid' },
};

export default function HustlePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Data state
    const [categories, setCategories] = useState<OpportunityCategory[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Filter state
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedWorkMode, setSelectedWorkMode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // City
    const [selectedCity, setSelectedCity] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedCity') || null;
        }
        return null;
    });

    // Fetch categories on mount
    useEffect(() => {
        hustleService.getCategories().then(res => {
            if (res.success && res.data) setCategories(res.data);
        });
    }, []);

    // Fetch opportunities when filters change
    const fetchOpportunities = useCallback(async (reset = true) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const filters: OpportunityFilters = {
            limit: 20,
            offset: reset ? 0 : opportunities.length,
        };
        if (selectedCategory) filters.category_id = selectedCategory;
        if (selectedType) filters.type = selectedType;
        if (selectedWorkMode) filters.work_mode = selectedWorkMode;
        if (selectedCity) filters.city = selectedCity;
        if (searchQuery.trim()) filters.search = searchQuery.trim();

        const res = await hustleService.getOpportunities(filters);
        if (res.success && res.data) {
            if (reset) {
                setOpportunities(res.data);
            } else {
                setOpportunities(prev => [...prev, ...res.data!]);
            }
            setTotalCount(res.count || 0);
        }
        setLoading(false);
        setLoadingMore(false);
    }, [selectedCategory, selectedType, selectedWorkMode, selectedCity, searchQuery, opportunities.length]);

    useEffect(() => {
        fetchOpportunities(true);
    }, [selectedCategory, selectedType, selectedWorkMode, selectedCity]);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== '') fetchOpportunities(true);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedType(null);
        setSelectedWorkMode(null);
        setSearchQuery('');
    };

    const hasActiveFilters = selectedCategory || selectedType || selectedWorkMode || searchQuery;

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return `${Math.floor(days / 7)}w ago`;
    };

    return (
        <div className={`min-h-screen pb-32 ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLight ? 'bg-white/90' : 'bg-black/90'}`}>
                <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className={`font-bold text-lg tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Hustle</span>
                            <span className={`text-[10px] block -mt-0.5 ${isLight ? 'text-gray-400' : 'text-white/40'}`}>Find your next gig</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Your Profile pill */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                vibrate('light');
                                router.push('/dashboard/hustle/profile');
                            }}
                            className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all border ${isLight
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                }`}
                        >
                            <Users className="h-3.5 w-3.5" />
                            My Profile
                        </motion.button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 pt-4 space-y-5">

                {/* Search Bar */}
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? 'text-gray-400' : 'text-white/30'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search opportunities..."
                        className={`w-full h-12 pl-11 pr-12 rounded-xl text-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-green-500/30 ${isLight
                            ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                            : 'bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30'
                            }`}
                    />
                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${showFilters
                            ? 'bg-green-500 text-white'
                            : isLight ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-white/[0.05] text-white/40 hover:bg-white/[0.08]'
                            }`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </button>
                </div>

                {/* Filter Chips Row */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                        >
                            {/* Job Type */}
                            <div>
                                <span className={`text-[10px] uppercase tracking-widest font-semibold mb-2 block ${isLight ? 'text-gray-400' : 'text-white/30'}`}>Job Type</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(TYPE_COLORS).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedType(selectedType === key ? null : key)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${selectedType === key
                                                ? `${val.bg} ${val.text} border-current`
                                                : isLight ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white/[0.04] text-white/50 border-white/[0.06]'
                                                }`}
                                        >
                                            {val.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Work Mode */}
                            <div>
                                <span className={`text-[10px] uppercase tracking-widest font-semibold mb-2 block ${isLight ? 'text-gray-400' : 'text-white/30'}`}>Work Mode</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(WORK_MODE_LABELS).map(([key, val]) => {
                                        const Icon = val.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedWorkMode(selectedWorkMode === key ? null : key)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${selectedWorkMode === key
                                                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                                    : isLight ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white/[0.04] text-white/50 border-white/[0.06]'
                                                    }`}
                                            >
                                                <Icon className="h-3 w-3" />
                                                {val.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Clear */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" /> Clear all filters
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Chips - Horizontal Scroll */}
                <div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 gap-2 pb-1">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${!selectedCategory
                            ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                            : isLight ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' : 'bg-white/[0.04] text-white/60 border-white/[0.06] hover:bg-white/[0.06]'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                vibrate('light');
                                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                            }}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === cat.id
                                ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                : isLight ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' : 'bg-white/[0.04] text-white/60 border-white/[0.06] hover:bg-white/[0.06]'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Results Count */}
                {!loading && (
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                            {totalCount} {totalCount === 1 ? 'opportunity' : 'opportunities'} found
                        </span>
                        {selectedCity && (
                            <span className={`text-xs flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                                <MapPin className="h-3 w-3" /> {selectedCity}
                            </span>
                        )}
                    </div>
                )}

                {/* Opportunities List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`rounded-2xl p-4 animate-pulse border ${isLight ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`h-12 w-12 rounded-xl ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                    <div className="flex-1 space-y-2">
                                        <div className={`h-4 w-3/4 rounded ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                        <div className={`h-3 w-1/2 rounded ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                        <div className="flex gap-2">
                                            <div className={`h-5 w-16 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                            <div className={`h-5 w-14 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : opportunities.length === 0 ? (
                    <div className="text-center py-16">
                        <div className={`h-20 w-20 rounded-3xl mx-auto mb-4 flex items-center justify-center ${isLight ? 'bg-gray-100' : 'bg-white/[0.03]'}`}>
                            <Briefcase className={`h-10 w-10 ${isLight ? 'text-gray-300' : 'text-white/15'}`} />
                        </div>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-gray-600' : 'text-white/60'}`}>
                            {hasActiveFilters ? 'No matches found' : 'No opportunities yet'}
                        </h3>
                        <p className={`text-sm max-w-xs mx-auto ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                            {hasActiveFilters
                                ? 'Try adjusting your filters or search query'
                                : 'New earning opportunities will appear here soon. Set up your profile in the meantime!'
                            }
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-green-500 text-white"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {opportunities.map((opp, i) => {
                            const typeStyle = TYPE_COLORS[opp.type] || TYPE_COLORS.freelance;
                            const WorkModeInfo = WORK_MODE_LABELS[opp.work_mode] || WORK_MODE_LABELS.remote;
                            const WMIcon = WorkModeInfo.icon;

                            return (
                                <motion.div
                                    key={opp.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        vibrate('light');
                                        router.push(`/dashboard/hustle/${opp.id}`);
                                    }}
                                    className={`rounded-2xl p-4 cursor-pointer transition-all border group ${isLight
                                        ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg'
                                        : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        {/* Company Logo */}
                                        <div className={`h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border ${isLight
                                            ? 'bg-gray-50 border-gray-100'
                                            : 'bg-white/[0.04] border-white/[0.06]'
                                            }`}>
                                            {opp.recruiter?.logo_url ? (
                                                <Image
                                                    src={opp.recruiter.logo_url}
                                                    alt={opp.recruiter.company_name}
                                                    width={48}
                                                    height={48}
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <span className={`text-lg font-bold ${isLight ? 'text-gray-300' : 'text-white/20'}`}>
                                                    {opp.recruiter?.company_name?.charAt(0) || '?'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <h3 className={`font-bold text-[15px] leading-tight truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                {opp.title}
                                            </h3>

                                            {/* Company */}
                                            <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-gray-500' : 'text-white/50'}`}>
                                                {opp.recruiter?.company_name || 'Company'}
                                                {opp.recruiter?.industry && ` · ${opp.recruiter.industry}`}
                                            </p>

                                            {/* Tags Row */}
                                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                                                {/* Type badge */}
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${typeStyle.bg} ${typeStyle.text}`}>
                                                    {typeStyle.label}
                                                </span>

                                                {/* Work mode */}
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/[0.04] text-white/40'}`}>
                                                    <WMIcon className="h-2.5 w-2.5" />
                                                    {WorkModeInfo.label}
                                                </span>

                                                {/* Compensation */}
                                                {opp.compensation && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400'}`}>
                                                        {opp.compensation}
                                                    </span>
                                                )}

                                                {/* Location */}
                                                {(opp.city || opp.is_pan_india) && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-0.5 ${isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/[0.03] text-white/30'}`}>
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        {opp.is_pan_india ? 'Pan India' : opp.city}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Skills preview */}
                                            {opp.skills_required && opp.skills_required.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2 flex-wrap">
                                                    {opp.skills_required.slice(0, 3).map(skill => (
                                                        <span
                                                            key={skill}
                                                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/[0.03] text-white/30'}`}
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {opp.skills_required.length > 3 && (
                                                        <span className={`text-[9px] font-medium ${isLight ? 'text-gray-400' : 'text-white/20'}`}>
                                                            +{opp.skills_required.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className={`h-5 w-5 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1 ${isLight ? 'text-gray-300' : 'text-white/15'}`} />
                                    </div>

                                    {/* Footer: Time + Category */}
                                    <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${isLight ? 'border-gray-50' : 'border-white/[0.03]'}`}>
                                        <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
                                            <Clock className="h-3 w-3" />
                                            {getTimeAgo(opp.created_at)}
                                        </span>
                                        {opp.category && (
                                            <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
                                                {opp.category.icon} {opp.category.name}
                                            </span>
                                        )}
                                        {opp.total_applications > 0 && (
                                            <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/25'}`}>
                                                <Users className="h-3 w-3" />
                                                {opp.total_applications} applied
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Load More */}
                        {opportunities.length < totalCount && (
                            <button
                                onClick={() => fetchOpportunities(false)}
                                disabled={loadingMore}
                                className={`w-full py-3 rounded-xl text-sm font-medium transition-all border ${isLight
                                    ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    : 'bg-white/[0.03] text-white/50 border-white/[0.04] hover:bg-white/[0.05]'
                                    }`}
                            >
                                {loadingMore ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                    `Load More (${totalCount - opportunities.length} remaining)`
                                )}
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
