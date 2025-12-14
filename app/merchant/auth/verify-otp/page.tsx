"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth.service";

export default function MerchantVerifyOTPPage() {
    const router = useRouter();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [email, setEmail] = useState("");

    // Get email from localStorage
    useEffect(() => {
        const pendingEmail = localStorage.getItem('merchant_pending_email');
        if (!pendingEmail) {
            router.push('/merchant/auth/signup');
            return;
        }
        setEmail(pendingEmail);
    }, [router]);

    // Resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");

        // Auto-advance
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (newOtp.every(d => d.length === 1)) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        setLoading(true);
        setError("");
        try {
            const result = await authService.verifyMerchantOTP(email, code);
            if (result.success) {
                // OTP verified - proceed to onboarding
                router.push('/merchant/onboarding/business');
            } else {
                setError(result.error || "Invalid OTP");
                setOtp(["", "", "", "", "", ""]);
                otpRefs.current[0]?.focus();
            }
        } catch (error: any) {
            setError(error.message);
            setOtp(["", "", "", "", "", ""]);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            const result = await authService.merchantSignupWithEmail(email);
            if (result.success) {
                setResendTimer(60);
                setCanResend(false);
                setError("");
            } else {
                setError(result.error || "Failed to resend OTP");
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex flex-col">
            {/* Header */}
            <div className="p-4">
                <button
                    onClick={() => router.back()}
                    className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 px-6 pt-8">
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6"
                >
                    <Mail className="h-10 w-10 text-primary" />
                </motion.div>

                <h1 className="text-2xl font-extrabold text-center mb-2">Verify Your Email</h1>
                <p className="text-gray-500 text-sm text-center mb-8">
                    Enter the 6-digit code sent to<br />
                    <span className="font-semibold text-gray-700">{email}</span>
                </p>

                {/* OTP Input */}
                <div className="flex justify-center gap-3 mb-6">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { otpRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={loading}
                            className={`w-12 h-14 text-center text-xl font-bold bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 ${error ? 'border-2 border-red-400' : ''}`}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-sm text-red-500 text-center mb-4">{error}</p>
                )}

                {loading && (
                    <div className="flex justify-center mb-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}

                {/* Resend */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                    <button
                        onClick={handleResend}
                        disabled={!canResend || loading}
                        className={`flex items-center gap-2 mx-auto text-sm font-semibold ${canResend ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {canResend ? "Resend Code" : `Resend in ${resendTimer}s`}
                    </button>
                </div>
            </div>
        </div>
    );
}
