"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomescreen() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (typeof window !== 'undefined') {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone === true;
            if (isStandalone) {
                setIsInstalled(true);
                return;
            }
        }

        // Capture the install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            // Show the button after a brief delay (only for new users)
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app was just installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setInstallPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
                setShowPrompt(false);
            }
            setInstallPrompt(null);
        } catch (error) {
            console.error('Install error:', error);
        }
    };

    // Don't show if already installed or no prompt available
    if (isInstalled || !showPrompt || !installPrompt) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-4 right-4 z-50 p-4 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-xl"
            >
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                        <Download className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm">Add to Homescreen</h3>
                        <p className="text-white/80 text-xs">Quick access • Faster loading</p>
                    </div>
                    <button
                        onClick={handleInstall}
                        className="px-4 py-2 bg-white text-primary font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="h-8 w-8 flex items-center justify-center text-white/50 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
