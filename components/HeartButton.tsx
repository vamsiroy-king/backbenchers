"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

interface HeartButtonProps {
    isFavorite: boolean;
    onToggle: (e: React.MouseEvent) => void;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function HeartButton({ isFavorite, onToggle, size = "md", className = "" }: HeartButtonProps) {
    const [showBurst, setShowBurst] = useState(false);

    const sizes = {
        sm: { icon: 16, burst: 24 },
        md: { icon: 20, burst: 32 },
        lg: { icon: 24, burst: 40 },
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isFavorite) {
            // Show burst animation when adding to favorites
            setShowBurst(true);
            setTimeout(() => setShowBurst(false), 500);
        }

        onToggle(e);
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`relative flex items-center justify-center ${className}`}
            whileTap={{ scale: 0.8 }}
        >
            {/* Main Heart Icon */}
            <motion.div
                initial={false}
                animate={isFavorite ? {
                    scale: [1, 1.3, 1],
                } : { scale: 1 }}
                transition={{
                    duration: 0.35,
                    ease: [0.32, 0.72, 0, 1]
                }}
            >
                <Heart
                    size={sizes[size].icon}
                    className={`transition-colors duration-200 ${isFavorite
                            ? "fill-red-500 text-red-500"
                            : "fill-transparent text-white/60 hover:text-white/80"
                        }`}
                    strokeWidth={2}
                />
            </motion.div>

            {/* Burst Animation (Instagram-style particles) */}
            <AnimatePresence>
                {showBurst && (
                    <>
                        {/* Ring burst */}
                        <motion.div
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div
                                className="rounded-full border-2 border-red-500"
                                style={{
                                    width: sizes[size].burst,
                                    height: sizes[size].burst
                                }}
                            />
                        </motion.div>

                        {/* Particle dots */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    scale: 0,
                                    x: 0,
                                    y: 0,
                                    opacity: 1
                                }}
                                animate={{
                                    scale: [0, 1, 0],
                                    x: Math.cos((i * 60) * Math.PI / 180) * 20,
                                    y: Math.sin((i * 60) * Math.PI / 180) * 20,
                                    opacity: [1, 1, 0]
                                }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    delay: i * 0.02
                                }}
                                className="absolute w-1.5 h-1.5 rounded-full bg-red-500"
                            />
                        ))}

                        {/* Inner glow */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute"
                        >
                            <Heart
                                size={sizes[size].icon}
                                className="fill-red-400 text-red-400 blur-sm"
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

export default HeartButton;
