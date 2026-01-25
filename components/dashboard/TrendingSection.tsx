import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Store, Globe, Sparkles } from 'lucide-react';
import { TrendingPosterCard } from './TrendingPosterCard';

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
    // Initialize from localStorage strictly to match user preference persistence
    const [activeTab, setActiveTab] = useState<'offline' | 'online'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('trendingTab') as 'offline' | 'online') || 'offline';
        }
        return 'offline';
    });

    const handleTabChange = (tab: 'offline' | 'online') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            localStorage.setItem('trendingTab', tab);
            if (navigator?.vibrate) navigator.vibrate(10);
        }
    };

    const currentOffers = activeTab === 'offline' ? offlineOffers : onlineOffers;
    const isEmpty = currentOffers.length === 0;

    return (
        <section className="pb-8 relative overflow-hidden">
            {/* Section Header - Standardized */}
            <div className="flex items-center justify-center mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-white/40 uppercase">TRENDING NOW</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>

            {/* Premium Toggle Pills */}
            <div className="flex justify-center mb-8 relative z-10">
                <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                    {/* In-Store Tab */}
                    <button
                        onClick={() => handleTabChange('offline')}
                        className={`relative px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'offline'
                            ? 'text-black'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {activeTab === 'offline' && (
                            <motion.div
                                layoutId="trendingTabBg"
                                className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-lg shadow-green-500/30"
                                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Store className="h-3.5 w-3.5" />
                            In-Store
                        </span>
                    </button>

                    {/* Online Tab */}
                    <button
                        onClick={() => handleTabChange('online')}
                        className={`relative px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'online'
                            ? 'text-black'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {activeTab === 'online' && (
                            <motion.div
                                layoutId="trendingTabBg"
                                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl shadow-lg shadow-blue-500/30"
                                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5" />
                            Online
                        </span>
                    </button>
                </div>
            </div>

            {/* Count Badge */}
            {!isEmpty && (
                <div className="flex justify-center mb-4">
                    <span className={`text-[10px] font-medium px-3 py-1 rounded-full ${activeTab === 'offline'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                        {currentOffers.length} {activeTab === 'offline' ? 'Store' : 'Online'} Deals Available
                    </span>
                </div>
            )}

            {/* Content Area - Horizontal Scroll */}
            <div className="relative w-full">
                <div
                    id="trending-scroll-container"
                    className="flex overflow-x-auto pb-6 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide gap-4"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <AnimatePresence mode='wait'>
                        {!isEmpty ? (
                            <>
                                {/* Spacer to push first card to middle if needed, or just let scroll handle it */}
                                {currentOffers.map((offer, index) => (
                                    <motion.div
                                        key={`${activeTab}-${offer.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="snap-center transform-gpu"
                                        onLayoutAnimationComplete={() => {
                                            // Scroll to 2nd card on first load if it exists
                                            if (index === 1 && typeof document !== 'undefined') {
                                                const container = document.getElementById('trending-scroll-container');
                                                if (container) {
                                                    // Trigger scroll after small delay to ensure rendering
                                                    setTimeout(() => {
                                                        const cardWidth = 260;
                                                        const gap = 16;
                                                        // Center the 2nd card
                                                        // Offset = (260 + 16) - (390/2 - 260/2) = 276 - 65 = 211.
                                                        // My previous calc was 216. 
                                                        // Let's try 230 to be safer / more "middle".
                                                        container.scrollTo({ left: 230, behavior: 'smooth' });
                                                    }, 500);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="mr-4">
                                            <TrendingPosterCard
                                                offer={{
                                                    id: offer.id,
                                                    title: offer.title,
                                                    discountValue: offer.discountValue,
                                                    type: offer.type,
                                                    merchantId: offer.merchantId,
                                                    merchantName: offer.merchantName,
                                                    merchantLogo: offer.merchantLogo,
                                                    merchantCity: offer.merchantCity,
                                                    code: offer.code,
                                                    link: offer.link,
                                                    avgRating: offer.avgRating
                                                }}
                                                variant={activeTab}
                                                isVerified={isVerified}
                                                onVerifyClick={onVerifyClick}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-shrink-0 w-full px-5 text-center py-12"
                            >
                                <div className={`inline-flex flex-col items-center gap-2 px-8 py-6 rounded-2xl border ${activeTab === 'offline'
                                    ? 'bg-green-500/5 border-green-500/10'
                                    : 'bg-blue-500/5 border-blue-500/10'
                                    }`}>
                                    {activeTab === 'offline' ? (
                                        <Store className="h-6 w-6 text-white/20" />
                                    ) : (
                                        <Globe className="h-6 w-6 text-white/20" />
                                    )}
                                    <p className="text-white/40 text-xs tracking-wide">
                                        No {activeTab === 'offline' ? 'in-store' : 'online'} deals in {city || 'your area'}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Gradient Fade Edges */}
                <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                <div className="absolute top-0 bottom-6 right-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
            </div>
        </section>
    );
};
