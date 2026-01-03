"use client";

import { Clock, CheckCircle2, Store, FileText, Shield, Mail, Phone, ArrowRight, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { merchantService } from "@/lib/services/merchant.service";
import { supabase } from "@/lib/supabase";

interface MerchantStatus {
    id: string;
    businessName: string;
    status: 'pending' | 'approved' | 'rejected';
    bbmId?: string;
}

export default function VerificationPendingPage() {
    const router = useRouter();
    const [merchant, setMerchant] = useState<MerchantStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch merchant status - check pending_merchants first, then merchants
    useEffect(() => {
        async function fetchMerchant() {
            try {
                // First, check pending_merchants table (for newly submitted applications)
                const pendingResult = await merchantService.getMyPendingApplication();
                if (pendingResult.success && pendingResult.data) {
                    setMerchant({
                        id: pendingResult.data.id,
                        businessName: pendingResult.data.businessName,
                        status: pendingResult.data.status as any,
                        bbmId: undefined,
                    });
                    setLoading(false);
                    return;
                }

                // If not in pending_merchants, check merchants table (for already processed)
                const result = await merchantService.getMyProfile();
                if (result.success && result.data) {
                    setMerchant({
                        id: result.data.id,
                        businessName: result.data.businessName,
                        status: result.data.status as any,
                        bbmId: result.data.bbmId ?? undefined,
                    });

                    // If already approved, redirect to dashboard
                    if (result.data.status === 'approved') {
                        router.push('/merchant/dashboard');
                        return;
                    }
                } else {
                    // No record in either table - redirect to signup
                    router.push('/merchant/auth/signup');
                }
            } catch (error) {
                console.error("Error fetching merchant:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMerchant();

        // Subscribe to real-time changes on merchants table
        const channel = supabase
            .channel('merchant-status')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'merchants',
                },
                (payload) => {
                    console.log('Merchant updated:', payload);
                    if (payload.new && payload.new.status === 'approved') {
                        // Merchant was approved! Redirect to dashboard
                        router.push('/merchant/dashboard');
                    } else if (payload.new && payload.new.status === 'rejected') {
                        setMerchant(prev => prev ? { ...prev, status: 'rejected' } : null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            </div>
        );
    }

    // Rejected state
    if (merchant?.status === 'rejected') {
        return (
            <div className="min-h-screen bg-black pb-8">
                <div className="px-6 pt-16 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="h-24 w-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <XCircle className="h-12 w-12 text-red-400" />
                    </motion.div>
                    <h1 className="text-2xl font-extrabold text-white mb-2">Application Rejected</h1>
                    <p className="text-[#888] text-sm">Unfortunately, your application was not approved.</p>
                </div>

                <div className="mx-6 mt-8 bg-[#111] border border-[#333] rounded-3xl p-6">
                    <p className="text-sm text-[#888] mb-4">
                        Your merchant application for <strong className="text-white">{merchant.businessName}</strong> has been rejected.
                        Please contact support for more information.
                    </p>
                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-sm font-medium text-white hover:bg-[#222] transition-colors">
                            <Mail className="h-4 w-4 text-[#888]" />
                            Email Support
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-sm font-medium text-white hover:bg-[#222] transition-colors">
                            <Phone className="h-4 w-4 text-[#888]" />
                            Call Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-8">
            {/* Header */}
            <div className="px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-24 w-24 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    <Clock className="h-12 w-12 text-orange-400" />
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-orange-500/30"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-extrabold text-white mb-2"
                >
                    Verification in Progress
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-[#888] text-sm"
                >
                    Your application is being reviewed by our team
                </motion.p>
            </div>

            {/* Status Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mx-6 mt-8 bg-[#111] border border-[#333] rounded-3xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <Store className="h-5 w-5 text-black" />
                    </div>
                    <div>
                        <p className="font-bold text-white">{merchant?.businessName || 'Your Business'}</p>
                        <p className="text-xs text-[#666]">Application submitted</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                    {[
                        { title: "Account Created", desc: "Google/Email verified", done: true },
                        { title: "Business Details", desc: "All information submitted", done: true },
                        { title: "Photos Uploaded", desc: "Store images submitted", done: true },
                        { title: "Store Timings", desc: "Operating hours set", done: true },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-white">{step.title}</p>
                                <p className="text-xs text-[#666]">{step.desc}</p>
                            </div>
                            <span className="text-xs text-green-400 font-medium">Done</span>
                        </div>
                    ))}

                    {/* Admin Review - Pending */}
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="h-8 w-8 bg-orange-500/10 rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Clock className="h-5 w-5 text-orange-400" />
                        </motion.div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-white">Admin Review</p>
                            <p className="text-xs text-[#666]">Awaiting approval</p>
                        </div>
                        <span className="text-xs text-orange-400 font-medium">Pending</span>
                    </div>
                </div>
            </motion.div>

            {/* Estimated Time */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mx-6 mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4"
            >
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <div>
                        <p className="text-sm font-semibold text-blue-400">Estimated Review Time</p>
                        <p className="text-xs text-blue-400/60">24-48 hours on business days</p>
                    </div>
                </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mx-6 mt-6 space-y-3"
            >
                <p className="text-xs text-[#666] text-center">Need help? Contact us</p>
                <div className="flex justify-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] rounded-xl text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors">
                        <Mail className="h-4 w-4 text-[#666]" />
                        Email
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] rounded-xl text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors">
                        <Phone className="h-4 w-4 text-[#666]" />
                        Call
                    </button>
                </div>
            </motion.div>

            {/* What Happens Next */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mx-6 mt-8 bg-[#111] border border-[#333] rounded-2xl p-5"
            >
                <h3 className="font-bold text-white mb-4">What happens next?</h3>
                <div className="space-y-3">
                    {[
                        "Our team reviews your documents and business details",
                        "You'll receive an email & SMS once approved",
                        "Your BBM-ID will be generated and you can start creating offers!"
                    ].map((text, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-6 w-6 bg-green-500/10 rounded-full flex items-center justify-center text-xs font-bold text-green-400">{i + 1}</div>
                            <p className="text-sm text-[#888] flex-1">{text}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Real-time info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mx-6 mt-8 text-center"
            >
                <p className="text-xs text-[#555]">
                    🔄 This page updates automatically when your status changes
                </p>
            </motion.div>
        </div>
    );
}
