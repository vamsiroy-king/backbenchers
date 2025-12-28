"use client";

import { motion } from "framer-motion";

interface BBLoaderProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    fullScreen?: boolean;
}

export function BBLoader({ size = "md", text, fullScreen = false }: BBLoaderProps) {
    const sizes = {
        sm: { logo: "h-8 w-8", text: "text-xs" },
        md: { logo: "h-12 w-12", text: "text-sm" },
        lg: { logo: "h-16 w-16", text: "text-base" },
    };

    const loader = (
        <div className="flex flex-col items-center justify-center gap-3">
            {/* Animated Logo */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`${sizes[size].logo} rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25`}
            >
                <span className="text-white font-bold text-lg">B</span>
            </motion.div>

            {/* Loading dots */}
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -4, 0],
                            opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-green-500"
                    />
                ))}
            </div>

            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${sizes[size].text} text-white/50 font-medium`}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
                {loader}
            </div>
        );
    }

    return loader;
}

// Inline loader for sections (minimal, no text)
export function BBInlineLoader() {
    return (
        <div className="flex items-center justify-center py-8">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-6 w-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
            >
                <span className="text-white font-bold text-[10px]">B</span>
            </motion.div>
        </div>
    );
}

// Card placeholder for offer/merchant cards
export function BBCardPlaceholder() {
    return (
        <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex-none w-[280px] rounded-3xl bg-white/[0.04] border border-white/[0.06] overflow-hidden"
        >
            <div className="p-5">
                {/* Logo placeholder */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center">
                        <span className="text-white/20 font-bold text-sm">B</span>
                    </div>
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-white/[0.08] rounded-lg mb-2" />
                        <div className="h-3 w-16 bg-white/[0.05] rounded-lg" />
                    </div>
                </div>
                {/* Text placeholders */}
                <div className="h-3 w-full bg-white/[0.05] rounded-lg mb-2" />
                <div className="h-3 w-2/3 bg-white/[0.05] rounded-lg" />
            </div>
        </motion.div>
    );
}

// Section placeholder (for New on Backbenchers, etc.)
export function BBSectionPlaceholder({ title }: { title: string }) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-5">
                <h2 className="text-white font-semibold">{title}</h2>
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-4 w-12 bg-white/[0.08] rounded-lg"
                />
            </div>
            <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
                <BBCardPlaceholder />
                <BBCardPlaceholder />
            </div>
        </div>
    );
}

export default BBLoader;
