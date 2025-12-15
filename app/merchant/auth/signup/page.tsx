"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Check, X, ArrowRight, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

// Title case formatting for business name
const formatBusinessName = (value: string): string => {
    return value
        .split(' ')
        .map(word => {
            if (word.length === 0) return '';
            // Only capitalize if it's a letter
            if (/^[a-zA-Z]/.test(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        })
        .join(' ');
};

export default function MerchantSignupPage() {
    const router = useRouter();
    const [signupMethod, setSignupMethod] = useState<'select' | 'email'>('select');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [error, setError] = useState("");

    // Email signup form
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Check if already logged in as merchant - clear incomplete sessions
    useEffect(() => {
        async function checkAuth() {
            try {
                // If URL has hash fragment (OAuth tokens), redirect to merchant callback
                // This handles the case where Supabase redirects here instead of /merchant/auth/callback
                if (window.location.hash && window.location.hash.includes('access_token')) {
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
                    // This prevents stale sessions from incomplete onboarding
                    if (user.role === 'pending' || (user.role === 'merchant' && !user.isComplete)) {
                        console.log('Incomplete merchant session - clearing for fresh start');
                        await authService.logout();
                        // Also clear any stored onboarding data
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

    // Password validation
    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
    };
    const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

    const isFormValid =
        formData.email.includes("@") &&
        formData.email.includes(".") &&
        passwordStrength >= 3 &&
        passwordsMatch;

    // Google OAuth signup
    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        try {
            // Mark that we're in merchant signup flow (for routing after OAuth)
            // Set in both storages for reliability
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

    // Email/password signup
    const handleEmailSignup = async () => {
        if (!isFormValid) return;
        setLoading(true);
        setError("");
        try {
            const result = await authService.merchantSignupWithEmail(formData.email.toLowerCase());
            if (result.success) {
                // Store password temporarily for after OTP verification
                localStorage.setItem('merchant_pending_email', formData.email.toLowerCase());
                localStorage.setItem('merchant_pending_password', formData.password);
                router.push('/merchant/auth/verify-otp');
            } else {
                setError(result.error || "Failed to send OTP");
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex flex-col">
            {/* Header */}
            <div className="px-6 pt-16 pb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <span className="font-extrabold text-2xl">Backbenchers</span>
                </div>
                <h1 className="text-2xl font-extrabold mb-2">Join as Merchant</h1>
                <p className="text-gray-500 text-sm">Partner with us to reach thousands of students</p>
            </div>

            <div className="flex-1 px-6">
                <AnimatePresence mode="wait">
                    {signupMethod === 'select' ? (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Google OAuth Button */}
                            <Button
                                onClick={handleGoogleSignup}
                                disabled={loading}
                                className="w-full h-14 bg-white border-2 border-gray-200 text-gray-800 font-semibold rounded-2xl text-base hover:bg-gray-50 flex items-center justify-center gap-3"
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
                                    </>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 font-medium">OR</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Email Signup Button */}
                            <Button
                                onClick={() => setSignupMethod('email')}
                                variant="outline"
                                className="w-full h-14 border-2 border-gray-200 text-gray-800 font-semibold rounded-2xl text-base hover:bg-gray-50 flex items-center justify-center gap-3"
                            >
                                <Mail className="h-5 w-5" />
                                Sign up with Email
                            </Button>

                            {error && (
                                <p className="text-sm text-red-500 text-center mt-4">{error}</p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Back button */}
                            <button
                                onClick={() => setSignupMethod('select')}
                                className="text-sm text-gray-500 flex items-center gap-1 mb-4"
                            >
                                ← Back to options
                            </button>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="business@email.com"
                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Create Password</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full h-12 bg-gray-100 rounded-xl px-4 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Password Strength */}
                                {formData.password.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full ${i <= passwordStrength
                                                        ? passwordStrength <= 2 ? 'bg-red-400' : passwordStrength === 3 ? 'bg-yellow-400' : 'bg-green-400'
                                                        : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            {Object.entries(passwordChecks).map(([key, valid]) => (
                                                <div key={key} className={`flex items-center gap-1 text-[10px] ${valid ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                    {key === 'length' ? '8+ chars' : key === 'uppercase' ? 'Uppercase' : key === 'lowercase' ? 'Lowercase' : 'Number'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className={`w-full h-12 bg-gray-100 rounded-xl px-4 pr-12 text-sm font-medium outline-none focus:ring-2 ${formData.confirmPassword.length > 0
                                            ? passwordsMatch ? 'focus:ring-green-300 border border-green-300' : 'focus:ring-red-300 border border-red-300'
                                            : 'focus:ring-primary/30'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {formData.confirmPassword.length > 0 && !passwordsMatch && (
                                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            {/* Submit Button */}
                            <Button
                                onClick={handleEmailSignup}
                                disabled={!isFormValid || loading}
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    Already have an account?{" "}
                    <Link href="/merchant/auth/login" className="text-primary font-semibold">
                        Login
                    </Link>
                </p>

                {/* App Switcher */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                    <div className="flex justify-center gap-3">
                        <Link href="/signup" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Student App
                        </Link>
                        <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                            Admin Panel
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
