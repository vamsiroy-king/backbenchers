"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Store, Wifi, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type MerchantType = "" | "chain_outlet" | "local_store" | "online_brand";

export default function MerchantTypePage() {
    const router = useRouter();
    const [merchantType, setMerchantType] = useState<MerchantType>("");

    const handleContinue = () => {
        if (!merchantType) return;

        // Save merchant type to localStorage
        localStorage.setItem('merchant_type', merchantType);

        if (merchantType === 'chain_outlet') {
            // Go to brand selection
            router.push('/merchant/onboarding/select-brand');
        } else if (merchantType === 'local_store') {
            // Go to current business details flow
            router.push('/merchant/onboarding/business');
        } else if (merchantType === 'online_brand') {
            // Online brands - same as local for now
            router.push('/merchant/onboarding/business');
        }
    };

    const options = [
        {
            id: 'chain_outlet' as MerchantType,
            icon: Building2,
            title: 'Chain Outlet',
            subtitle: 'I manage a branch of a brand',
            examples: 'Domino\'s, CCD, Starbucks, etc.',
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-500',
        },
        {
            id: 'local_store' as MerchantType,
            icon: Store,
            title: 'Local Store',
            subtitle: 'I own an independent business',
            examples: 'My own restaurant, shop, salon',
            color: 'from-emerald-500 to-green-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-500',
        },
        {
            id: 'online_brand' as MerchantType,
            icon: Wifi,
            title: 'Online Brand',
            subtitle: 'E-commerce or digital business',
            examples: 'Online store, digital service',
            color: 'from-violet-500 to-purple-600',
            bgColor: 'bg-violet-50',
            borderColor: 'border-violet-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-lg mx-auto min-h-screen">
                <div className="min-h-screen overflow-y-auto pt-6 pb-8 px-5">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/merchant/auth/signup">
                            <button className="h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">Join BackBenchers</h1>
                            <p className="text-sm text-gray-500">What type of business are you?</p>
                        </div>
                    </div>

                    {/* Decorative Element */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-100 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        {options.map((option, index) => (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setMerchantType(option.id)}
                                className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 ${merchantType === option.id
                                        ? `${option.borderColor} ${option.bgColor} shadow-lg`
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <option.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-lg text-gray-900">{option.title}</h3>
                                        <p className="text-sm text-gray-600 mt-0.5">{option.subtitle}</p>
                                        <p className="text-xs text-gray-400 mt-1">{option.examples}</p>
                                    </div>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${merchantType === option.id
                                            ? `${option.borderColor} bg-current`
                                            : 'border-gray-300'
                                        }`}>
                                        {merchantType === option.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="h-2.5 w-2.5 rounded-full bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Info Box for Chain Outlet */}
                    {merchantType === 'chain_outlet' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
                        >
                            <p className="text-sm text-blue-800">
                                <strong>Chain outlets:</strong> You'll select your brand from our verified list and add your outlet details. Perfect for franchise managers and branch employees.
                            </p>
                        </motion.div>
                    )}

                    {/* Continue Button */}
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button
                            onClick={handleContinue}
                            disabled={!merchantType}
                            className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-bold rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                        >
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>

                    {/* Bottom Note */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Not sure? Contact us at <span className="text-primary">partners@backbenchers.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
