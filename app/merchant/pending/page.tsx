"use client";

import { Button } from "@/components/ui/button";
import { Check, Clock, FileCheck, Building2, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
    const router = useRouter();
    const [isApproved, setIsApproved] = useState(false);
    const [checkCount, setCheckCount] = useState(0);

    // Simulate auto-check for approval status
    useEffect(() => {
        const interval = setInterval(() => {
            setCheckCount(prev => prev + 1);
            // Simulate approval after 3 checks (for demo purposes)
            if (checkCount >= 2) {
                setIsApproved(true);
                setTimeout(() => router.push("/merchant/dashboard"), 2000);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [checkCount, router]);

    const timeline = [
        {
            label: "Application Submitted",
            status: "complete",
            time: "Dec 10, 2024 • 9:45 PM"
        },
        {
            label: "Under Review",
            status: isApproved ? "complete" : "current",
            time: isApproved ? "Dec 10, 2024 • 9:47 PM" : "In Progress..."
        },
        {
            label: "Approved",
            status: isApproved ? "complete" : "pending",
            time: isApproved ? "Just now!" : "Pending"
        },
    ];

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-4">
            <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[0_0_0_3px_#3a3a3a,0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[12px] bg-white rounded-[45px] overflow-hidden">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />

                    <div className="h-full w-full overflow-y-auto pt-16 pb-8 px-6 scrollbar-hide">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isApproved ? 'bg-primary' : 'bg-yellow-100'
                                    }`}
                            >
                                {isApproved ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Check className="h-10 w-10 text-white" />
                                    </motion.div>
                                ) : (
                                    <Clock className="h-10 w-10 text-yellow-600" />
                                )}
                            </motion.div>

                            <h1 className="text-2xl font-extrabold mb-2">
                                {isApproved ? "You're Approved! 🎉" : "Application Under Review"}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {isApproved
                                    ? "Welcome to Backbenchers! Redirecting to dashboard..."
                                    : "Our team is reviewing your documents. This usually takes 24-48 hours."
                                }
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                            <h3 className="font-bold text-sm mb-4">Application Status</h3>
                            <div className="space-y-4">
                                {timeline.map((step, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="relative">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.status === 'complete' ? 'bg-primary' :
                                                    step.status === 'current' ? 'bg-yellow-100' : 'bg-gray-200'
                                                }`}>
                                                {step.status === 'complete' ? (
                                                    <Check className="h-4 w-4 text-white" />
                                                ) : step.status === 'current' ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    >
                                                        <RefreshCw className="h-4 w-4 text-yellow-600" />
                                                    </motion.div>
                                                ) : (
                                                    <div className="h-2 w-2 bg-gray-400 rounded-full" />
                                                )}
                                            </div>
                                            {index < timeline.length - 1 && (
                                                <div className={`absolute left-1/2 -translate-x-1/2 top-8 w-0.5 h-6 ${step.status === 'complete' ? 'bg-primary' : 'bg-gray-200'
                                                    }`} />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className={`font-semibold text-sm ${step.status === 'pending' ? 'text-gray-400' : ''
                                                }`}>{step.label}</p>
                                            <p className={`text-xs ${step.status === 'current' ? 'text-yellow-600' : 'text-gray-400'
                                                }`}>{step.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submitted Details */}
                        <div className="space-y-3 mb-8">
                            <h3 className="font-bold text-sm">Submitted Details</h3>

                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Business Information</p>
                                        <p className="text-xs text-gray-400">Cafe Delights • Restaurant</p>
                                    </div>
                                </div>
                                <button className="text-primary text-xs font-semibold">Edit</button>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <FileCheck className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Documents</p>
                                        <p className="text-xs text-gray-400">4 files uploaded</p>
                                    </div>
                                </div>
                                <button className="text-primary text-xs font-semibold">View</button>
                            </div>
                        </div>

                        {/* Auto-refresh indicator */}
                        {!isApproved && (
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                >
                                    <RefreshCw className="h-3 w-3" />
                                </motion.div>
                                Auto-checking status...
                            </div>
                        )}

                        {/* Logout Button */}
                        <button className="w-full flex items-center justify-center gap-2 py-4 text-gray-500 border border-gray-200 rounded-2xl">
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-semibold">Logout</span>
                        </button>

                        {/* App Switcher */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center mb-3">Switch to</p>
                            <div className="flex justify-center gap-3">
                                <Link href="/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                                    Student App
                                </Link>
                                <Link href="/admin/dashboard" className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold">
                                    Admin Panel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
