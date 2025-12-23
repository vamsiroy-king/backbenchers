"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, Sparkles, ThumbsUp, Heart, Zap, Crown } from "lucide-react";
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
    { emoji: "😞", label: "Poor", color: "from-red-400 to-red-500" },
    { emoji: "😕", label: "Fair", color: "from-orange-400 to-orange-500" },
    { emoji: "😊", label: "Good", color: "from-yellow-400 to-yellow-500" },
    { emoji: "😄", label: "Great", color: "from-lime-400 to-green-500" },
    { emoji: "🤩", label: "Amazing!", color: "from-emerald-400 to-teal-500" },
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
    const [hoveredStar, setHoveredStar] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (stars === 0) {
            setError("Please tap a star to rate");
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log('[RatingModal] Submitting rating:', { stars, reviewText, merchantId, studentId, transactionId });

            const result = await ratingService.submitRating({
                studentId,
                merchantId,
                transactionId,
                stars,
                reviewText: reviewText.trim() || undefined
            });

            console.log('[RatingModal] Submit result:', result);

            if (result.success) {
                setSubmitted(true);
                onRatingSubmitted?.();
                // Auto close after 2.5 seconds
                setTimeout(() => {
                    onClose();
                }, 2500);
            } else {
                setError(result.error || "Failed to submit rating");
            }
        } catch (err) {
            console.error('[RatingModal] Error:', err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const activeRating = hoveredStar || stars;
    const currentLabel = activeRating > 0 ? RATING_LABELS[activeRating - 1] : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={handleSkip}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
                    >
                        {!submitted ? (
                            <>
                                {/* Header with gradient */}
                                <div className={`relative py-8 px-6 ${currentLabel ? `bg-gradient-to-br ${currentLabel.color}` : 'bg-gradient-to-br from-emerald-500 to-teal-600'} transition-all duration-300`}>
                                    {/* Close button */}
                                    <button
                                        onClick={handleSkip}
                                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                        <X className="h-4 w-4 text-white" />
                                    </button>

                                    {/* Animated background elements */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full blur-xl"
                                        />
                                    </div>

                                    {/* Rating emoji display */}
                                    <motion.div
                                        key={activeRating}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative text-center"
                                    >
                                        <div className="text-6xl mb-3">
                                            {currentLabel?.emoji || "⭐"}
                                        </div>
                                        <h2 className="text-xl font-bold text-white drop-shadow-lg">
                                            {currentLabel?.label || "Rate Your Experience"}
                                        </h2>
                                        <p className="text-white/80 text-sm mt-1 font-medium">
                                            {merchantName}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Star Rating - Interactive */}
                                <div className="px-6 py-6">
                                    <div className="flex justify-center gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map((starNum) => (
                                            <motion.button
                                                key={starNum}
                                                onClick={() => setStars(starNum)}
                                                onMouseEnter={() => setHoveredStar(starNum)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                whileTap={{ scale: 0.9 }}
                                                whileHover={{ scale: 1.15 }}
                                                className="relative p-1"
                                            >
                                                {/* Glow effect for active stars */}
                                                {starNum <= activeRating && (
                                                    <motion.div
                                                        layoutId={`glow-${starNum}`}
                                                        className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl"
                                                    />
                                                )}
                                                <Star
                                                    className={`h-11 w-11 relative z-10 transition-all duration-200 ${starNum <= activeRating
                                                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                                                            : 'text-gray-600 hover:text-gray-500'
                                                        }`}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Quick feedback tags */}
                                    {stars > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-wrap justify-center gap-2 mb-4"
                                        >
                                            {stars >= 4 && (
                                                <>
                                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                                                        🍕 Great Food
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                                                        ⚡ Fast Service
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                                                        💰 Great Value
                                                    </span>
                                                </>
                                            )}
                                            {stars <= 2 && (
                                                <>
                                                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                                                        🐢 Slow Service
                                                    </span>
                                                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                                                        👎 Needs Improvement
                                                    </span>
                                                </>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Review Text - Compact */}
                                    <div className="mb-4">
                                        <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Add a quick note (optional)..."
                                            className="w-full h-16 p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 resize-none outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                                            maxLength={200}
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-sm text-center mb-3 bg-red-500/10 py-2 rounded-lg"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    {/* Actions - Always visible */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSkip}
                                            className="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold rounded-xl transition-colors"
                                        >
                                            Skip
                                        </button>
                                        <motion.button
                                            onClick={handleSubmit}
                                            disabled={loading || stars === 0}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex-1 h-12 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${stars > 0
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {loading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Submit
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Success State - Celebration */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 px-6"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
                                    className="text-center"
                                >
                                    {/* Celebration animation */}
                                    <div className="relative">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 10, -10, 0]
                                            }}
                                            transition={{ duration: 0.5, repeat: 2 }}
                                            className="text-7xl mb-4"
                                        >
                                            🎉
                                        </motion.div>

                                        {/* Sparkle effects */}
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{
                                                    opacity: [0, 1, 0],
                                                    scale: [0, 1, 0],
                                                    x: [0, (i % 2 ? 1 : -1) * (40 + i * 10)],
                                                    y: [0, -30 - i * 15]
                                                }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className="absolute top-1/2 left-1/2 text-2xl"
                                            >
                                                ✨
                                            </motion.div>
                                        ))}
                                    </div>

                                    <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
                                    <p className="text-gray-400 text-sm mb-4">Your review helps fellow students discover great places!</p>

                                    {/* Stars awarded badge */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-full border border-yellow-500/30"
                                    >
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                        <span className="text-yellow-400 font-medium text-sm">+10 BB Points</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
