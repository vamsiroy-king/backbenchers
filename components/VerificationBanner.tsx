"use client";

import { motion } from "framer-motion";
import { GraduationCap, QrCode, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface VerificationBannerProps {
    variant?: 'online' | 'offline';
    brandName?: string;
}

/**
 * Premium verification banner shown to non-verified users
 * - online: For online brands, prompts to verify for code reveal
 * - offline: For offline merchants, prompts to verify for QR code
 */
export function VerificationBanner({ variant = 'offline', brandName }: VerificationBannerProps) {
    const isOnline = variant === 'online';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-black via-black/95 to-transparent"
        >
            <div className="max-w-[430px] mx-auto">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-5 backdrop-blur-sm">
                    {/* Icon + Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                            {isOnline ? (
                                <Sparkles className="h-6 w-6 text-black" />
                            ) : (
                                <QrCode className="h-6 w-6 text-black" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-green-400" />
                                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                                    Student Exclusive
                                </span>
                            </div>
                            <h3 className="text-white font-bold text-lg">
                                {isOnline ? 'Unlock Discount Codes' : 'Get Your QR Pass'}
                            </h3>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#888] text-sm mb-4 leading-relaxed">
                        {isOnline ? (
                            <>
                                Verify your student status to reveal exclusive coupon codes
                                {brandName && <> for <span className="text-white font-medium">{brandName}</span></>}.
                            </>
                        ) : (
                            <>
                                Get verified to unlock your personal QR code. Show it at checkout
                                {brandName && <> at <span className="text-white font-medium">{brandName}</span></>} to get your student discount.
                            </>
                        )}
                    </p>

                    {/* CTA Button */}
                    <Link href="/signup">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-12 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            Get Verified — It's Free
                            <ArrowRight className="h-4 w-4" />
                        </motion.button>
                    </Link>

                    {/* Trust text */}
                    <p className="text-[#555] text-[10px] text-center mt-3">
                        One-time verification • Takes 2 minutes • 50,000+ students verified
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
