"use client";

import { motion } from "framer-motion";

export function ConnectingLines() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Main vertical line - Left side */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-[20px] top-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
            />

            {/* Main vertical line - Right side */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                className="absolute right-[20px] top-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
            />

            {/* Horizontal connection lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Glowing nodes at intersections - Subtle industrial feel */}
            <div className="absolute top-[20%] left-[20px] w-1 h-1 bg-green-500/50 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <div className="absolute top-[60%] right-[20px] w-1 h-1 bg-green-500/50 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
    );
}
