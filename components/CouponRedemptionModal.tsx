"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, Gift, ArrowRight, Timer, Sparkles } from "lucide-react";
import { OnlineOffer, OnlineBrand } from "@/lib/types";
import { toast } from "sonner";
import { vibrate } from "@/lib/haptics";

interface CouponRedemptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: OnlineOffer;
    brand: OnlineBrand;
}

export function CouponRedemptionModal({ isOpen, onClose, offer, brand }: CouponRedemptionModalProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Reset state when modal opens with new offer
    useEffect(() => {
        if (isOpen) {
            setIsRevealed(false);
            setIsCopied(false);
            setIsRedirecting(false);
        }
    }, [isOpen, offer.id]);

    const handleRevealAndCopy = async () => {
        vibrate('medium');
        setIsRevealed(true);

        // Auto-copy to clipboard
        if (offer.code) {
            try {
                await navigator.clipboard.writeText(offer.code);
                setIsCopied(true);
                toast.success("Code copied!", {
                    icon: "✓",
                    description: "Ready to paste at checkout",
                    duration: 3000,
                });
            } catch (err) {
                console.error("Failed to copy code:", err);
            }
        }
    };

    const handleCopyCode = async () => {
        if (offer.code) {
            vibrate('light');
            try {
                await navigator.clipboard.writeText(offer.code);
                setIsCopied(true);
                toast.success("Copied!", { duration: 1500 });
                setTimeout(() => setIsCopied(false), 2500);
            } catch (err) {
                toast.error("Failed to copy");
            }
        }
    };

    const handleVisitSite = () => {
        vibrate('light');
        if (offer.link) {
            setIsRedirecting(true);
            setTimeout(() => {
                window.open(offer.link, "_blank", "noopener,noreferrer");
                setIsRedirecting(false);
            }, 400);
        } else if (brand.websiteUrl) {
            setIsRedirecting(true);
            setTimeout(() => {
                window.open(brand.websiteUrl, "_blank", "noopener,noreferrer");
                setIsRedirecting(false);
            }, 400);
        }
    };

    const handleDirectRedirect = () => {
        if (offer.link) {
            vibrate('light');
            setIsRedirecting(true);
            setTimeout(() => {
                window.open(offer.link, "_blank", "noopener,noreferrer");
                onClose();
            }, 600);
        }
    };

    const isCodeReveal = offer.redemptionType === 'CODE_REVEAL' || (!offer.redemptionType && offer.code);
    const couponCode = offer.code || 'NO CODE';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Modal - Bottom Sheet on Mobile */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        className="fixed inset-x-0 bottom-0 z-[101] md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[420px] md:w-full"
                    >
                        <div className="bg-[#111] rounded-t-[32px] md:rounded-[24px] overflow-hidden border-t border-[#222] md:border shadow-2xl">

                            {/* Drag Handle (Mobile) */}
                            <div className="flex justify-center pt-3 pb-2 md:hidden">
                                <div className="w-12 h-1 rounded-full bg-[#333]" />
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2.5 rounded-full bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-colors z-20 md:top-5 md:right-5"
                            >
                                <X className="h-5 w-5 text-[#888]" />
                            </button>

                            {/* Brand Header */}
                            <div className="px-6 pt-4 pb-5 md:pt-6">
                                <div className="flex items-center gap-4">
                                    {/* Brand Logo */}
                                    <div className="h-16 w-16 rounded-2xl bg-white overflow-hidden flex-shrink-0 shadow-xl">
                                        {brand.logoUrl ? (
                                            <img
                                                src={brand.logoUrl}
                                                alt={brand.name}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{brand.name[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-white truncate">{brand.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/20">
                                                <Sparkles className="h-3 w-3" />
                                                Student Deal
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Offer Details Card */}
                            <div className="px-6">
                                <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-[#222]">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20">
                                            <Gift className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white leading-snug">{offer.title}</h3>
                                            {offer.description && (
                                                <p className="text-sm text-[#888] mt-1.5 leading-relaxed">{offer.description}</p>
                                            )}
                                            {offer.expiryDate && (
                                                <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-400/80">
                                                    <Timer className="h-3.5 w-3.5" />
                                                    <span>Valid until {new Date(offer.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Code Reveal Mode */}
                            {isCodeReveal && (
                                <div className="px-6 pt-5 pb-6">
                                    <AnimatePresence mode="wait">
                                        {!isRevealed ? (
                                            /* ========== INITIAL STATE: REVEAL BUTTON ========== */
                                            <motion.div
                                                key="reveal-btn"
                                                initial={{ opacity: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                {/* Coupon Code Label */}
                                                <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest mb-2.5">
                                                    Coupon Code
                                                </p>

                                                {/* Code Box - Hidden */}
                                                <div className="relative bg-[#0a0a0a] border border-dashed border-[#333] rounded-xl p-4 mb-5">
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-xl font-mono font-bold text-[#333] tracking-[0.2em] select-none blur-sm">
                                                            {couponCode}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Reveal Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleRevealAndCopy}
                                                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-base rounded-xl shadow-lg shadow-green-500/25 flex items-center justify-center gap-2.5 transition-all"
                                                >
                                                    <Gift className="h-5 w-5" />
                                                    Reveal Code & Activate
                                                </motion.button>
                                            </motion.div>
                                        ) : (
                                            /* ========== REVEALED STATE: SHOW CODE ========== */
                                            <motion.div
                                                key="revealed"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                                className="space-y-4"
                                            >
                                                {/* Success Badge */}
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 text-sm font-semibold border border-green-500/20">
                                                        <Check className="h-4 w-4" />
                                                        Code Ready!
                                                    </div>
                                                </div>

                                                {/* Coupon Code Label */}
                                                <p className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
                                                    Coupon Code
                                                </p>

                                                {/* Revealed Code Box */}
                                                <motion.div
                                                    onClick={handleCopyCode}
                                                    className="relative bg-[#0a0a0a] border border-green-500/30 rounded-xl p-4 cursor-pointer group active:scale-[0.98] transition-transform"
                                                    initial={{ scale: 0.95 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-2xl font-mono font-bold tracking-[0.15em] text-white">
                                                            {couponCode}
                                                        </span>
                                                        <motion.div
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className={`p-3 rounded-xl transition-colors ${isCopied
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-[#1a1a1a] text-white group-hover:bg-[#222] border border-[#333]'
                                                                }`}
                                                        >
                                                            {isCopied ? (
                                                                <Check className="h-5 w-5" />
                                                            ) : (
                                                                <Copy className="h-5 w-5" />
                                                            )}
                                                        </motion.div>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isCopied && (
                                                            <motion.p
                                                                initial={{ opacity: 0, y: -5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0 }}
                                                                className="text-sm text-green-400 mt-3 flex items-center gap-1.5 font-medium"
                                                            >
                                                                <Check className="h-4 w-4" /> Copied to clipboard!
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>

                                                {/* Visit Website Button */}
                                                <motion.button
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.15 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleVisitSite}
                                                    disabled={isRedirecting}
                                                    className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                                                >
                                                    {isRedirecting ? (
                                                        "Opening..."
                                                    ) : (
                                                        <>
                                                            Go to {brand.name}
                                                            <ArrowRight className="h-5 w-5" />
                                                        </>
                                                    )}
                                                </motion.button>

                                                {/* Instruction */}
                                                <p className="text-center text-sm text-[#555]">
                                                    Paste this code at checkout
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Direct Redirect Mode */}
                            {!isCodeReveal && (
                                <div className="px-6 pt-5 pb-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDirectRedirect}
                                        disabled={isRedirecting}
                                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-black font-bold text-base rounded-xl shadow-lg shadow-green-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70"
                                    >
                                        {isRedirecting ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                                    className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full"
                                                />
                                                Redirecting...
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="h-5 w-5" />
                                                Get Discount
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-sm text-[#555] mt-4">
                                        You'll be redirected with your discount applied
                                    </p>
                                </div>
                            )}

                            {/* Footer Branding */}
                            <div className="px-6 pb-6 pt-2 border-t border-[#1a1a1a]">
                                <p className="text-center text-xs text-[#444]">
                                    Exclusive student discount by{" "}
                                    <span className="text-green-400 font-semibold">Backbenchers</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
