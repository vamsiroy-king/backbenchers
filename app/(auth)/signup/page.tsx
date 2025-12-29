"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authService } from "@/lib/services/auth.service";
import AuthFooter from "@/components/AuthFooter";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if user is already a verified STUDENT - only then auto-login
    // Incomplete sessions (pending) are cleared so users start fresh
    useEffect(() => {
        async function checkExistingUser() {
            try {
                // If URL has hash fragment (OAuth tokens), redirect to callback
                // This handles the case where Supabase redirects here instead of /auth/callback
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    console.log('OAuth tokens detected - redirecting to callback');
                    const authFlow = localStorage.getItem('auth_flow');
                    if (authFlow === 'merchant') {
                        localStorage.removeItem('auth_flow');
                        router.replace('/merchant/auth/callback' + window.location.hash);
                    } else {
                        router.replace('/auth/callback' + window.location.hash);
                    }
                    return;
                }

                const user = await authService.getCurrentUser();
                console.log('Signup page - getCurrentUser result:', user);

                if (user) {
                    // Redirect verified students to dashboard
                    if (user.role === 'student' && user.isComplete) {
                        console.log('Verified student - redirecting to dashboard');
                        router.push("/dashboard");
                        return;
                    }

                    // Redirect verified merchants to their dashboard
                    if (user.role === 'merchant' && user.isComplete) {
                        console.log('Verified merchant - redirecting to merchant dashboard');
                        router.push("/merchant/dashboard");
                        return;
                    }

                    // User is logged in but profile is not complete - redirect to verify/onboarding
                    if (!user.isComplete) {
                        console.log('User logged in but profile incomplete - redirecting to /verify');
                        window.location.href = "/verify";
                        return;
                    }

                    console.log('User role:', user.role, 'isComplete:', user.isComplete);
                }
            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setCheckingAuth(false);
            }
        }
        checkExistingUser();
    }, [router]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            // Mark that we're in student signup flow
            localStorage.setItem('auth_flow', 'student');

            // Sign in with Google - goes through /auth/callback which
            // checks if user exists and routes to dashboard or verify accordingly
            await authService.signInWithGoogle(); // Uses default /auth/callback
        } catch (error) {
            console.error("Google sign in error:", error);
            localStorage.removeItem('auth_flow');
            setLoading(false);
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
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] -z-10 -translate-x-1/3 translate-y-1/3" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-white/[0.04] backdrop-blur-xl p-8 rounded-3xl border border-white/[0.08] shadow-2xl"
            >
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-flex items-center text-sm text-white/50 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Link>
                    <div className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🎓</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Get Verified</h1>
                    <p className="text-white/50">
                        Sign in with Google to start your verification
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Google Sign In - Primary Action */}
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full h-14 text-base font-semibold bg-white hover:bg-gray-100 text-black"
                    >
                        {loading ? (
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
                            </>
                        )}
                    </Button>

                    <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                        <h3 className="font-semibold text-green-300 text-sm mb-2">How it works:</h3>
                        <ol className="text-green-400/80 text-xs space-y-1">
                            <li>1. Sign in with your Google account</li>
                            <li>2. Enter your college email (.edu.in only)</li>
                            <li>3. Verify with OTP sent to college email</li>
                            <li>4. Set up your quick passcode</li>
                        </ol>
                    </div>

                    <p className="text-center text-xs text-white/40">
                        Already verified?{" "}
                        <Link href="/login" className="text-green-400 font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
