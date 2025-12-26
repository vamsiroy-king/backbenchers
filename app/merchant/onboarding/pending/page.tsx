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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Rejected state
    if (merchant?.status === 'rejected') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pb-8">
                <div className="px-6 pt-16 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <XCircle className="h-12 w-12 text-red-500" />
                    </motion.div>
                    <h1 className="text-2xl font-extrabold mb-2">Application Rejected</h1>
                    <p className="text-gray-500 text-sm">Unfortunately, your application was not approved.</p>
                </div>

                <div className="mx-6 mt-8 bg-white rounded-3xl p-6 shadow-lg">
                    <p className="text-sm text-gray-600 mb-4">
                        Your merchant application for <strong>{merchant.businessName}</strong> has been rejected.
                        Please contact support for more information.
                    </p>
                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium">
                            <Mail className="h-4 w-4" />
                            Email Support
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-sm font-medium">
                            <Phone className="h-4 w-4" />
                            Call Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 pb-8">
            {/* Header */}
            <div className="px-6 pt-16 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    <Clock className="h-12 w-12 text-orange-500" />
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-orange-200"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-extrabold mb-2"
                >
                    Verification in Progress
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-500 text-sm"
                >
                    Your application is being reviewed by our team
                </motion.p>
            </div>

            {/* Status Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mx-6 mt-8 bg-white rounded-3xl p-6 shadow-lg shadow-gray-100"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                        <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold">{merchant?.businessName || 'Your Business'}</p>
                        <p className="text-xs text-gray-500">Application submitted</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Account Created</p>
                            <p className="text-xs text-gray-400">Google/Email verified</p>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Done</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Business Details</p>
                            <p className="text-xs text-gray-400">All information submitted</p>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Done</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Photos Uploaded</p>
                            <p className="text-xs text-gray-400">Store images submitted</p>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Done</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Passcode Created</p>
                            <p className="text-xs text-gray-400">Quick login enabled</p>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Done</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.div
                            className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Clock className="h-5 w-5 text-orange-500" />
                        </motion.div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Admin Review</p>
                            <p className="text-xs text-gray-400">Awaiting approval</p>
                        </div>
                        <span className="text-xs text-orange-500 font-medium">Pending</span>
                    </div>
                </div>
            </motion.div>

            {/* Estimated Time */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mx-6 mt-6 bg-blue-50 rounded-2xl p-4"
            >
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="text-sm font-semibold text-blue-800">Estimated Review Time</p>
                        <p className="text-xs text-blue-600">24-48 hours on business days</p>
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
                <p className="text-xs text-gray-500 text-center">Need help? Contact us</p>
                <div className="flex justify-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium">
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium">
                        <Phone className="h-4 w-4 text-gray-500" />
                        Call
                    </button>
                </div>
            </motion.div>

            {/* What Happens Next */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mx-6 mt-8 bg-gray-50 rounded-2xl p-5"
            >
                <h3 className="font-bold mb-4">What happens next?</h3>
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</div>
                        <p className="text-sm text-gray-600 flex-1">Our team reviews your documents and business details</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</div>
                        <p className="text-sm text-gray-600 flex-1">You'll receive an email & SMS once approved</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</div>
                        <p className="text-sm text-gray-600 flex-1">Your <strong>BBM-ID</strong> will be generated and you can start creating offers!</p>
                    </div>
                </div>
            </motion.div>

            {/* Real-time info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mx-6 mt-8 text-center"
            >
                <p className="text-xs text-gray-400">
                    🔄 This page updates automatically when your status changes
                </p>
            </motion.div>
        </div>
    );
}
