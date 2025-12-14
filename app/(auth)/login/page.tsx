"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, Smartphone, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

export default function StudentLoginPage() {
    const router = useRouter();
    const [hasStoredSession, setHasStoredSession] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'google' | 'passcode'>('google');
    const [passcode, setPasscode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [passcodeError, setPasscodeError] = useState("");
    const [checkingAuth, setCheckingAuth] = useState(true);
    const passcodeRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check for existing session and stored passcode
    useEffect(() => {
        async function checkAuth() {
            try {
                // Check if already logged in as a STUDENT
                const user = await authService.getCurrentUser();
                if (user && user.role === 'student' && user.isComplete) {
                    router.push('/dashboard');
                    return;
                }
                // If user is merchant/admin, do NOT redirect - this is student login page

                // Check if device has stored passcode
                const hasPasscode = authService.hasStoredPasscode();
                setHasStoredSession(hasPasscode);
                if (hasPasscode) {
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
            // Google login - if user exists, goes to dashboard; if not, goes to verify
            const result = await authService.loginWithGoogle();
            if (!result.success) {
                console.error("Google login error:", result.error);
            }
        } catch (error) {
            console.error("Google login error:", error);
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

        // Auto-advance
        if (value && index < 5) {
            passcodeRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
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
                router.push('/dashboard');
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="px-6 pt-16 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white font-bold text-2xl">B</span>
                    </div>
                </div>
                <h1 className="text-2xl font-extrabold mb-2">Welcome Back!</h1>
                <p className="text-gray-500 text-sm">
                    {hasStoredSession
                        ? "Enter your passcode to continue"
                        : "Sign in to access student perks"}
                </p>
            </div>

            <div className="flex-1 px-6 pt-8">
                {/* Device-bound indicator */}
                {hasStoredSession && loginMethod === 'passcode' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
                    >
                        <Smartphone className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Recognized Device</p>
                            <p className="text-xs text-blue-600">Passcode linked to this device</p>
                        </div>
                    </motion.div>
                )}

                {/* Login Method Toggle - Only show if has stored session */}
                {hasStoredSession && (
                    <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
                        <button
                            onClick={() => setLoginMethod('passcode')}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'passcode' ? 'bg-white shadow-md' : 'text-gray-500'}`}
                        >
                            <KeyRound className="h-4 w-4" />
                            Quick Passcode
                        </button>
                        <button
                            onClick={() => setLoginMethod('google')}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMethod === 'google' ? 'bg-white shadow-md' : 'text-gray-500'}`}
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
                                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-gray-600 text-sm">Enter your 6-digit passcode</p>
                            </div>

                            {/* Passcode Input */}
                            <div className="flex justify-center gap-2">
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
                                        className={`w-12 h-14 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all ${passcodeError ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-100 focus:bg-primary/5'}`}
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
                                className="w-full text-center text-gray-500 text-sm"
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
                            {/* Google Login Button */}
                            <Button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full h-14 bg-black hover:bg-gray-900 text-white font-semibold rounded-2xl text-base"
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

                            {!hasStoredSession && (
                                <div className="bg-blue-50 rounded-2xl p-4">
                                    <p className="text-xs text-blue-700">
                                        💡 Once you log in, you can set up a quick passcode for faster access on this device.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Signup Link */}
                <p className="text-center text-sm text-gray-500 mt-10">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary font-semibold">
                        Sign up
                    </Link>
                </p>

                {/* Security Info */}
                <div className="mt-8 bg-gray-50 rounded-2xl p-4">
                    <p className="text-[10px] text-gray-400 text-center">
                        🔒 Secure login. Passcode is device-bound and encrypted. Works only on this device.
                    </p>
                </div>
            </div>
        </div>
    );
}
