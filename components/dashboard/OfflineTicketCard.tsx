"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Tag, Ticket, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { vibrate } from "@/lib/haptics";

interface OfflineTicketCardProps {
    offer: {
        id: string;
        title: string;
        discountValue?: number;
        type?: 'percentage' | 'flat' | 'bogo';
        merchantId: string;
        merchantName?: string;
        merchantLogo?: string;
        merchantCity?: string;
        validUntil?: string;
        avgRating?: number;
    };
    isVerified: boolean;
    onVerifyClick?: () => void;
    onClick?: () => void;
}

export function OfflineTicketCard({
    offer,
    isVerified,
    onVerifyClick,
    onClick
}: OfflineTicketCardProps) {
    const router = useRouter();

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
        router.push(`/store/${offer.merchantId}`);
    };

    const getDiscountDisplay = () => {
        if (offer.type === 'percentage') return `${offer.discountValue}% OFF`;
        if (offer.type === 'flat') return `₹${offer.discountValue} OFF`;
        if (offer.type === 'bogo') return 'BUY 1 GET 1';
        return 'DEAL';
    };

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className="group relative w-[280px] h-[140px] flex-shrink-0 cursor-pointer"
        >
            {/* Ticket Shape Background */}
            <div className="absolute inset-0 bg-[#161616] rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/50">
                {/* Left Section (Merchant Logo & Discount) */}
                <div className="absolute top-0 bottom-0 left-0 w-[100px] bg-[#1a1a1a] border-r border-dashed border-white/10 flex flex-col items-center justify-center p-3 relative">
                    {/* Semi-circles for ticket holes */}
                    <div className="absolute -top-3 right-[-10px] w-5 h-5 rounded-full bg-black border border-white/10" />
                    <div className="absolute -bottom-3 right-[-10px] w-5 h-5 rounded-full bg-black border border-white/10" />

                    {/* Merchant Logo */}
                    <div className="h-14 w-14 rounded-full bg-black border border-white/10 overflow-hidden mb-3 p-1">
                        {offer.merchantLogo ? (
                            <img src={offer.merchantLogo} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <span className="text-xl font-bold text-white/30">
                                    {offer.merchantName?.[0]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Discount Value */}
                    <div className="text-center">
                        <span className="block text-[18px] font-black text-green-400 leading-none">
                            {offer.discountValue}{offer.type === 'percentage' ? '%' : ''}
                        </span>
                        <span className="text-[10px] font-bold text-white/50 uppercase">OFF</span>
                    </div>
                </div>

                {/* Right Section (Details) */}
                <div className="absolute top-0 bottom-0 right-0 left-[100px] p-4 flex flex-col justify-between">
                    {/* Header */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">STORE TICKET</span>
                            <Ticket className="h-3 w-3 text-white/20" />
                        </div>
                        <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">
                            {offer.title}
                        </h3>
                        <p className="text-[11px] text-white/60 mt-1 truncate">
                            {offer.merchantName}
                        </p>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.05]">
                            <MapPin className="h-3 w-3 text-white/40" />
                            <span className="text-[10px] font-medium text-white/60 truncate max-w-[80px]">
                                {offer.merchantCity || 'Nearby'}
                            </span>
                        </div>

                        <div className="ml-auto">
                            <button className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                <IndianRupee className="h-3.5 w-3.5 text-black font-bold" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Perforated Line Effect Overlay */}
                <div className="absolute top-2 bottom-2 left-[99px] w-[2px] z-10 hidden" style={{
                    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                    backgroundSize: '2px 6px'
                }} />
            </div>
        </motion.div>
    );
}

// Helper component for loading state
export function OfflineTicketSkeleton() {
    return (
        <div className="w-[280px] h-[140px] flex-shrink-0 bg-[#161616] rounded-2xl border border-white/[0.05] relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-[100px] border-r border-dashed border-white/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
        </div>
    );
}
