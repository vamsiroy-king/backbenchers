"use client";

import { Button } from "@/components/ui/button";
import { KeyRound, Check, Shield, Lock, Sparkles, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth.service";

export default function StudentPasscodeSetupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');

    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [passcode, setPasscode] = useState(["", "", "", "", "", ""]);
    const [confirmPasscode, setConfirmPasscode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if studentId exists
    useEffect(() => {
        if (!studentId) {
            router.push('/signup');
        }
    }, [studentId, router]);

    const handlePasscodeChange = (index: number, value: string, isConfirm: boolean = false) => {
        if (value.length > 1) return;

        const currentPasscode = isConfirm ? [...confirmPasscode] : [...passcode];
        currentPasscode[index] = value;

        if (isConfirm) {
            setConfirmPasscode(currentPasscode);
        } else {
            setPasscode(currentPasscode);
        }

        setError("");

        // Auto-advance to next input
        const refs = isConfirm ? confirmRefs : inputRefs;
        if (value && index < 5) {
            refs.current[index + 1]?.focus();
        }

        // Auto-proceed when 6 digits entered
        if (currentPasscode.every(d => d.length === 1)) {
            if (!isConfirm) {
                setTimeout(() => {
                    setStep('confirm');
                    setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                }, 300);
            } else {
                handleComplete(currentPasscode.join(''));
            }
        }
    };

    const handleComplete = async (confirmCode: string) => {
        const originalCode = passcode.join('');

        if (confirmCode !== originalCode) {
            setError("Passcodes don't match. Try again.");
            setConfirmPasscode(["", "", "", "", "", ""]);
            setTimeout(() => confirmRefs.current[0]?.focus(), 100);
            return;
        }

        setSaving(true);
        try {
            const result = await authService.setupStudentPasscode(studentId!, originalCode);

            if (!result.success) {
                setError(result.error || "Failed to save passcode");
                setSaving(false);
                return;
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2500);
        } catch (error: any) {
            setError(error.message);
            setSaving(false);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
        const currentPasscode = isConfirm ? confirmPasscode : passcode;
        const refs = isConfirm ? confirmRefs : inputRefs;

        if (e.key === 'Backspace' && !currentPasscode[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    // Success Animation
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-24 w-24 bg-primary rounded-full flex items-center justify-center mb-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Check className="h-12 w-12 text-white" strokeWidth={3} />
                    </motion.div>
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-extrabold text-center mb-2"
                >
                    You're All Set! 🎉
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-500 text-center"
                >
                    Your account is ready!
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4"
                >
                    <p className="text-sm text-gray-500 text-center mb-1">Your BB-ID will be generated</p>
                    <p className="text-sm text-primary text-center">after admin verification</p>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 text-sm text-gray-400"
                >
                    Redirecting to your dashboard...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-8">
            {/* Progress Bar - Mobile optimized */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 pt-12">
                <div className="flex items-center gap-3 mb-2 max-w-md mx-auto">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "80%" }}
                            animate={{ width: step === 'confirm' ? "100%" : "90%" }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Final Step</span>
                </div>
            </div>

            <div className="px-6 pt-8 max-w-md mx-auto">
                {/* Verification Success Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8 flex items-center gap-3"
                >
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800 text-sm">Email Verified!</p>
                        <p className="text-xs text-green-600">Your college email has been verified successfully</p>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 'create' ? (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <KeyRound className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold mb-2">Create Your Passcode</h1>
                                <p className="text-gray-500 text-sm">
                                    Set a 6-digit passcode for quick access
                                </p>
                            </div>

                            {/* Benefits - Mobile optimized */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Shield className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-gray-600">Secure & encrypted on your device</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Lock className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-gray-600">Works only on this device</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-gray-600">Skip email login next time</p>
                                </div>
                            </div>

                            {/* Passcode Input - Mobile optimized */}
                            <div>
                                <p className="text-center text-sm text-gray-500 mb-4">Enter 6-digit passcode</p>
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {passcode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePasscodeChange(index, e.target.value.replace(/\D/g, ''))}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-10 h-12 sm:w-12 sm:h-14 bg-gray-100 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header */}
                            <div className="text-center">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold mb-2">Confirm Passcode</h1>
                                <p className="text-gray-500 text-sm">
                                    Re-enter your passcode to confirm
                                </p>
                            </div>

                            {/* Confirm Passcode Input - Mobile optimized */}
                            <div>
                                <p className="text-center text-sm text-gray-500 mb-4">Confirm 6-digit passcode</p>
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {confirmPasscode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { confirmRefs.current[index] = el; }}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handlePasscodeChange(index, e.target.value.replace(/\D/g, ''), true)}
                                            onKeyDown={(e) => handleKeyDown(index, e, true)}
                                            disabled={saving}
                                            className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30 transition-all ${error ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-100 focus:bg-primary/5'}`}
                                        />
                                    ))}
                                </div>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-red-500 text-sm mt-3"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                                {saving && (
                                    <div className="flex justify-center mt-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>

                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setStep('create');
                                    setPasscode(["", "", "", "", "", ""]);
                                    setConfirmPasscode(["", "", "", "", "", ""]);
                                    setError("");
                                }}
                                disabled={saving}
                                className="w-full text-center text-primary text-sm font-medium"
                            >
                                ← Start over
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Security Note */}
                <div className="mt-12 bg-yellow-50 rounded-2xl p-4">
                    <p className="text-xs text-yellow-700 text-center">
                        🔒 Your passcode is stored securely on this device only. Never share it.
                    </p>
                </div>
            </div>
        </div>
    );
}
