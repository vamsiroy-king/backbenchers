"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import AuthFooter from "@/components/AuthFooter";

export default function StudentLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check for existing session
    useEffect(() => {
        async function checkAuth() {
            try {
                const user = await authService.getCurrentUser();
                if (user && user.role === 'student' && user.isComplete) {
                    router.push('/dashboard');
                    return;
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

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-16 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                        <span className="text-white font-bold text-2xl">B</span>
                    </div>
                </div>
                <h1 className="text-2xl font-extrabold mb-2 text-white">Welcome Back!</h1>
                <p className="text-white/50 text-sm">
                    Sign in to access student perks
                </p>
            </div>

            <div className="flex-1 px-6 pt-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Google Login Button */}
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-14 bg-white hover:bg-gray-100 text-black font-semibold rounded-2xl text-base"
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

                    <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                        <p className="text-xs text-green-400">
                            💡 Your session stays active! Once logged in, you won't need to sign in again.
                        </p>
                    </div>
                </motion.div>

                {/* Signup Link */}
                <p className="text-center text-sm text-white/50 mt-10">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-green-400 font-semibold">
                        Sign up
                    </Link>
                </p>

                {/* Security Info */}
                <div className="mt-8 bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06]">
                    <p className="text-[10px] text-white/40 text-center">
                        🔒 Secure login with Google. Your session is encrypted and safe.
                    </p>
                </div>
            </div>

            {/* Professional Footer */}
            <AuthFooter />
        </div>
    );
}

