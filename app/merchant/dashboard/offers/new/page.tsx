"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, Percent, IndianRupee, Gift, Sparkles, Tag, Clock, Check, Eye, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { offerService } from "@/lib/services/offer.service";

// Offer Types
const OFFER_TYPES = [
    { id: "percentage", name: "Percentage Off", icon: Percent, color: "from-violet-500 to-purple-600" },
    { id: "flat", name: "Flat Discount", icon: IndianRupee, color: "from-emerald-500 to-green-600" },
    { id: "bogo", name: "Buy 1 Get 1", icon: Gift, color: "from-orange-500 to-amber-600" },
    { id: "custom", name: "Special Deal", icon: Sparkles, color: "from-blue-500 to-cyan-600" },
];

// Premade templates
const CUSTOM_TEMPLATES = [
    { id: "first_time", name: "First Time User", discount: 20, terms: ["Valid for first purchase only", "Cannot be combined"] },
    { id: "loyalty", name: "Loyalty Reward", discount: 15, terms: ["For customers with 5+ visits", "Show previous bills"] },
    { id: "birthday", name: "Birthday Special", discount: 25, terms: ["Show valid ID with birth date", "Valid during birthday month"] },
    { id: "group", name: "Group Discount", discount: 10, terms: ["Minimum 4 students required", "All must show student ID"] },
];

export default function CreateOfferPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [offerType, setOfferType] = useState("");
    const [customTemplate, setCustomTemplate] = useState("");
    const [offerData, setOfferData] = useState({
        name: "",
        actualPrice: "",
        discountValue: "",
        minOrderValue: "",
        maxDiscount: "",
        validFrom: "",
        validUntil: "",
        freeItemName: "",
    });
    const [terms, setTerms] = useState<string[]>([""]);
    const [showPreview, setShowPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Calculations
    const actualPrice = parseFloat(offerData.actualPrice) || 0;
    const discountVal = parseFloat(offerData.discountValue) || 0;

    let discountAmount = 0;
    let finalPrice = actualPrice;

    if (actualPrice > 0) {
        if (offerType === "percentage" || offerType === "custom") {
            discountAmount = (actualPrice * discountVal) / 100;
            if (offerData.maxDiscount && discountAmount > parseFloat(offerData.maxDiscount)) {
                discountAmount = parseFloat(offerData.maxDiscount);
            }
        } else if (offerType === "flat") {
            discountAmount = discountVal;
        } else if (offerType === "bogo") {
            discountAmount = actualPrice;
        }
        finalPrice = Math.max(0, actualPrice - discountAmount);
    }

    const savingsPercent = actualPrice > 0 ? Math.round((discountAmount / actualPrice) * 100) : 0;

    const addTermLine = () => terms.length < 6 && setTerms([...terms, ""]);
    const updateTerm = (i: number, v: string) => {
        const newTerms = [...terms];
        newTerms[i] = v.slice(0, 80);
        setTerms(newTerms);
    };
    const removeTerm = (i: number) => terms.length > 1 && setTerms(terms.filter((_, idx) => idx !== i));

    const applyTemplate = (id: string) => {
        const t = CUSTOM_TEMPLATES.find(x => x.id === id);
        if (t) {
            setCustomTemplate(id);
            setOfferData({ ...offerData, name: t.name, discountValue: t.discount.toString() });
            setTerms(t.terms);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError("");

        try {
            const result = await offerService.create({
                title: offerData.name,
                description: `${currentType?.name || offerType} - Save ₹${discountAmount}`,
                type: offerType as 'percentage' | 'flat' | 'bogo' | 'freebie' | 'custom',
                originalPrice: actualPrice,
                discountValue: discountVal,
                finalPrice: finalPrice,
                discountAmount: discountAmount,
                minOrderValue: offerData.minOrderValue ? parseFloat(offerData.minOrderValue) : undefined,
                maxDiscount: offerData.maxDiscount ? parseFloat(offerData.maxDiscount) : undefined,
                validUntil: offerData.validUntil || undefined,
                terms: terms.filter(t => t.trim()),
                freeItemName: offerData.freeItemName || undefined,
            });

            if (result.success) {
                router.push("/merchant/dashboard/offers");
            } else {
                setSubmitError(result.error || "Failed to create offer");
            }
        } catch (error: any) {
            console.error('Error creating offer:', error);
            setSubmitError(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = offerType !== "" && (offerType !== "custom" || customTemplate !== "");
    const isStep2Valid = offerData.name && offerData.actualPrice && (offerType === "bogo" ? offerData.freeItemName : offerData.discountValue);
    const isStep3Valid = terms.some(t => t.trim());

    const currentType = OFFER_TYPES.find(t => t.id === offerType);

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 pt-12">
            {/* Premium Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
                <div className="px-5 h-16 flex items-center gap-4">
                    <Link href="/merchant/dashboard/offers">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            className="h-11 w-11 rounded-full bg-gray-50 flex items-center justify-center shadow-sm"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="font-bold text-[17px] text-gray-900 tracking-tight">Create Offer</h1>
                        <p className="text-[11px] text-gray-400 font-medium">Step {step} of 4</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setShowPreview(true)}
                        className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                        <Eye className="h-5 w-5 text-primary" />
                    </motion.button>
                </div>

                {/* Progress Pills */}
                <div className="px-5 pb-4 flex gap-2">
                    {[1, 2, 3, 4].map(s => (
                        <motion.div
                            key={s}
                            initial={false}
                            animate={{
                                backgroundColor: s <= step ? "rgb(16 185 129)" : "rgb(229 231 235)",
                                scale: s === step ? 1 : 0.95
                            }}
                            className="h-1.5 flex-1 rounded-full"
                        />
                    ))}
                </div>
            </header>

            <main className="px-5 pt-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">What type of offer?</h2>
                                <p className="text-gray-500 text-sm mt-1">Choose how you want to reward students</p>
                            </div>

                            <div className="space-y-3">
                                {OFFER_TYPES.map(type => (
                                    <motion.button
                                        key={type.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setOfferType(type.id)}
                                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${offerType === type.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg`}>
                                            <type.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-gray-900">{type.name}</p>
                                        </div>
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${offerType === type.id ? 'border-primary bg-primary' : 'border-gray-300'
                                            }`}>
                                            {offerType === type.id && <Check className="h-4 w-4 text-white" />}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Custom Templates */}
                            <AnimatePresence>
                                {offerType === "custom" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3"
                                    >
                                        <p className="text-sm font-medium text-gray-500">Choose a template:</p>
                                        {CUSTOM_TEMPLATES.map(t => (
                                            <motion.button
                                                key={t.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => applyTemplate(t.id)}
                                                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between ${customTemplate === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'
                                                    }`}
                                            >
                                                <span className="font-medium text-gray-900">{t.name}</span>
                                                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                                    {t.discount}% OFF
                                                </span>
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!isStep1Valid}
                                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl shadow-lg shadow-gray-900/20 disabled:opacity-40 disabled:shadow-none"
                                >
                                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Offer Details</h2>
                                <p className="text-gray-500 text-sm mt-1">Set your pricing and discount</p>
                            </div>

                            {/* Offer Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Name</label>
                                <input
                                    type="text"
                                    value={offerData.name}
                                    onChange={(e) => setOfferData({ ...offerData, name: e.target.value })}
                                    placeholder="e.g., Weekend Special"
                                    className="w-full h-14 bg-white rounded-2xl px-4 text-[15px] font-medium outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                />
                            </div>

                            {/* Actual Price */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Actual Price <span className="text-gray-400 normal-case">(incl. GST & all taxes)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <IndianRupee className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="number"
                                        value={offerData.actualPrice}
                                        onChange={(e) => setOfferData({ ...offerData, actualPrice: e.target.value })}
                                        placeholder="500"
                                        className="w-full h-14 bg-white rounded-2xl pl-14 pr-4 text-xl font-bold outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Discount */}
                            {offerType !== "bogo" ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {offerType === "flat" ? "Discount Amount" : "Discount Percentage"}
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
                                            placeholder={offerType === "flat" ? "100" : "20"}
                                            className="w-full h-14 bg-white rounded-2xl pl-14 pr-4 text-xl font-bold outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free Item</label>
                                    <input
                                        type="text"
                                        value={offerData.freeItemName}
                                        onChange={(e) => setOfferData({ ...offerData, freeItemName: e.target.value })}
                                        placeholder="e.g., Same item or any drink"
                                        className="w-full h-14 bg-white rounded-2xl px-4 text-[15px] font-medium outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                    />
                                </div>
                            )}

                            {/* Valid Until Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid Until</label>
                                <input
                                    type="date"
                                    value={offerData.validUntil}
                                    onChange={(e) => setOfferData({ ...offerData, validUntil: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full h-14 bg-white rounded-2xl px-4 text-lg font-medium outline-none border-2 border-gray-100 focus:border-primary transition-colors"
                                />
                            </div>

                            {/* Minimum Bill Amount - MANDATORY */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Minimum Bill Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <IndianRupee className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <input
                                        type="number"
                                        value={offerData.minOrderValue}
                                        onChange={(e) => setOfferData({ ...offerData, minOrderValue: e.target.value })}
                                        placeholder="500"
                                        className="w-full h-14 bg-white rounded-2xl pl-14 pr-20 text-xl font-bold outline-none border-2 border-gray-100 focus:border-amber-400 transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">& above</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Students must order at least this amount to get the discount.
                                </p>
                            </div>

                            {/* Final Amount - READONLY (auto-calculated) */}
                            {actualPrice > 0 && (discountVal > 0 || offerType === "bogo") && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        Final Amount
                                        <span className="text-[10px] font-normal bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Auto-calculated</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <IndianRupee className="h-4 w-4 text-green-600" />
                                        </div>
                                        <input
                                            type="text"
                                            value={`₹${finalPrice.toFixed(0)}`}
                                            readOnly
                                            className="w-full h-14 bg-green-50 rounded-2xl pl-14 pr-4 text-xl font-bold outline-none border-2 border-green-200 text-green-700 cursor-not-allowed"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
                                            Student pays this
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Live Price Card */}
                            <AnimatePresence>
                                {actualPrice > 0 && (discountVal > 0 || offerType === "bogo") && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-2xl"
                                    >
                                        {/* Decorative Elements */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />

                                        <div className="relative">
                                            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4">Student will see</p>

                                            <div className="flex items-baseline gap-3 mb-4">
                                                <span className="text-gray-500 text-2xl line-through font-medium">₹{actualPrice}</span>
                                                <span className="text-white text-5xl font-black tracking-tight">₹{finalPrice.toFixed(0)}</span>
                                            </div>

                                            <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30">
                                                <span className="text-lg">🎉</span>
                                                Save ₹{discountAmount.toFixed(0)} {savingsPercent > 0 && `(${savingsPercent}% off)`}
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-white/10">
                                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">You will receive</p>
                                                <p className="text-white text-3xl font-bold">₹{finalPrice.toFixed(0)}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>



                            <Button
                                onClick={() => setStep(3)}
                                disabled={!isStep2Valid}
                                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl shadow-lg shadow-gray-900/20 disabled:opacity-40"
                            >
                                Continue <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 3: Terms */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Terms & Conditions</h2>
                                <p className="text-gray-500 text-sm mt-1">Add up to 6 conditions (80 chars each)</p>
                            </div>

                            <div className="space-y-3">
                                {terms.map((term, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                            {i + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={term}
                                            onChange={(e) => updateTerm(i, e.target.value)}
                                            placeholder={`Term ${i + 1}`}
                                            className="flex-1 h-12 bg-white rounded-xl px-4 text-sm font-medium outline-none border border-gray-100 focus:border-primary"
                                        />
                                        {terms.length > 1 && (
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => removeTerm(i)}
                                                className="h-8 w-8 flex items-center justify-center text-red-400"
                                            >
                                                <X className="h-4 w-4" />
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {terms.length < 6 && (
                                <button onClick={addTermLine} className="flex items-center gap-2 text-primary text-sm font-semibold">
                                    <Plus className="h-4 w-4" /> Add condition
                                </button>
                            )}

                            <Button
                                onClick={() => setStep(4)}
                                disabled={!isStep3Valid}
                                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl shadow-lg shadow-gray-900/20 disabled:opacity-40"
                            >
                                Preview Offer <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 4: Premium Final Preview */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </button>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Final Preview</h2>
                                <p className="text-gray-500 text-sm mt-1">This is how students will see your offer</p>
                            </div>

                            {/* Premium Offer Card */}
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="relative overflow-hidden rounded-[28px] shadow-2xl"
                            >
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${currentType?.color || 'from-primary to-emerald-600'}`} />

                                {/* Glass Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />

                                {/* Decorative Blurs */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-2xl" />

                                <div className="relative p-7">
                                    {/* Type Badge */}
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="h-9 w-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                            {currentType && <currentType.icon className="h-5 w-5 text-white" />}
                                        </div>
                                        <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                                            {currentType?.name}
                                        </span>
                                    </div>

                                    {/* Offer Name */}
                                    <h3 className="text-white text-3xl font-black tracking-tight mb-6">
                                        {offerData.name || "Your Offer"}
                                    </h3>

                                    {/* Price Card */}
                                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                                        <div className="flex items-end gap-4 mb-4">
                                            <span className="text-white/50 text-2xl font-medium line-through">
                                                ₹{actualPrice}
                                            </span>
                                            <span className="text-white text-5xl font-black tracking-tighter">
                                                ₹{finalPrice.toFixed(0)}
                                            </span>
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2.5 rounded-xl font-bold shadow-lg"
                                        >
                                            <span className="text-xl">✨</span>
                                            Save ₹{discountAmount.toFixed(0)}
                                        </motion.div>
                                    </div>

                                    {/* Validity */}
                                    {offerData.validUntil && (
                                        <div className="flex items-center gap-2 mt-5 text-white/70 text-sm">
                                            <Clock className="h-4 w-4" />
                                            Valid until {new Date(offerData.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Merchant Info Card */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium">You Will Receive</p>
                                        <p className="text-gray-900 text-2xl font-bold">₹{finalPrice.toFixed(0)}</p>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-xs">After student discount is applied</p>
                            </div>

                            {/* Terms */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-4">Terms & Conditions</h4>
                                <ul className="space-y-3">
                                    {terms.filter(t => t.trim()).map((term, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                            {term}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep(2)}
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl font-semibold border-2"
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30"
                                >
                                    Create Offer 🎉
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            onClick={e => e.stopPropagation()}
                            className={`relative overflow-hidden rounded-[28px] w-full max-w-sm shadow-2xl bg-gradient-to-br ${currentType?.color || 'from-primary to-emerald-600'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />

                            <div className="relative p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                                        {currentType?.name || "Preview"}
                                    </span>
                                    <button onClick={() => setShowPreview(false)} className="text-white/60">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <h3 className="text-white text-2xl font-bold mb-6">{offerData.name || "Your Offer"}</h3>

                                {actualPrice > 0 && discountVal > 0 ? (
                                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-white/50 text-xl line-through">₹{actualPrice}</span>
                                            <span className="text-white text-4xl font-black">₹{finalPrice.toFixed(0)}</span>
                                        </div>
                                        <p className="text-white/80 text-sm mt-2">Save ₹{discountAmount.toFixed(0)}</p>
                                    </div>
                                ) : (
                                    <p className="text-white/60 text-sm mb-4">Enter price and discount to preview</p>
                                )}

                                <Button onClick={() => setShowPreview(false)} className="w-full bg-white text-gray-900 font-semibold h-12 rounded-xl">
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
