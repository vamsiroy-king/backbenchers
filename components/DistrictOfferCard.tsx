"use client";

import { motion } from "framer-motion";
import { ArrowRight, Heart, Clock, Store, Tag } from "lucide-react";
import { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DistrictOfferCardProps {
    offer: Offer;
    onClick?: () => void;
    priority?: boolean;
}

export function DistrictOfferCard({ offer, onClick, priority = false }: DistrictOfferCardProps) {
    const discountDisplay = offer.type === 'percentage'
        ? `${offer.discountValue}% OFF`
        : offer.type === 'flat'
            ? `₹${offer.discountValue} OFF`
            : 'DEAL';

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
            {/* Top Section: Standard Image/Pattern */}
            <div className="relative h-40 w-full overflow-hidden bg-[#000]">
                {/* Standard Gradient Background (Clean) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black" />

                {/* 1. Green Discount Badge (Top-Left Standard) */}
                <div className="absolute top-3 left-3 bg-green-500 text-black text-[11px] font-bold px-2.5 py-1 rounded-md z-10 shadow-lg shadow-green-900/20">
                    {discountDisplay}
                </div>

                {/* 2. Heart Icon (Top-Right Consistent) */}
                <button className="absolute top-3 right-3 h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white text-white hover:text-black transition-colors z-10">
                    <Heart className="h-4 w-4" />
                </button>

                {/* Offer Visual/Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {offer.merchantLogo ? (
                        <img
                            src={offer.merchantLogo}
                            alt=""
                            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                    ) : (
                        // Fallback Pattern if no image
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.1),transparent_70%)]" />
                            <div className="flex h-full items-center justify-center">
                                <span className="text-4xl font-black text-white/5 tracking-tighter uppercase select-none">
                                    {offer.merchantName?.[0]}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111] to-transparent" />
            </div>

            {/* Content Section */}
            <div className="relative px-4 pb-4 -mt-6">
                {/* Merchant Pill */}
                <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-full mb-3 shadow-xl">
                    {offer.merchantLogo ? (
                        <img src={offer.merchantLogo} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                        <Store className="h-3 w-3 text-white/60" />
                    )}
                    <span className="text-[11px] font-medium text-white/90 max-w-[100px] truncate">
                        {offer.merchantName}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-bold text-white leading-tight mb-1.5 tracking-tight group-hover:text-green-400 transition-colors">
                    {offer.title}
                </h3>

                {/* Location / Valid Until */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#222]">
                    <div className="flex items-center gap-3">
                        {offer.validUntil && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                                <Clock className="h-3 w-3" />
                                <span>Expires {new Date(offer.validUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-6 rounded-full border border-[#333] flex items-center justify-center text-[#666] group-hover:border-green-500 group-hover:text-green-500 transition-colors">
                        <ArrowRight className="h-3 w-3" />
                    </div>
                </div>
            </div>

            {/* Bottom Shine Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
}
