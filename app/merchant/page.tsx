"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, ArrowRight, Users, BarChart3, Shield } from "lucide-react";

export default function MerchantLandingPage() {
    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-4">
            <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[0_0_0_3px_#3a3a3a,0_25px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[12px] bg-white rounded-[45px] overflow-hidden">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />

                    <div className="h-full w-full overflow-y-auto pt-16 pb-8 px-6 scrollbar-hide">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center">
                                    <span className="text-white font-bold text-2xl">B</span>
                                </div>
                            </div>
                            <h1 className="text-3xl font-extrabold mb-3">Backbenchers</h1>
                            <p className="text-lg font-semibold text-primary">For Merchants</p>
                            <p className="text-gray-500 text-sm mt-2">Partner with us to reach thousands of students</p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 mb-10">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4"
                            >
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Reach 50,000+ Students</h3>
                                    <p className="text-xs text-gray-500">Connect with verified college students</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4"
                            >
                                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Store className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Easy Offer Creation</h3>
                                    <p className="text-xs text-gray-500">Create discounts in under a minute</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4"
                            >
                                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Track Performance</h3>
                                    <p className="text-xs text-gray-500">Real-time analytics & insights</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4"
                            >
                                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Verified Redemptions</h3>
                                    <p className="text-xs text-gray-500">QR-based secure discount system</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-3">
                            <Link href="/merchant/auth/signup" className="block">
                                <Button className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base">
                                    Register Your Business
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>

                            <Link href="/merchant/auth/login" className="block">
                                <Button variant="outline" className="w-full h-14 font-bold rounded-2xl text-base border-2">
                                    Already a Partner? Login
                                </Button>
                            </Link>
                        </div>

                        {/* App Switcher */}
                        <div className="mt-10 pt-6 border-t border-gray-100">
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
