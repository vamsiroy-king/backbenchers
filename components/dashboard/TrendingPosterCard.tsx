"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight, Star, ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { vibrate } from "@/lib/haptics";
import { useState } from "react";

interface TrendingPosterCardProps {
    offer: {
        id: string;
        title: string;
        discountValue?: number;
        type?: 'percentage' | 'flat' | 'bogo';
        merchantId: string;
        merchantName?: string;
        merchantLogo?: string;
        merchantCity?: string;
        code?: string;
        link?: string;
        image?: string; // Optional cover image if available
        avgRating?: number;
    };
    variant: 'online' | 'offline';
    isVerified: boolean;
    onVerifyClick?: () => void;
    onClick?: () => void;
}

export function TrendingPosterCard({
    offer,
    variant,
    isVerified,
    onVerifyClick,
    onClick
}: TrendingPosterCardProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const isOnline = variant === 'online';

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

        if (isOnline) {
            router.push(`/dashboard/online-brand/${offer.merchantId}`);
        } else {
            router.push(`/store/${offer.merchantId}`);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (offer.code) {
            navigator.clipboard.writeText(offer.code);
            setCopied(true);
            vibrate('success');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "group relative w-[260px] h-[350px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[32px]",
                "border border-white/[0.08] hover:border-white/[0.2]",
                "transition-all duration-500 shadow-2xl shadow-black/50"
            )}
        >
            {/* Premium Background Layer */}
            <div className="absolute inset-0 z-0">
                {/* Minimal Background - No Gradients/Glows */}
                <div className="absolute inset-0 bg-neutral-900 border border-white/5" />

                {/* Fallback Pattern if no logo */}
                {!offer.merchantLogo && (
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                    />
                )}

                {/* Content Container */}
                <div className="relative z-10 h-full flex flex-col p-6">
                    {/* Header: Logo & Badges */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white p-1.5 shadow-sm overflow-hidden flex-shrink-0">
                            {offer.merchantLogo ? (
                                <img
                                    src={offer.merchantLogo}
                                    className="w-full h-full object-contain"
                                    alt={offer.merchantName || 'Merchant'}
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold text-xs">
                                    {(offer.merchantName || 'M').substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                            isOnline
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                            {isOnline ? "Online" : "In-Store"}
                        </div>
                    </div>

                    {/* Discount - Clean & Big */}
                    <div className="mt-auto mb-4">
                        <div className="text-4xl font-bold text-white tracking-tight mb-1">
                            {offer.type === 'flat' ? '₹' : ''}{offer.discountValue}{offer.type === 'percentage' ? '%' : ''}
                        </div>
                        <div className="text-lg font-medium text-white/60">OFF</div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-white line-clamp-1">{offer.merchantName}</h3>
                            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{offer.title}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-white/40" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-20">
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-1.5 flex items-center justify-between pl-4 shadow-lg">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider truncate mb-0.5">
                            {offer.merchantName}
                        </span>
                        {isOnline && offer.code ? (
                            <span className="text-xs font-mono font-bold text-white tracking-wide truncate">
                                {offer.code}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1.5 text-white/80">
                                <MapPin className="h-3 w-3 text-white/60" />
                                <span className="text-xs font-semibold truncate max-w-[100px]">
                                    {offer.merchantCity || 'Nearby'}
                                </span>
                            </div>
                        )}
                    </div>

                    {isOnline && offer.code ? (
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "h-9 px-4 rounded-xl flex items-center justify-center transition-all font-bold text-[10px] gap-1.5 uppercase tracking-wide",
                                copied
                                    ? "bg-green-500 text-black shadow-lg shadow-green-500/20"
                                    : "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                            )}>
                            {copied ? "COPIED" : "COPY"}
                            <Copy className="h-3 w-3" />
                        </button>
                    ) : (
                        <button className="h-9 w-9 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10">
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
