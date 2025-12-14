"use client";

import { useAppStore } from '@/lib/stores';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingOverlay() {
    const { isLoading, loadingMessage } = useAppStore();

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4"
                    >
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-medium text-gray-600">{loadingMessage}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Inline loading spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return <Loader2 className={`${sizes[size]} text-primary animate-spin`} />;
}
