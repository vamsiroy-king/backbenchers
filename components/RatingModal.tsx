"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, Send } from "lucide-react";
import { Button } from "./ui/button";
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
            setError("Please select a rating");
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
                reviewText: reviewText.trim() || undefined
            });

            if (result.success) {
                setSubmitted(true);
                onRatingSubmitted?.();
                // Auto close after 2 seconds
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(result.error || "Failed to submit rating");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
                >
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleSkip}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {!submitted ? (
                            <>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="h-16 w-16 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Star className="h-8 w-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold">Rate Your Experience</h2>
                                    <p className="text-sm text-gray-500 mt-1">How was your visit to {merchantName}?</p>
                                </div>

                                {/* Star Rating */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((starNum) => (
                                        <button
                                            key={starNum}
                                            onClick={() => setStars(starNum)}
                                            onMouseEnter={() => setHoveredStar(starNum)}
                                            onMouseLeave={() => setHoveredStar(0)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-10 w-10 transition-colors ${starNum <= (hoveredStar || stars)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Star Label */}
                                {stars > 0 && (
                                    <p className="text-center text-sm font-medium text-gray-600 mb-4">
                                        {stars === 1 && "😞 Poor"}
                                        {stars === 2 && "😐 Below Average"}
                                        {stars === 3 && "🙂 Average"}
                                        {stars === 4 && "😊 Good"}
                                        {stars === 5 && "🤩 Excellent!"}
                                    </p>
                                )}

                                {/* Review Text */}
                                <div className="mb-6">
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Share your experience (optional)..."
                                        className="w-full h-24 p-4 bg-gray-100 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30"
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-400 text-right mt-1">{reviewText.length}/500</p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSkip}
                                        className="flex-1 h-12 bg-gray-100 text-gray-600 font-semibold rounded-xl"
                                    >
                                        Skip
                                    </button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || stars === 0}
                                        className="flex-1 h-12 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Submit
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            /* Success State */
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🎉</span>
                                </div>
                                <h2 className="text-xl font-bold text-green-600 mb-2">Thank You!</h2>
                                <p className="text-gray-500 text-sm">Your review helps other students!</p>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
