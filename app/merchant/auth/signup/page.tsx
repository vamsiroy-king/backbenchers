"use client";

import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

export default function MerchantSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [error, setError] = useState("");

    // Check if already logged in as merchant
    useEffect(() => {
        async function checkAuth() {
            try {
                // If URL has hash fragment (OAuth tokens), redirect to merchant callback
                if (window.location.hash?.includes('access_token')) {
                    console.log('OAuth tokens detected - redirecting to merchant callback');
                    localStorage.removeItem('auth_flow');
                    router.replace('/merchant/auth/callback' + window.location.hash);
                    return;
                }

                const user = await authService.getCurrentUser();
                if (user) {
                    // Only auto-redirect for FULLY APPROVED merchants
                    if (user.role === 'merchant' && user.isComplete) {
                        router.push('/merchant/dashboard');
                        return;
                    }

                    // Clear any pending/incomplete sessions for fresh start
                    if (user.role === 'pending' || (user.role === 'merchant' && !user.isComplete)) {
                        console.log('Incomplete merchant session - clearing for fresh start');
                        await authService.logout();
                        localStorage.removeItem('merchant_business');
                        localStorage.removeItem('merchant_location');
                        localStorage.removeItem('merchant_documents');
                    }
                }
            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setCheckingAuth(false);
            }
        }
        checkAuth();
    }, [router]);

    // Google OAuth signup
    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        try {
            // Mark that we're in merchant signup flow
            localStorage.setItem('auth_flow', 'merchant');
            sessionStorage.setItem('auth_flow', 'merchant');

            const result = await authService.merchantSignupWithGoogle();
            if (!result.success) {
                setError(result.error || "Failed to sign up with Google");
                localStorage.removeItem('auth_flow');
                setLoading(false);
            }
            // OAuth will redirect automatically
        } catch (error: any) {
            setError(error.message);
            localStorage.removeItem('auth_flow');
            setLoading(false);
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
            {/* Header with Branding */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="h-16 w-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                        <span className="text-black font-bold text-2xl">B</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Merchant Login</h1>
                    <p className="text-white/50 text-sm">Welcome back, partner!</p>
                </motion.div>

                {/* Google Sign In Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-sm space-y-4"
                >
                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full h-14 bg-white hover:bg-gray-50 text-black font-semibold rounded-2xl text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-red-400 text-center"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Info Card */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mt-6">
                        <p className="text-sm text-green-400">
                            New merchant? Complete your business profile after signing in to get approved.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-8 text-center space-y-4">
                <p className="text-white/40 text-sm">
                    New partner?{" "}
                    <Link href="/merchant/auth/login" className="text-green-400 font-semibold">
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
