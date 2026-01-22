import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Store, Globe, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OfferCard } from "@/components/OfferCard";

interface TrendingSectionProps {
    onlineOffers: any[];
    offlineOffers: any[];
    isVerified: boolean;
    onVerifyClick: () => void;
    city: string | null;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
    onlineOffers,
    offlineOffers,
    isVerified,
    onVerifyClick,
    city
}) => {
    const router = useRouter();
    // Initialize from localStorage strictly to match user preference persistence
    const [activeTab, setActiveTab] = useState<'offline' | 'online'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('trendingTab') as 'offline' | 'online') || 'offline';
        }
        return 'offline';
    });

    const isLightTheme = false; // Force dark theme aesthetic as per District design

    const handleTabChange = (tab: 'offline' | 'online') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem('trendingTab', tab);
            if (navigator?.vibrate) navigator.vibrate(10); // Light haptic
        }
    };

    const currentOffers = activeTab === 'offline' ? offlineOffers : onlineOffers;
    const isEmpty = currentOffers.length === 0;

    return (
        <section className="pb-8 relative overflow-hidden">
            {/* Header: Centered Divider Style */}
            <div className="flex items-center justify-center mb-6 px-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <div className="mx-4 flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] tracking-[0.2em] font-medium text-white/60 uppercase">Trending Now</span>
                    </div>
                </div>
                <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Toggle: Glassmorphic Pill */}
            <div className="flex justify-center mb-8 relative z-10">
                <div className="flex p-1 bg-white/[0.03] rounded-full border border-white/[0.08] backdrop-blur-md">
                    <button
                        onClick={() => handleTabChange('offline')}
                        className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'offline'
                            ? 'text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {activeTab === 'offline' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-green-500 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Store className="h-3 w-3" />
                            In-Store
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('online')}
                        className={`relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activeTab === 'online'
                            ? 'text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {activeTab === 'online' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-green-500 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Globe className="h-3 w-3" />
                            Online
                        </span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative w-full">
                {/* Scroll Container */}
                <div
                    className="flex overflow-x-auto pb-8 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <AnimatePresence mode='wait'>
                        {!isEmpty ? (
                            currentOffers.map((offer, index) => (
                                <div key={`${activeTab}-${offer.id}`} className="snap-center flex-shrink-0 w-[180px] mr-4 last:mr-0 group">
                                    <OfferCard
                                        offer={{
                                            id: offer.id,
                                            merchantId: offer.merchantId,
                                            merchantName: offer.merchantName,
                                            merchantLogo: offer.merchantLogo,
                                            title: offer.title,
                                            description: offer.merchantCity || "Trending",
                                            type: offer.type || "percentage",
                                            discountValue: offer.discountValue || 0,
                                            status: "active",
                                            totalRedemptions: 0,
                                            createdAt: new Date().toISOString(),
                                            avgRating: offer.avgRating,
                                            totalRatings: offer.totalRatings
                                        } as any}
                                        onClick={() => {
                                            if (!isVerified) {
                                                onVerifyClick();
                                            } else if (offer.isNewSystem) {
                                                router.push(`/dashboard/online-brand/${offer.merchantId}`);
                                            } else if (activeTab === 'online') {
                                                router.push(`/offer/${offer.id}`);
                                            } else {
                                                router.push(`/store/${offer.merchantId}`);
                                            }
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="flex-shrink-0 w-full px-5 text-center py-10">
                                <p className="text-white/40 text-xs tracking-widest uppercase">No trending offers found</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};
