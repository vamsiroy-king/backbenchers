"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2 } from "lucide-react";
import { ratingService } from "@/lib/services/rating.service";

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    merchantId: string;
    merchantName: string;
    studentId: string;
    onRatingSubmitted?: () => void;
}

const RATING_LABELS = [
    { emoji: "😕", label: "Meh", vibe: "Could be better" },
    { emoji: "😐", label: "Okay", vibe: "It was alright" },
    { emoji: "🙂", label: "Good", vibe: "Pretty decent" },
    { emoji: "😊", label: "Great", vibe: "Loved it!" },
    { emoji: "🔥", label: "Fire!", vibe: "Absolute W" },
];

export function RatingModal({
    isOpen,
    onClose,
    transactionId,
    merchantId,
    merchantName,
    studentId,
    onRatingSubmitted
}: RatingModalProps) {
    const [stars, setStars] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (stars === 0) {
            setError("Tap a star to rate");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await ratingService.submitRating({
                studentId,
                merchantId,
                transactionId,
                stars,
                reviewText: undefined
            });

            if (result.success) {
                setSubmitted(true);
                onRatingSubmitted?.();
                setTimeout(() => onClose(), 2000);
            } else {
                setError(result.error || "Failed to submit");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const currentLabel = stars > 0 ? RATING_LABELS[stars - 1] : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-5"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xs bg-[#111] rounded-2xl border border-white/[0.08] overflow-hidden"
                    >
                        {!submitted ? (
                            <div className="p-6">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                                >
                                    <X className="h-3.5 w-3.5 text-white/50" />
                                </button>

                                {/* Header */}
                                <div className="text-center mb-6">
                                    <motion.div
                                        key={stars}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="text-4xl mb-2"
                                    >
                                        {currentLabel?.emoji || "⭐"}
                                    </motion.div>
                                    <h2 className="text-base font-semibold text-white">
                                        {currentLabel?.label || "How was it?"}
                                    </h2>
                                    <p className="text-xs text-white/50 mt-0.5">
                                        {currentLabel?.vibe || merchantName}
                                    </p>
                                </div>

                                {/* Stars - Minimal */}
                                <div className="flex justify-center gap-1.5 mb-5">
                                    {[1, 2, 3, 4, 5].map((starNum) => (
                                        <motion.button
                                            key={starNum}
                                            onClick={() => setStars(starNum)}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-1.5"
                                        >
                                            <Star
                                                className={`h-9 w-9 transition-all ${starNum <= stars
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-white/20'
                                                    }`}
                                            />
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Error */}
                                {error && (
                                    <p className="text-red-400 text-xs text-center mb-3">{error}</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 h-11 bg-white/[0.06] text-white/60 font-medium rounded-xl text-sm hover:bg-white/[0.1] transition-colors"
                                    >
                                        Skip
                                    </button>
                                    <motion.button
                                        onClick={handleSubmit}
                                        disabled={loading || stars === 0}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 h-11 font-semibold rounded-xl text-sm flex items-center justify-center transition-all ${stars > 0
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white/[0.06] text-white/30'
                                            }`}
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Submit"
                                        )}
                                    </motion.button>
                                </div>

                                {/* Subtle footer */}
                                <p className="text-[10px] text-white/30 text-center mt-4">
                                    They gave you a discount 💚
                                </p>
                            </div>
                        ) : (
                            /* Success State */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 10 }}
                                    className="text-5xl mb-3"
                                >
                                    🎉
                                </motion.div>
                                <h2 className="text-lg font-semibold text-white mb-1">Thanks!</h2>
                                <p className="text-xs text-white/50">Your rating helps others</p>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
