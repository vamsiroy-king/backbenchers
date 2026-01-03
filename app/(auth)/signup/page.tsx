"use client";

import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { authService } from "@/lib/services/auth.service";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'gmail_only') {
            setError('Only @gmail.com accounts are allowed.');
        }
    }, [searchParams]);

    useEffect(() => {
        async function checkExistingUser() {
            try {
                if (window.location.hash?.includes('access_token')) {
                    const authFlow = localStorage.getItem('auth_flow');
                    router.replace(authFlow === 'merchant' ? '/merchant/auth/callback' : '/auth/callback' + window.location.hash);
                    localStorage.removeItem('auth_flow');
                    return;
                }

                const user = await authService.getCurrentUser();
                if (user) {
                    if (user.role === 'student' && user.isComplete) { router.push("/dashboard"); return; }
                    if (user.role === 'merchant' && user.isComplete) { router.push("/merchant/dashboard"); return; }
                    if (!user.isComplete) { window.location.href = "/verify"; return; }
                }
            } catch (e) { console.error(e); }
            finally { setCheckingAuth(false); }
        }
        checkExistingUser();
    }, [router]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            localStorage.setItem('auth_flow', 'student');
            await authService.signInWithGoogle();
        } catch (e) {
            console.error(e);
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
                    className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center"
                >
                    <span className="text-black font-bold">B</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            {/* Mobile Container */}
            <div className="w-full max-w-[430px] min-h-screen bg-black flex flex-col px-6 pt-14 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center gap-2 text-[#666] hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-[13px]">Back</span>
                    </Link>
                    <Link href="/login" className="text-[13px] text-green-400 font-medium">
                        Sign in
                    </Link>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                >
                    {/* Logo */}
                    <div className="h-11 w-11 rounded-xl bg-green-500 flex items-center justify-center mb-8">
                        <span className="text-black font-bold text-lg">B</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-[22px] font-bold text-white mb-1.5">Get verified</h1>
                    <p className="text-[14px] text-[#666] mb-8">
                        Sign in with Google to start verification
                    </p>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6"
                        >
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </motion.div>
                    )}

                    {/* Google Button */}
                    <motion.button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-12 bg-white hover:bg-white/95 text-black font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 text-[14px]"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </motion.button>

                    {/* Steps */}
                    <div className="mt-8 p-4 bg-white/[0.03] border border-[#222] rounded-xl">
                        <p className="text-[10px] font-medium text-[#555] uppercase tracking-wider mb-4">How it works</p>
                        <div className="space-y-3">
                            {[
                                "Sign in with Google",
                                "Enter college email",
                                "Verify with OTP",
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                                        <span className="text-xs font-medium text-white/60">{i + 1}</span>
                                    </div>
                                    <span className="text-sm text-white/60">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DEV MODE: Test User Login */}
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <div className="flex items-center gap-4 my-4">
                                <div className="h-px flex-1 bg-orange-500/30" />
                                <span className="text-[10px] text-orange-400 uppercase">Dev Mode</span>
                                <div className="h-px flex-1 bg-orange-500/30" />
                            </div>
                            <motion.button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { supabase } = await import('@/lib/supabase');
                                        const { data: testStudent } = await supabase
                                            .from('students')
                                            .select('*')
                                            .eq('college_email', 'test@student.edu')
                                            .maybeSingle();

                                        if (testStudent) {
                                            localStorage.setItem('dev_test_user', JSON.stringify(testStudent));
                                            router.push('/dashboard');
                                        } else {
                                            alert('Test user not found. Create one with college_email: test@student.edu');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert('Dev login failed');
                                    }
                                    finally { setLoading(false); }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-10 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px] border border-orange-500/30"
                            >
                                🧪 Dev Login (test@student.edu)
                            </motion.button>
                        </>
                    )}

                    {/* Info */}
                    <div className="mt-auto pt-8">
                        <p className="text-[11px] text-[#444] text-center leading-relaxed">
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center"
                >
                    <span className="text-black font-bold">B</span>
                </motion.div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
