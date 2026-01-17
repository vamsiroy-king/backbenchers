"use client";

import { OnlineBrand } from "@/lib/types";
import { Globe, ExternalLink } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface OnlineBrandCardProps {
    brand: OnlineBrand;
    onClick: () => void;
    priority?: boolean;
}

export function OnlineBrandCard({ brand, onClick, priority = false }: OnlineBrandCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary/20"
        >
            {/* Cover Image Area */}
            <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                {brand.coverImageUrl ? (
                    <img
                        src={brand.coverImageUrl}
                        alt={brand.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Globe className="h-8 w-8" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

                {/* Floating Logo */}
                <div className="absolute -bottom-4 left-4 h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-10 transition-transform group-hover:scale-110">
                    {brand.logoUrl ? (
                        <img
                            src={brand.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
                            <span className="text-xs font-bold text-gray-400">{brand.name[0]}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="pt-6 pb-4 px-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white truncate pr-2">
                        {brand.name}
                    </h3>
                    {/* External Link Icon (subtle hint) */}
                    <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                    {brand.description || "Exclusive student offers"}
                </p>

                {/* Badge area */}
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Online
                    </span>
                    {brand.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                            {brand.category}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
