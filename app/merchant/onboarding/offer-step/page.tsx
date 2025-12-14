"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Percent, IndianRupee, Gift, Sparkles, Check, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Offer Types for onboarding - simplified for quick setup
const OFFER_TYPES = [
    { id: "percentage", name: "Percentage Off", icon: Percent, description: "e.g., 10% OFF", color: "from-violet-500 to-purple-600" },
    { id: "flat", name: "Flat Discount", icon: IndianRupee, description: "e.g., ₹50 OFF", color: "from-emerald-500 to-green-600" },
    { id: "bogo", name: "Buy 1 Get 1", icon: Gift, description: "Free item with purchase", color: "from-orange-500 to-amber-600" },
];

// Quick templates for easy selection
const QUICK_TEMPLATES = [
    { id: "10off", name: "10% OFF", type: "percentage", value: 10 },
    { id: "15off", name: "15% OFF", type: "percentage", value: 15 },
    { id: "20off", name: "20% OFF", type: "percentage", value: 20 },
    { id: "50flat", name: "₹50 OFF", type: "flat", value: 50 },
    { id: "100flat", name: "₹100 OFF", type: "flat", value: 100 },
];

export default function CreateFirstOfferPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [offerType, setOfferType] = useState("");
    const [offerData, setOfferData] = useState({
        name: "",
        discountValue: "",
        minOrderValue: "",
        freeItemName: "",
    });
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Check if we have previous onboarding data
    useEffect(() => {
        const business = localStorage.getItem('merchant_business');
        if (!business) {
            router.push('/merchant/onboarding/business');
        }
    }, [router]);

    // Apply quick template
    const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
        setOfferType(template.type);
        setOfferData({
            ...offerData,
            name: `Student ${template.name}`,
            discountValue: template.value.toString(),
        });
        setStep(2); // Move to details step
    };

    // Save offer data and continue
    const handleSaveAndContinue = () => {
        setLoading(true);

        // Validate
        if (!offerType) {
            alert("Please select an offer type");
            setLoading(false);
            return;
        }

        if (!offerData.name) {
            alert("Please enter an offer name");
            setLoading(false);
            return;
        }

        if (offerType !== "bogo" && !offerData.discountValue) {
            alert("Please enter a discount value");
            setLoading(false);
            return;
        }

        if (offerType === "bogo" && !offerData.freeItemName) {
            alert("Please enter the free item name");
            setLoading(false);
            return;
        }

        // Save to localStorage for passcode page to use
        const firstOffer = {
            type: offerType,
            title: offerData.name,
            discountValue: parseFloat(offerData.discountValue) || 0,
            minOrderValue: parseFloat(offerData.minOrderValue) || 0,
            freeItemName: offerData.freeItemName,
            terms: ["Valid student ID required", "Cannot be combined with other offers"],
        };

        localStorage.setItem('merchant_first_offer', JSON.stringify(firstOffer));

        // Navigate to passcode
        setTimeout(() => {
            router.push('/merchant/onboarding/passcode');
        }, 500);
    };

    const isFormValid = offerType && offerData.name && agreedToTerms &&
        (offerType === "bogo" ? offerData.freeItemName : offerData.discountValue);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-emerald-50/30">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
                <div className="px-5 h-16 flex items-center gap-4">
                    <Link href="/merchant/onboarding/store-timings">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center shadow-sm"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-bold text-[17px] text-gray-900 tracking-tight">Create First Offer</h1>
                        <p className="text-[11px] text-gray-400 font-medium">Step 6 of 7 • Almost there!</p>
                    </div>
                </div>

                {/* Progress */}
                <div className="px-5 pb-4 flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(s => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${s <= 6 ? "bg-primary" : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </header>

            <main className="px-5 pt-6 pb-32 space-y-6">
                {/* Intro Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary to-emerald-600 rounded-3xl p-6 text-white shadow-xl"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">Launch with an Offer!</h2>
                            <p className="text-white/80 text-sm">Attract students from day one</p>
                        </div>
                    </div>
                    <p className="text-white/70 text-sm">
                        Create your first student discount offer. This will go live as soon as your account is approved.
                    </p>
                </motion.div>

                {/* Quick Templates */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                            ⚡ Quick Select
                        </h3>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {QUICK_TEMPLATES.map(template => (
                                <motion.button
                                    key={template.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => applyTemplate(template)}
                                    className="bg-white p-4 rounded-2xl border-2 border-gray-100 hover:border-primary/30 transition-all text-center shadow-sm"
                                >
                                    <p className="font-bold text-lg text-gray-900">{template.name}</p>
                                    <p className="text-xs text-gray-400">for students</p>
                                </motion.button>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-gradient-to-br from-primary/5 via-white to-emerald-50/30 px-4 text-sm text-gray-400">
                                    or customize
                                </span>
                            </div>
                        </div>

                        {/* Offer Type Selection */}
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                            Choose Offer Type
                        </h3>
                        <div className="space-y-3">
                            {OFFER_TYPES.map(type => (
                                <motion.button
                                    key={type.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setOfferType(type.id);
                                        setStep(2);
                                    }}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${offerType === type.id
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg`}>
                                        <type.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">{type.name}</p>
                                        <p className="text-xs text-gray-400">{type.description}</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-300" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                    >
                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>

                        {/* Offer Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Offer Name
                            </label>
                            <input
                                type="text"
                                value={offerData.name}
                                onChange={(e) => setOfferData({ ...offerData, name: e.target.value })}
                                placeholder="e.g., Student Special, Campus Deal"
                                className="w-full h-14 bg-white rounded-2xl px-4 text-[15px] font-medium outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Discount Value */}
                        {offerType !== "bogo" && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {offerType === "flat" ? "Discount Amount (₹)" : "Discount Percentage (%)"}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        {offerType === "flat" ? (
                                            <IndianRupee className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Percent className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        value={offerData.discountValue}
                                        onChange={(e) => setOfferData({ ...offerData, discountValue: e.target.value })}
                                        placeholder={offerType === "flat" ? "50" : "15"}
                                        className="w-full h-14 bg-white rounded-2xl pl-14 pr-4 text-xl font-bold outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Free Item (for BOGO) */}
                        {offerType === "bogo" && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Free Item
                                </label>
                                <input
                                    type="text"
                                    value={offerData.freeItemName}
                                    onChange={(e) => setOfferData({ ...offerData, freeItemName: e.target.value })}
                                    placeholder="e.g., Same item, Any drink, etc."
                                    className="w-full h-14 bg-white rounded-2xl px-4 text-[15px] font-medium outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                />
                            </div>
                        )}

                        {/* Minimum Order (Optional) */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Minimum Order Value <span className="text-gray-400 normal-case">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <IndianRupee className="h-4 w-4 text-amber-600" />
                                </div>
                                <input
                                    type="number"
                                    value={offerData.minOrderValue}
                                    onChange={(e) => setOfferData({ ...offerData, minOrderValue: e.target.value })}
                                    placeholder="No minimum"
                                    className="w-full h-14 bg-white rounded-2xl pl-14 pr-4 text-lg font-medium outline-none border-2 border-gray-100 focus:border-amber-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Terms Info */}
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Auto-included Terms
                            </h4>
                            <ul className="space-y-1.5">
                                <li className="flex items-center gap-2 text-xs text-gray-500">
                                    <Check className="h-3 w-3 text-primary" />
                                    Valid student ID required
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-500">
                                    <Check className="h-3 w-3 text-primary" />
                                    Cannot be combined with other offers
                                </li>
                            </ul>
                        </div>

                        {/* Terms & Conditions Checkbox */}
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mt-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 h-5 w-5 rounded border-amber-300 text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800 text-sm mb-2">
                                        I agree to the Terms & Conditions
                                    </p>
                                    <ul className="space-y-1 text-xs text-gray-600">
                                        <li>• Offers cannot be deleted, only paused</li>
                                        <li>• Minimum 2-hour wait before toggling offer status</li>
                                        <li>• Valid student ID verification is mandatory</li>
                                        <li>• Backbenchers is not liable for offer disputes</li>
                                        <li>• Discount must match what's shown in the app</li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-gray-100">
                <Button
                    onClick={handleSaveAndContinue}
                    disabled={!isFormValid || loading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue to Final Step
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
                <p className="text-center text-xs text-gray-400 mt-2">
                    You can add more offers after setup
                </p>
            </div>
        </div>
    );
}
