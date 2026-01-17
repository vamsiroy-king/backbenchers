"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, Clock, Gift, Copy, Check, ExternalLink } from "lucide-react";
import { OnlineOffer, OnlineBrand } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { vibrate } from "@/lib/haptics";
import { toast } from "sonner";

interface OnlineOfferCardProps {
    offer: OnlineOffer;
    brand: OnlineBrand;
    onClick?: () => void;
    priority?: boolean;
    isRevealed?: boolean;
    onReveal?: () => void;
}

export function OnlineOfferCard({
    offer,
    brand,
    onClick,
    priority = false,
    isRevealed = false,
    onReveal
}: OnlineOfferCardProps) {
    const [copied, setCopied] = useState(false);
    const [localRevealed, setLocalRevealed] = useState(isRevealed);

    const handleCopyCode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!offer.code) return;

        vibrate('medium');
        try {
            await navigator.clipboard.writeText(offer.code);
            setCopied(true);
            toast.success("Code copied!", { duration: 2000 });
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    const handleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        vibrate('medium');
        setLocalRevealed(true);

        // Auto-copy on reveal
        if (offer.code) {
            navigator.clipboard.writeText(offer.code).then(() => {
                setCopied(true);
                toast.success("Code copied!", {
                    icon: "✓",
                    description: "Ready to paste at checkout",
                    duration: 3000
                });
                setTimeout(() => setCopied(false), 3000);
            }).catch(() => { });
        }

        onReveal?.();
    };

    const isCodeReveal = offer.redemptionType === 'CODE_REVEAL' || (!offer.redemptionType && offer.code);
    const showRevealed = localRevealed || isRevealed;

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "group relative w-full overflow-hidden rounded-2xl bg-[#111] border border-[#222] cursor-pointer",
                "hover:border-[#333] transition-all duration-300"
            )}
        >
            {/* Top Section - Gradient Background with Offer Title */}
            <div className="relative h-36 w-full overflow-hidden bg-[#000]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black" />

                {/* Decorative Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.12),transparent_60%)]" />

                {/* Green Badge - Top Left */}
                <div className="absolute top-3 left-3 bg-green-500 text-black text-[11px] font-bold px-2.5 py-1 rounded-md z-10 shadow-lg shadow-green-900/20">
                    STUDENT DEAL
                </div>

                {/* Heart Icon - Top Right */}
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white text-white hover:text-black transition-colors z-10"
                >
                    <Heart className="h-4 w-4" />
                </button>

                {/* Offer Title - Centered Large */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <h3 className="text-2xl font-black text-white text-center tracking-tight leading-tight">
                        {offer.title}
                    </h3>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111] to-transparent" />
            </div>

            {/* Content Section */}
            <div className="relative px-4 pb-4 -mt-4">
                {/* Brand Pill */}
                <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-3 py-1.5 rounded-full mb-3 shadow-xl">
                    {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="" className="h-4 w-4 rounded-full object-contain bg-white" />
                    ) : (
                        <Gift className="h-3.5 w-3.5 text-green-400" />
                    )}
                    <span className="text-[11px] font-medium text-white/90 max-w-[120px] truncate">
                        {brand.name}
                    </span>
                </div>

                {/* Description */}
                {offer.description && (
                    <p className="text-[#888] text-sm leading-relaxed mb-3 line-clamp-2">
                        {offer.description}
                    </p>
                )}

                {/* Coupon Code Section - Matching User's Screenshot */}
                {offer.code && (
                    <div className="mb-4">
                        <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest mb-2">
                            Coupon Code
                        </p>

                        {showRevealed ? (
                            /* REVEALED STATE - Code Visible */
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="flex items-center gap-2"
                            >
                                <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 flex items-center justify-center">
                                    <span className="text-lg font-mono font-bold text-white tracking-[0.12em]">
                                        {offer.code}
                                    </span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleCopyCode}
                                    className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                        copied
                                            ? "bg-green-500 text-white"
                                            : "bg-[#1a1a1a] border border-[#333] text-white hover:bg-[#222]"
                                    )}
                                >
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                </motion.button>
                            </motion.div>
                        ) : (
                            /* HIDDEN STATE - Blurred Code */
                            <div className="relative bg-[#0a0a0a] border border-dashed border-[#333] rounded-xl px-4 py-3">
                                <div className="flex items-center justify-center">
                                    <span className="text-lg font-mono font-bold text-[#333] tracking-[0.12em] blur-sm select-none">
                                        {offer.code}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                    {/* Expiry */}
                    {offer.expiryDate ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                            <Clock className="h-3 w-3" />
                            <span>Expires {new Date(offer.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                            <span>✓ Always active</span>
                        </div>
                    )}

                    {/* CTA Button */}
                    {isCodeReveal ? (
                        showRevealed ? (
                            /* Already revealed - show Go to Brand */
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    vibrate('light');
                                    if (offer.link) {
                                        window.open(offer.link, '_blank');
                                    } else if (brand.websiteUrl) {
                                        window.open(brand.websiteUrl, '_blank');
                                    }
                                }}
                                className="h-9 px-4 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all hover:shadow-xl"
                            >
                                Shop Now
                                <ExternalLink className="h-3.5 w-3.5" />
                            </motion.button>
                        ) : (
                            /* Not revealed - show Reveal button */
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleReveal}
                                className="h-9 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-green-500/25 transition-all"
                            >
                                <Gift className="h-3.5 w-3.5" />
                                Reveal Code
                            </motion.button>
                        )
                    ) : (
                        /* Direct redirect */
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                vibrate('light');
                                if (offer.link) {
                                    window.open(offer.link, '_blank');
                                }
                            }}
                            className="h-9 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-green-500/25 transition-all"
                        >
                            Get Deal
                            <ArrowRight className="h-3.5 w-3.5" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Bottom Shine Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
}
