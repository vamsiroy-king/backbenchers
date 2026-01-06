"use client";

import { motion } from "framer-motion";

interface BBLoaderProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    fullScreen?: boolean;
}

// Premium full-screen loader with logo pulse animation
export function BBLoader({ size = "md", text, fullScreen = false }: BBLoaderProps) {
    const sizes = {
        sm: { logo: "h-10 w-10", text: "text-xs", logoText: "text-base" },
        md: { logo: "h-14 w-14", text: "text-sm", logoText: "text-xl" },
        lg: { logo: "h-20 w-20", text: "text-base", logoText: "text-2xl" },
    };

    const loader = (
        <div className="flex flex-col items-center justify-center gap-4">
            {/* Premium Logo with pulse glow */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0)",
                        "0 0 0 16px rgba(34, 197, 94, 0.15)",
                        "0 0 0 0 rgba(34, 197, 94, 0)"
                    ]
                }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`${sizes[size].logo} rounded-2xl overflow-hidden flex items-center justify-center`}
            >
                <img src="/b-logo.png" alt="B" className="w-full h-full object-cover" />
            </motion.div>

            {/* Loading dots */}
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                            duration: 0.8,
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
                    transition={{ delay: 0.3 }}
                    className={`${sizes[size].text} text-white/40 font-medium`}
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

// Inline loader - small rotating logo
export function BBInlineLoader() {
    return (
        <div className="flex items-center justify-center py-8">
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center"
            >
                <img src="/b-logo.png" alt="B" className="w-full h-full object-cover" />
            </motion.div>
        </div>
    );
}

// Premium shimmer card placeholder
export function BBCardPlaceholder() {
    return (
        <div className="flex-none w-[280px] rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden relative">
            {/* Shimmer overlay */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
            />
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04]" />
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-white/[0.04] rounded-lg mb-2" />
                        <div className="h-3 w-16 bg-white/[0.03] rounded-lg" />
                    </div>
                </div>
                <div className="h-3 w-full bg-white/[0.03] rounded-lg mb-2" />
                <div className="h-3 w-2/3 bg-white/[0.03] rounded-lg" />
            </div>
        </div>
    );
}

// Premium page loader - full height section
export function BBPageLoader() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <BBLoader size="lg" />
        </div>
    );
}

// Section placeholder with shimmer
export function BBSectionPlaceholder({ title }: { title: string }) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4 px-5">
                <h2 className="text-white font-semibold">{title}</h2>
                <div className="h-4 w-12 bg-white/[0.04] rounded-lg" />
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
                <BBCardPlaceholder />
                <BBCardPlaceholder />
            </div>
        </div>
    );
}

export default BBLoader;
