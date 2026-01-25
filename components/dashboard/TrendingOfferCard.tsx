"use client";

import { motion } from "framer-motion";
import { Globe, Store, Star, Copy, ExternalLink, MapPin, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { vibrate } from "@/lib/haptics";
import { useState } from "react";

interface TrendingOfferCardProps {
    offer: {
        id: string;
        title: string;
        discountValue?: number;
        type?: 'percentage' | 'flat' | 'coupon' | 'bogo';
        merchantId: string;
        merchantName?: string;
        merchantLogo?: string;
        merchantCity?: string;
        code?: string; // For online coupons
        link?: string; // For online redirects
        avgRating?: number;
        totalRatings?: number;
        isNewSystem?: boolean; // true = online_offers table
    };
    variant: 'online' | 'offline';
    isVerified: boolean;
    onVerifyClick?: () => void;
    onClick?: () => void;
}

export function TrendingOfferCard({
    offer,
    variant,
    isVerified,
    onVerifyClick,
    onClick
}: TrendingOfferCardProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const isOnline = variant === 'online';

    // Format discount display
    const getDiscountDisplay = () => {
        if (offer.type === 'percentage') return `${offer.discountValue}%`;
        if (offer.type === 'flat') return `₹${offer.discountValue}`;
        if (offer.type === 'bogo') return 'B1G1';
        if (offer.discountValue && offer.discountValue > 0) {
            return offer.discountValue >= 100 ? `₹${offer.discountValue}` : `${offer.discountValue}%`;
        }
        return 'DEAL';
    };

    // Handle card click
    const handleClick = () => {
        vibrate('light');

        if (!isVerified && onVerifyClick) {
            onVerifyClick();
            return;
        }

        if (onClick) {
            onClick();
            return;
        }

        // Default navigation
        if (isOnline && offer.isNewSystem) {
            router.push(`/dashboard/online-brand/${offer.merchantId}`);
        } else if (isOnline) {
            router.push(`/offer/${offer.id}`);
        } else {
            router.push(`/store/${offer.merchantId}`);
        }
    };

    // Handle code copy for online offers
    const handleCopyCode = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (offer.code) {
            navigator.clipboard.writeText(offer.code);
            setCopied(true);
            vibrate('success');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Handle external link for online offers
    const handleGoToSite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (offer.link) {
            window.open(offer.link, '_blank');
            vibrate('light');
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClick}
            className={cn(
                "group relative w-[180px] flex-shrink-0 overflow-hidden rounded-2xl cursor-pointer",
                "bg-gradient-to-b from-[#151515] to-[#0a0a0a]",
                "border border-white/[0.06] hover:border-white/[0.12]",
                "shadow-lg shadow-black/50 hover:shadow-xl hover:shadow-green-500/5",
                "transition-all duration-300"
            )}
        >
            {/* Top Visual Section */}
            <div className="relative h-28 w-full overflow-hidden">
                {/* Background Gradient based on variant */}
                <div className={cn(
                    "absolute inset-0",
                    isOnline
                        ? "bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent"
                        : "bg-gradient-to-br from-green-600/20 via-emerald-600/10 to-transparent"
                )} />

                {/* Decorative Grid Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }} />

                {/* Variant Badge (Top-Left) */}
                <div className={cn(
                    "absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                    isOnline
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                )}>
                    {isOnline ? <Globe className="h-2.5 w-2.5" /> : <Store className="h-2.5 w-2.5" />}
                    {isOnline ? 'Online' : 'In-Store'}
                </div>

                {/* Discount Badge (Top-Right) - Premium Floating Style */}
                <div className="absolute top-3 right-3 z-10">
                    <div className={cn(
                        "relative flex items-center justify-center h-12 w-12 rounded-xl shadow-lg",
                        "bg-gradient-to-br from-green-400 to-green-600",
                        "border-2 border-green-300/30"
                    )}>
                        <div className="absolute inset-0 bg-black/10 rounded-xl" />
                        <div className="text-center relative">
                            <span className="block text-[13px] font-black text-black leading-none">
                                {getDiscountDisplay()}
                            </span>
                            <span className="block text-[7px] font-bold text-black/70 uppercase tracking-wider">
                                OFF
                            </span>
                        </div>
                        {/* Sparkle Decoration */}
                        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
                    </div>
                </div>

                {/* Merchant Logo (Center) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {offer.merchantLogo ? (
                        <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-md p-2 border border-white/10 shadow-xl">
                            <img
                                src={offer.merchantLogo}
                                alt={offer.merchantName}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <span className="text-2xl font-black text-white/20">
                                {offer.merchantName?.[0] || 'B'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            </div>

            {/* Content Section */}
            <div className="relative px-3 pb-3 pt-1">
                {/* Merchant Name */}
                <p className="text-[10px] font-medium text-white/50 truncate mb-1">
                    {offer.merchantName || 'Brand'}
                </p>

                {/* Offer Title */}
                <h3 className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-green-400 transition-colors min-h-[32px]">
                    {offer.title}
                </h3>

                {/* Rating (if available) */}
                {offer.avgRating && offer.avgRating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-bold text-white/80">{offer.avgRating.toFixed(1)}</span>
                        {offer.totalRatings && offer.totalRatings > 0 && (
                            <span className="text-[9px] text-white/40">({offer.totalRatings})</span>
                        )}
                    </div>
                )}

                {/* Location for Offline / Code for Online */}
                <div className="flex items-center gap-1 mb-3">
                    {isOnline ? (
                        offer.code ? (
                            <button
                                onClick={handleCopyCode}
                                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors"
                            >
                                <Tag className="h-3 w-3 text-green-400" />
                                <span className="text-[10px] font-mono font-bold text-green-400 tracking-wider">
                                    {copied ? 'COPIED!' : offer.code}
                                </span>
                                <Copy className="h-2.5 w-2.5 text-white/40" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1 text-white/40">
                                <Globe className="h-3 w-3" />
                                <span className="text-[10px]">Online Deal</span>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-1 text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="text-[10px] truncate max-w-[120px]">{offer.merchantCity || 'Nearby'}</span>
                        </div>
                    )}
                </div>

                {/* CTA Button */}
                <div className={cn(
                    "w-full py-2 rounded-lg text-center text-[11px] font-bold uppercase tracking-wider transition-all",
                    isOnline
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-black"
                        : "bg-green-500/10 text-green-400 border border-green-500/20 group-hover:bg-green-500 group-hover:text-black"
                )}>
                    {isOnline ? (
                        <span className="flex items-center justify-center gap-1">
                            Get Deal <ExternalLink className="h-3 w-3" />
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-1">
                            Visit Store <Store className="h-3 w-3" />
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                "bg-gradient-to-t",
                isOnline ? "from-blue-500/5 to-transparent" : "from-green-500/5 to-transparent"
            )} />
        </motion.div>
    );
}
