"use client";

import { Button } from "@/components/ui/button";
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
                if (window.location.hash && window.location.hash.includes('access_token')) {
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
            // CRITICAL: Set auth_flow markers BEFORE OAuth redirect
            // This ensures we route back to merchant callback, not student
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-primary rounded-2xl mb-6 shadow-lg shadow-primary/30">
                        <span className="text-white font-bold text-2xl">B</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Merchant Login</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {hasStoredSession ? `Welcome back, ${storedBusinessName}!` : "Welcome back, partner!"}
                    </p>
                </div>

                {/* Device-bound indicator */}
                {hasStoredSession && loginMethod === 'passcode' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-6 flex items-center gap-3"
                    >
                        <Smartphone className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Recognized Device</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Quick passcode login available</p>
                        </div>
                    </motion.div>
                )}

                {/* Login Method Toggle */}
                {hasStoredSession && (
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 mb-8">
                        <button
                            onClick={() => setLoginMethod('passcode')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'passcode' ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <KeyRound className="h-4 w-4" />
                            Quick Passcode
                        </button>
                        <button
                            onClick={() => setLoginMethod('google')}
                            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'google' ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
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
                                <div className="h-16 w-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Enter your 6-digit passcode</p>
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
                                        className={`w-12 h-14 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all ${passcodeError ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600' : 'bg-gray-100 dark:bg-gray-800 focus:bg-primary/5 dark:focus:bg-primary/20 dark:text-white'}`}
                                    />
                                ))}
                            </div>

                            {passcodeError && (
                                <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    {passcodeError}
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}

                            <button
                                onClick={() => setLoginMethod('google')}
                                className="w-full text-center text-gray-500 dark:text-gray-400 text-sm hover:text-primary transition-colors"
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
                            <Button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full h-14 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-2xl text-base shadow-lg"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            {/* DEV MODE: Quick login for test merchant */}
                            {process.env.NODE_ENV === 'development' && (
                                <Button
                                    onClick={() => {
                                        // Set dev user ID if not exists
                                        if (!localStorage.getItem('dev_merchant_user_id')) {
                                            localStorage.setItem('dev_merchant_user_id', crypto.randomUUID());
                                        }
                                        // Navigate to pending page or dashboard
                                        router.push('/merchant/onboarding/pending');
                                    }}
                                    className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-2xl text-base"
                                >
                                    🧪 DEV: Login as test@merchant.dev
                                </Button>
                            )}

                            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 dark:border-primary/20">
                                <p className="text-sm text-primary/80 dark:text-primary">
                                    New merchant? Complete your business profile after signing in to get approved.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Register Link */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
                    New partner?{" "}
                    <Link href="/merchant/auth/signup" className="text-primary font-semibold hover:underline">
                        Register Business
                    </Link>
                </p>

                {/* Footer branding */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
                    Backbenchers Merchant Portal
                </p>
            </div>
        </div>
    );
}

