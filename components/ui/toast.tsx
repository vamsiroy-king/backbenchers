"use client";

import { useAppStore } from '@/lib/stores';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
};

const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-orange-500',
};

export function ToastContainer() {
    const { toasts, dismissToast } = useAppStore();

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[400px] px-4 space-y-2">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = icons[toast.type];

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg ${colors[toast.type]}`}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${iconColors[toast.type]}`} />
                            <p className="flex-1 text-sm font-medium">{toast.message}</p>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="h-6 w-6 rounded-full hover:bg-black/5 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
