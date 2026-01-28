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
                {/* Base Gradient */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    isOnline
                        ? "from-[#0F172A] via-[#020617] to-black"
                        : "from-[#052e16] via-[#020617] to-black"
                )} />

                {/* Dynamic Glow Orbs */}
                <div className={cn(
                    "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-40",
                    isOnline ? "bg-blue-600" : "bg-green-600"
                )} />
                <div className={cn(
                    "absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-20",
                    isOnline ? "bg-purple-600" : "bg-emerald-600"
                )} />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
            </div>

            {/* Top Badge */}
            <div className="absolute top-5 left-5 z-20">
                <div className={cn(
                    "px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 shadow-lg",
                    isOnline
                        ? "bg-blue-500/10 border-blue-400/20 text-blue-400"
                        : "bg-green-500/10 border-green-400/20 text-green-400"
                )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isOnline ? "bg-blue-400" : "bg-green-400")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isOnline ? 'ONLINE' : 'IN-STORE'}
                    </span>
                </div>
            </div>

            {/* Main Center Content */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center mt-[-20px]">
                {/* Floating Logo Card */}
                <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-6"
                >
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-110" />
                    <div className="relative h-20 w-20 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-2 shadow-2xl flex items-center justify-center">
                        <img
                            src={offer.merchantLogo || "/placeholder.png"}
                            alt={offer.merchantName}
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>
                </motion.div>

                {/* Discount Value */}
                <div className="relative mb-2">
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight drop-shadow-lg">
                        {offer.type === 'percentage' ? (
                            <span>{offer.discountValue}%</span>
                        ) : (
                            <span>₹{offer.discountValue}</span>
                        )}
                    </h2>
                    <p className="text-sm font-bold text-white/60 tracking-[0.2em] uppercase mt-1">
                        OFF
                    </p>
                </div>

                {/* Offer Title */}
                <p className="text-sm font-medium text-white/50 line-clamp-2 max-w-[200px] leading-relaxed">
                    {offer.title}
                </p>
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
