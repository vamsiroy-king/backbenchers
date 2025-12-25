"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Download, Chrome, Apple, Share, Plus, Check, X } from "lucide-react";

interface PWAInstallPromptProps {
    onComplete: () => void;
    forceShow?: boolean;
}

export function PWAInstallPrompt({ onComplete, forceShow = false }: PWAInstallPromptProps) {
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone && !forceShow) {
            setIsInstalled(true);
            onComplete();
            return;
        }

        // Check if user already completed install flow
        const hasCompletedInstall = localStorage.getItem('bb-pwa-installed');
        if (hasCompletedInstall && !forceShow) {
            onComplete();
            return;
        }

        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsAndroid(/android/.test(userAgent));

        // Listen for install prompt (Android Chrome)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        setShowPrompt(true);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [onComplete, forceShow]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            setInstalling(true);
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                localStorage.setItem('bb-pwa-installed', 'true');
                setIsInstalled(true);
                setTimeout(() => onComplete(), 1000);
            }
            setDeferredPrompt(null);
            setInstalling(false);
        }
    };

    const handleSkip = () => {
        // Mark as seen but remind later
        localStorage.setItem('bb-pwa-reminded', Date.now().toString());
        onComplete();
    };

    const handleConfirmInstalled = () => {
        localStorage.setItem('bb-pwa-installed', 'true');
        onComplete();
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-primary to-emerald-600 p-6 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-3xl font-black text-primary">B</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">Add to Home Screen</h2>
                        <p className="text-white/80 text-sm">Get the full app experience</p>
                    </div>

                    {/* Benefits */}
                    <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Works like a real app</p>
                                <p className="text-xs text-gray-500">No browser, instant access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Download className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">Quick redemptions</p>
                                <p className="text-xs text-gray-500">One tap to show your QR</p>
                            </div>
                        </div>
                    </div>

                    {/* Installation Instructions */}
                    <div className="px-5 pb-5">
                        {/* Android with prompt available */}
                        {deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                disabled={installing}
                                className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
                            >
                                {installing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Install App
                                    </>
                                )}
                            </button>
                        )}

                        {/* iOS Instructions */}
                        {isIOS && !deferredPrompt && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-3">
                                    Follow these steps:
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">1</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Tap</span>
                                        <Share className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Share button</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Tap</span>
                                        <Plus className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">"Add to Home Screen"</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">3</div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Tap "Add" in top right</span>
                                </div>
                                <button
                                    onClick={handleConfirmInstalled}
                                    className="w-full h-12 bg-primary text-white rounded-xl font-semibold mt-3 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    I've Added It
                                </button>
                            </div>
                        )}

                        {/* Android without prompt (not Chrome) */}
                        {isAndroid && !deferredPrompt && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Chrome className="w-5 h-5 text-gray-600" />
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Open in Chrome for best experience
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    Tap the menu (⋮) → "Add to Home screen"
                                </p>
                                <button
                                    onClick={handleConfirmInstalled}
                                    className="w-full h-12 bg-primary text-white rounded-xl font-semibold mt-3 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    I've Added It
                                </button>
                            </div>
                        )}

                        {/* Desktop or unknown */}
                        {!isIOS && !isAndroid && !deferredPrompt && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
                                <Chrome className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Open on your phone for the best experience
                                </p>
                                <button
                                    onClick={handleSkip}
                                    className="w-full h-12 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold mt-3"
                                >
                                    Continue on Desktop
                                </button>
                            </div>
                        )}

                        {/* Skip option */}
                        {(isIOS || isAndroid) && (
                            <button
                                onClick={handleSkip}
                                className="w-full text-center text-sm text-gray-400 mt-4 py-2"
                            >
                                Remind me later
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
