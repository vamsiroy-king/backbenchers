"use client";

import { motion } from "framer-motion";
import { GraduationCap, QrCode, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface VerificationBannerProps {
    variant?: 'online' | 'offline';
    brandName?: string;
}

/**
 * Clean, minimal verification banner - District style
 * Inline card that doesn't block content
 */
export function VerificationBanner({ variant = 'offline', brandName }: VerificationBannerProps) {
    const isOnline = variant === 'online';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-6"
        >
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
                {/* Header Row */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                        {isOnline ? (
                            <Sparkles className="h-5 w-5 text-black" />
                        ) : (
                            <QrCode className="h-5 w-5 text-black" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <GraduationCap className="h-3.5 w-3.5 text-green-400" />
                            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">
                                Student Exclusive
                            </span>
                        </div>
                        <h3 className="text-white font-semibold text-sm">
                            {isOnline ? 'Unlock Discount Codes' : 'Get Your QR Pass'}
                        </h3>
                    </div>
                </div>

                {/* Description */}
                <p className="text-[#666] text-xs mb-4 leading-relaxed">
                    {isOnline
                        ? `Verify to reveal coupon codes${brandName ? ` for ${brandName}` : ''}.`
                        : `Get verified for your QR code${brandName ? ` at ${brandName}` : ' at checkout'}.`
                    }
                </p>

                {/* CTA Button */}
                <Link href="/signup">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-11 bg-green-500 text-black font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
                    >
                        Get Verified — Free
                        <ArrowRight className="h-4 w-4" />
                    </motion.button>
                </Link>

                {/* Trust line */}
                <p className="text-[#444] text-[10px] text-center mt-3">
                    One-time • 2 min • 50K+ verified
                </p>
            </div>
        </motion.div>
    );
}
