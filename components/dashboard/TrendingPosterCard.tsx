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

    // Formatted Discount
    const discountDisplay = offer.type === 'percentage'
        ? `${offer.discountValue}% OFF`
        : offer.type === 'flat'
            ? `₹${offer.discountValue} OFF`
            : 'DEAL';

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className="group relative w-[260px] h-[350px] flex-shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-zinc-900 border border-white/[0.08]"
        >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 z-0">
                {offer.merchantLogo ? (
                    // Using logo as a blurred background pattern or actual cover if available
                    <div className="w-full h-full relative">
                        {/* We strongly prefer a cover image here, but falling back to logo pattern */}
                        <div className="absolute inset-0 bg-black" />
                        <img
                            src={offer.merchantLogo}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm scale-150 grayscale group-hover:grayscale-0 transition-all duration-700"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                )}
            </div>

            {/* Top Badge */}
            <div className="absolute top-4 left-4 z-10">
                {isOnline ? (
                    <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-md flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ONLINE</span>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-md flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">LIVE NOW</span>
                    </div>
                )}
            </div>

            {/* Center Content (Logo & Big Text) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center pt-12">
                {/* Logo Circle */}
                <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 p-1 mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <img
                        src={offer.merchantLogo || "/placeholder.png"}
                        alt={offer.merchantName}
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>

                {/* Big Discount Text */}
                <h2 className="text-3xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">
                    {offer.type === 'percentage' ? (
                        <>
                            <span className="text-[40px]">{offer.discountValue}</span>
                            <span className="text-2xl">%</span>
                        </>
                    ) : (
                        offer.discountValue
                    )}
                    <br />
                    <span className="text-lg font-bold text-white/80 tracking-wide">OFF</span>
                </h2>

                <p className="text-sm font-medium text-white/50 line-clamp-2 px-2">
                    {offer.title}
                </p>
            </div>

            {/* Bottom Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-1 flex items-center justify-between pl-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{offer.merchantName}</span>
                        {isOnline && offer.code ? (
                            <span className="text-xs font-mono font-bold text-white">{offer.code}</span>
                        ) : (
                            <div className="flex items-center gap-1 text-white/80">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs font-semibold">{offer.merchantCity || 'Nearby'}</span>
                            </div>
                        )}
                    </div>

                    {isOnline && offer.code ? (
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "h-9 px-4 rounded-xl flex items-center justify-center transition-all font-bold text-xs gap-2",
                                copied ? "bg-green-500 text-black" : "bg-white text-black hover:bg-white/90"
                            )}>
                            {copied ? "COPIED" : "COPY"}
                            <Copy className="h-3 w-3" />
                        </button>
                    ) : (
                        <button className="h-9 w-9 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
