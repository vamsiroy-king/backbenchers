"use client";

import { ArrowRight, KeyRound, Smartphone, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

export default function MerchantLoginPage() {
    const router = useRouter();
    const [hasStoredSession, setHasStoredSession] = useState(false);
    const [storedBusinessName, setStoredBusinessName] = useState("");
    const [loginMethod, setLoginMethod] = useState<'google' | 'passcode'>('google');
    const [passcode, setPasscode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [passcodeError, setPasscodeError] = useState("");
    const [checkingAuth, setCheckingAuth] = useState(true);
    const passcodeRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check for existing session
    useEffect(() => {
        async function checkAuth() {
            try {
                // If URL has hash fragment (OAuth tokens), redirect to merchant callback
                if (window.location.hash?.includes('access_token')) {
                    console.log('OAuth tokens detected on merchant login - redirecting to callback');
                    localStorage.removeItem('auth_flow');
                    router.replace('/merchant/auth/callback' + window.location.hash);
                    return;
                }

                const user = await authService.getCurrentUser();
                if (user && user.role === 'merchant') {
                    if (user.isComplete) {
                        router.push('/merchant/dashboard');
                        return;
                    }
                }

                // Check for stored passcode
                const hasPasscode = authService.hasStoredPasscode();
                const businessName = localStorage.getItem('bb_merchant_name');
                if (hasPasscode && businessName) {
                    setHasStoredSession(true);
                    setStoredBusinessName(businessName);
                    setLoginMethod('passcode');
                }
            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setCheckingAuth(false);
            }
        }
        checkAuth();
    }, [router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            localStorage.setItem('auth_flow', 'merchant');
            sessionStorage.setItem('auth_flow', 'merchant');
            await authService.merchantSignupWithGoogle();
        } catch (error) {
            console.error("Google login error:", error);
            localStorage.removeItem('auth_flow');
            sessionStorage.removeItem('auth_flow');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasscodeChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newPasscode = [...passcode];
        newPasscode[index] = value;
        setPasscode(newPasscode);
        setPasscodeError("");

        if (value && index < 5) {
            passcodeRefs.current[index + 1]?.focus();
        }

        if (newPasscode.every(d => d.length === 1)) {
            handlePasscodeLogin(newPasscode.join(''));
        }
    };

    const handlePasscodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !passcode[index] && index > 0) {
            passcodeRefs.current[index - 1]?.focus();
        }
    };

    const handlePasscodeLogin = async (code: string) => {
        setIsLoading(true);
        try {
            const result = await authService.loginWithPasscode(code);
            if (result.success) {
                router.push('/merchant/dashboard');
            } else {
                setPasscodeError(result.error || "Invalid passcode");
                setPasscode(["", "", "", "", "", ""]);
                passcodeRefs.current[0]?.focus();
            }
        } catch (error: any) {
            setPasscodeError(error.message);
            setPasscode(["", "", "", "", "", ""]);
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center"
                >
                    <span className="text-black font-bold text-lg">B</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Logo & Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="h-16 w-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                        <span className="text-black font-bold text-2xl">B</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Merchant Login</h1>
                    <p className="text-white/50 text-sm">
                        {hasStoredSession ? `Welcome back, ${storedBusinessName}!` : "Welcome back, partner!"}
                    </p>
                </motion.div>

                {/* Device-bound indicator */}
                {hasStoredSession && loginMethod === 'passcode' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 max-w-sm w-full"
                    >
                        <Smartphone className="h-5 w-5 text-blue-400" />
                        <div>
                            <p className="text-sm font-medium text-blue-300">Recognized Device</p>
                            <p className="text-xs text-blue-400/70">Quick passcode login available</p>
                        </div>
                    </motion.div>
                )}

                {/* Login Method Toggle */}
                {hasStoredSession && (
                    <div className="flex bg-[#111] border border-[#333] rounded-2xl p-1.5 mb-8 max-w-sm w-full">
                        <button
                            onClick={() => setLoginMethod('passcode')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'passcode' ? 'bg-[#222] text-white shadow-sm' : 'text-white/50'}`}
                        >
                            <KeyRound className="h-4 w-4" />
                            Quick Passcode
                        </button>
                        <button
                            onClick={() => setLoginMethod('google')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'google' ? 'bg-[#222] text-white shadow-sm' : 'text-white/50'}`}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                    </div>
                )}

                <div className="w-full max-w-sm">
                    <AnimatePresence mode="wait">
                        {loginMethod === 'passcode' && hasStoredSession ? (
                            <motion.div
                                key="passcode"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <KeyRound className="h-8 w-8 text-green-400" />
                                    </div>
                                    <p className="text-white/50 text-sm">Enter your 6-digit passcode</p>
                                </div>

                                <div className="flex justify-center gap-3">
                                    {passcode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { passcodeRefs.current[index] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePasscodeChange(index, e.target.value.replace(/\D/g, ''))}
                                            onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                                            disabled={isLoading}
                                            className={`w-12 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all bg-[#111] border text-white ${passcodeError ? 'border-red-500/50' : 'border-[#333] focus:border-green-500/50'}`}
                                        />
                                    ))}
                                </div>

                                {passcodeError && (
                                    <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {passcodeError}
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                                    </div>
                                )}

                                <button
                                    onClick={() => setLoginMethod('google')}
                                    className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors"
                                >
                                    Use Google sign-in instead
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="google"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="w-full h-14 bg-white hover:bg-gray-50 text-black font-semibold rounded-2xl text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Continue with Google
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>

                                {/* Info Card */}
                                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                                    <p className="text-sm text-green-400">
                                        New merchant? Complete your business profile after signing in to get approved.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-8 text-center space-y-4">
                <p className="text-white/40 text-sm">
                    New partner?{" "}
                    <Link href="/merchant/auth/signup" className="text-green-400 font-semibold hover:underline">
                        Register Business
                    </Link>
                </p>
                <p className="text-white/25 text-xs">
                    Backbenchers Merchant Portal
                </p>
            </div>
        </div>
    );
}
