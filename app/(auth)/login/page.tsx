"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

export default function StudentLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [email, setEmail] = useState("");
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                const user = await authService.getCurrentUser();
                if (user && user.role === 'student' && user.isComplete) {
                    router.push('/dashboard');
                    return;
                }
            } catch (e) { console.error(e); }
            finally { setCheckingAuth(false); }
        }
        checkAuth();
    }, [router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await authService.loginWithGoogle();
            if (!result.success) console.error(result.error);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleEmailLogin = async () => {
        if (!email) return;
        setIsLoading(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (!error) setEmailSent(true);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
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
                    <Link href="/signup" className="text-[13px] text-green-400 font-medium">
                        Sign up
                    </Link>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                >
                    {/* Logo + Tagline */}
                    <div className="mb-8">
                        <div className="h-11 w-11 rounded-xl bg-green-500 flex items-center justify-center mb-3">
                            <span className="text-black font-bold text-lg">B</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold italic text-white">BACKBENCHERS</span>
                            <span className="text-[10px] font-semibold text-green-400 tracking-wide">BORN TO SAVE</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-[22px] font-bold text-white mb-1.5">Welcome back</h1>
                    <p className="text-[14px] text-[#666] mb-8">
                        Sign in to access your student discounts
                    </p>

                    {!emailSent ? (
                        <>
                            {/* Google Button */}
                            <motion.button
                                onClick={handleGoogleLogin}
                                disabled={isLoading && !showEmailLogin}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] text-white font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 text-[14px] border border-[#333]"
                            >
                                {isLoading && !showEmailLogin ? (
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

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-5">
                                <div className="h-px flex-1 bg-[#222]" />
                                <span className="text-[11px] text-[#555] uppercase">or</span>
                                <div className="h-px flex-1 bg-[#222]" />
                            </div>

                            {/* Email Login */}
                            {!showEmailLogin ? (
                                <motion.button
                                    onClick={() => setShowEmailLogin(true)}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] text-white font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors text-[14px] border border-[#333]"
                                >
                                    <Mail className="h-4 w-4" />
                                    Continue with Email
                                </motion.button>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full h-12 bg-[#1a1a1a] rounded-xl px-4 text-[14px] text-white placeholder-[#555] focus:outline-none focus:ring-1 focus:ring-green-500/50 border border-[#333]"
                                    />
                                    <motion.button
                                        onClick={handleEmailLogin}
                                        disabled={isLoading || !email}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full h-12 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-[14px]"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Magic Link"}
                                    </motion.button>
                                </div>
                            )}

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
                                            setIsLoading(true);
                                            try {
                                                // Create a fake session for test user
                                                const { supabase } = await import('@/lib/supabase');
                                                // Check if test student exists
                                                const { data: testStudent } = await supabase
                                                    .from('students')
                                                    .select('*')
                                                    .eq('college_email', 'test@student.edu')
                                                    .maybeSingle();

                                                if (testStudent) {
                                                    // Store test user info and redirect
                                                    localStorage.setItem('dev_test_user', JSON.stringify(testStudent));
                                                    router.push('/dashboard');
                                                } else {
                                                    alert('Test user not found. Please create one in Supabase with college_email: test@student.edu');
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert('Dev login failed');
                                            }
                                            finally { setIsLoading(false); }
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full h-10 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-[13px] border border-orange-500/30"
                                    >
                                        🧪 Dev Login (test@student.edu)
                                    </motion.button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-6 w-6 text-green-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-1">Check your email</h3>
                            <p className="text-[#666] text-sm">We sent a login link to {email}</p>
                        </div>
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
