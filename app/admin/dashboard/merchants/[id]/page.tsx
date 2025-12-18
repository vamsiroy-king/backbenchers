"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, MapPin, FileText, Check, X, Eye, Download, Image, Loader2, Trash2, AlertTriangle, Tag, Percent, IndianRupee } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { Merchant } from "@/lib/types";

const CHECKLIST = [
    { id: 1, label: "Business details verified", checked: false },
    { id: 2, label: "Store photos reviewed", checked: false },
    { id: 3, label: "Location is valid", checked: false },
    { id: 4, label: "Contact verified", checked: false },
];

const REJECTION_REASONS = [
    "Store photos unclear or inappropriate",
    "Business information incomplete",
    "Invalid business category",
    "Suspicious activity detected",
    "Location not verifiable",
    "Other (specify below)"
];

export default function MerchantReviewPage() {
    const router = useRouter();
    const params = useParams();
    const merchantId = params.id as string;

    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [checklist, setChecklist] = useState(CHECKLIST);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectNote, setRejectNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 2-Step Approval Flow State
    const [approvalStep, setApprovalStep] = useState<1 | 2>(1);
    const [offerData, setOfferData] = useState({
        type: 'flat' as 'percentage' | 'flat' | 'bogo' | 'freebie',
        discountValue: '',
        actualPrice: '',
        name: '',
        freeItemName: ''
    });

    // Fetch merchant data
    useEffect(() => {
        async function fetchMerchant() {
            try {
                const result = await merchantService.getById(merchantId);
                if (result.success && result.data) {
                    setMerchant(result.data);
                } else {
                    setError("Merchant not found");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (merchantId) {
            fetchMerchant();
        }
    }, [merchantId]);

    const allChecked = checklist.every(item => item.checked);

    const toggleCheck = (id: number) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleApprove = async () => {
        if (approvalStep === 1) {
            // Move to offer creation step
            setApprovalStep(2);
            return;
        }

        // Validate offer data
        const discountVal = parseFloat(offerData.discountValue);
        const actualPrice = parseFloat(offerData.actualPrice);

        if (!offerData.name || isNaN(discountVal) || discountVal <= 0) {
            setError("Please fill in all offer details");
            return;
        }

        if ((offerData.type === 'flat' || offerData.type === 'percentage') && (isNaN(actualPrice) || actualPrice <= 0)) {
            setError("Please enter a valid actual price");
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            // Step 1: Approve the merchant first to get BBM-ID
            const approveResult = await merchantService.approve(merchantId);
            if (!approveResult.success) {
                throw new Error(approveResult.error || "Failed to approve merchant");
            }

            // Calculate offer values
            let discountAmount = 0;
            let finalPrice = 0;
            const originalPrice = actualPrice || 100;

            if (offerData.type === 'percentage') {
                discountAmount = (originalPrice * discountVal) / 100;
                finalPrice = originalPrice - discountAmount;
            } else if (offerData.type === 'flat') {
                discountAmount = discountVal;
                finalPrice = Math.max(0, originalPrice - discountVal);
            } else if (offerData.type === 'bogo') {
                discountAmount = originalPrice;
                finalPrice = originalPrice; // Buy one, get one free - pay for one
            } else if (offerData.type === 'freebie') {
                discountAmount = 0;
                finalPrice = originalPrice;
            }

            // Step 2: Create the first offer
            const offerResult = await offerService.createForMerchant(merchantId, {
                title: offerData.name,
                type: offerData.type,
                discountValue: discountVal,
                originalPrice: originalPrice,
                finalPrice: finalPrice,
                discountAmount: discountAmount,
                minOrderValue: originalPrice,
                freeItemName: offerData.type === 'freebie' ? offerData.freeItemName : undefined,
                terms: ["Valid student ID required", "Cannot be combined with other offers"],
                status: 'active'
            });

            if (!offerResult.success) {
                console.error("Offer creation failed:", offerResult.error);
                // Don't throw - merchant is already approved, just log the error
            }

            // Success - redirect to merchants list
            router.push("/admin/dashboard/merchants");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) return;
        setActionLoading(true);
        try {
            const reason = rejectReason === "Other (specify below)" ? rejectNote : rejectReason;
            const result = await merchantService.reject(merchantId, reason);
            if (result.success) {
                router.push("/admin/dashboard/merchants");
            } else {
                setError(result.error || "Failed to reject merchant");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
            setShowRejectModal(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            const result = await merchantService.delete(merchantId);
            if (result.success) {
                router.push("/admin/dashboard/merchants");
            } else {
                setError(result.error || "Failed to delete merchant");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !merchant) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <p className="text-red-500 mb-4">{error || "Merchant not found"}</p>
                <Link href="/admin/dashboard/merchants">
                    <Button>Back to Merchants</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-32 pt-12">
            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 h-10 w-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>
            )}

            {/* 2-Step Approval + Offer Creation Modal */}
            {showApproveConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Step {approvalStep}/2</p>
                                    <h2 className="font-bold">{approvalStep === 1 ? "Approve Merchant" : "Create First Offer"}</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowApproveConfirm(false); setApprovalStep(1); setError(""); }}
                                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {approvalStep === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {/* Merchant Summary */}
                                        <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-4">
                                            {merchant.logo ? (
                                                <img src={merchant.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                                                    <Store className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold">{merchant.businessName}</p>
                                                <p className="text-xs text-gray-500">{merchant.category} • {merchant.city}</p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <p className="text-sm text-amber-800">
                                                ⏳ <strong>BBM-ID will be generated</strong> after you create the first discount offer in the next step.
                                            </p>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            The merchant will become visible to students only after the first offer is created.
                                        </p>

                                        <Button
                                            onClick={handleApprove}
                                            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                                        >
                                            Next: Create Offer →
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        {/* Offer Type */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Type</label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {[
                                                    { id: 'flat', label: '₹ Flat OFF', icon: IndianRupee },
                                                    { id: 'percentage', label: '% OFF', icon: Percent },
                                                    { id: 'bogo', label: 'Buy 1 Get 1', icon: Tag },
                                                    { id: 'freebie', label: 'Free Item', icon: Tag }
                                                ].map(type => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setOfferData({ ...offerData, type: type.id as any })}
                                                        className={`p-3 rounded-xl border-2 flex items-center gap-2 text-sm font-medium transition-all ${offerData.type === type.id
                                                            ? 'border-primary bg-primary/5 text-primary'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <type.icon className="h-4 w-4" />
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Premade Templates */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Templates</label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {[
                                                    { name: 'Student Special', type: 'flat', discount: '50' },
                                                    { name: 'Campus Feast', type: 'percentage', discount: '20' },
                                                    { name: 'Buy 1 Get 1 Free', type: 'bogo', discount: '0' },
                                                    { name: 'First Order Bonus', type: 'flat', discount: '100' }
                                                ].map(template => (
                                                    <button
                                                        key={template.name}
                                                        onClick={() => setOfferData({
                                                            ...offerData,
                                                            name: template.name,
                                                            type: template.type as any,
                                                            discountValue: template.discount
                                                        })}
                                                        className="p-2 rounded-lg border border-gray-200 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-all text-left"
                                                    >
                                                        {template.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Offer Name with Auto-Capitalize */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Name</label>
                                            <input
                                                type="text"
                                                value={offerData.name}
                                                onChange={(e) => {
                                                    // Auto Title Case: Capitalize first letter of each word
                                                    const titleCase = e.target.value
                                                        .split(' ')
                                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                        .join(' ');
                                                    setOfferData({ ...offerData, name: titleCase });
                                                }}
                                                placeholder="e.g., Student Special"
                                                className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>

                                        {/* Discount Value */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {offerData.type === 'percentage' ? 'Discount Percentage' : offerData.type === 'flat' ? 'Discount Amount (₹)' : 'Discount Value'}
                                            </label>
                                            <div className="relative mt-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {offerData.type === 'percentage' ? '%' : '₹'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={offerData.discountValue}
                                                    onChange={(e) => setOfferData({ ...offerData, discountValue: e.target.value })}
                                                    placeholder={offerData.type === 'percentage' ? '10' : '50'}
                                                    className="w-full h-12 bg-gray-100 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Actual Price (for flat/percentage) */}
                                        {(offerData.type === 'flat' || offerData.type === 'percentage') && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Actual Item Price (₹) <span className="text-gray-400 normal-case">- auto-sets min order</span>
                                                </label>
                                                <div className="relative mt-1">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={offerData.actualPrice}
                                                        onChange={(e) => setOfferData({ ...offerData, actualPrice: e.target.value })}
                                                        placeholder="200"
                                                        className="w-full h-12 bg-gray-100 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Free Item Name (for freebie) */}
                                        {offerData.type === 'freebie' && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free Item Name</label>
                                                <input
                                                    type="text"
                                                    value={offerData.freeItemName}
                                                    onChange={(e) => setOfferData({ ...offerData, freeItemName: e.target.value })}
                                                    placeholder="e.g., Free Coke with any meal"
                                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        )}

                                        {/* Enhanced Preview with Price Calculation */}
                                        {offerData.name && (offerData.discountValue || offerData.type === 'bogo') && (
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-5 border border-green-200">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Live Preview</p>
                                                <p className="font-bold text-lg text-gray-900">{offerData.name}</p>

                                                {/* Price Display */}
                                                {(offerData.type === 'flat' || offerData.type === 'percentage') && offerData.actualPrice && (
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <span className="line-through text-gray-400 text-lg">₹{offerData.actualPrice}</span>
                                                        <span className="text-2xl font-black text-green-600">
                                                            ₹{offerData.type === 'flat'
                                                                ? Math.max(0, parseFloat(offerData.actualPrice) - parseFloat(offerData.discountValue || '0'))
                                                                : Math.round(parseFloat(offerData.actualPrice) * (1 - parseFloat(offerData.discountValue || '0') / 100))
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Savings Badge */}
                                                <div className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                                                    {offerData.type === 'percentage' ? (
                                                        <span>🎉 {offerData.discountValue}% OFF</span>
                                                    ) : offerData.type === 'flat' ? (
                                                        <span>🎉 Save ₹{offerData.discountValue}</span>
                                                    ) : offerData.type === 'bogo' ? (
                                                        <span>🎁 Buy 1 Get 1 FREE</span>
                                                    ) : (
                                                        <span>🎁 Free: {offerData.freeItemName || 'Item'}</span>
                                                    )}
                                                </div>

                                                {/* Min Order Notice */}
                                                {offerData.actualPrice && (
                                                    <p className="text-xs text-gray-500 mt-2">Min. order: ₹{offerData.actualPrice}</p>
                                                )}
                                            </div>
                                        )}

                                        {error && (
                                            <p className="text-sm text-red-500 text-center">{error}</p>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                onClick={() => { setApprovalStep(1); setError(""); }}
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl"
                                            >
                                                ← Back
                                            </Button>
                                            <Button
                                                onClick={handleApprove}
                                                disabled={actionLoading}
                                                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
                                            >
                                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Approve & Create Offer"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-sm"
                    >
                        <h2 className="text-lg font-bold mb-4">Reject Application</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                                <select
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none"
                                >
                                    <option value="">Select reason</option>
                                    {REJECTION_REASONS.map(reason => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Additional Notes</label>
                                <textarea
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                    placeholder="Any additional feedback for the merchant..."
                                    rows={3}
                                    className="w-full bg-gray-100 rounded-xl px-4 py-3 mt-1 text-sm outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={() => setShowRejectModal(false)}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={!rejectReason || actionLoading}
                                className="flex-1 h-12 bg-red-500 text-white rounded-xl disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reject"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-sm text-center"
                    >
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold mb-2">Delete Merchant?</h2>
                        <p className="text-sm text-gray-500 mb-2">
                            Are you sure you want to permanently delete <strong>{merchant.businessName}</strong>?
                        </p>
                        <p className="text-xs text-red-500 mb-6 font-medium">
                            ⚠️ This will also delete all their offers and cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowDeleteConfirm(false)}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            >
                                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
                <div className="px-4 h-14 flex items-center gap-4">
                    <Link href="/admin/dashboard/merchants">
                        <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <h1 className="font-extrabold text-lg">Review Merchant</h1>
                </div>
            </header>

            <main className="px-4 pt-6 space-y-6">
                {/* Merchant Info */}
                <div className="bg-primary/10 rounded-2xl p-5">
                    <div className="flex items-center gap-4 mb-4">
                        {merchant.logo ? (
                            <img src={merchant.logo} alt={merchant.businessName} className="h-14 w-14 rounded-xl object-cover" />
                        ) : (
                            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center">
                                <Store className="h-7 w-7 text-white" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-extrabold">{merchant.businessName}</h2>
                            <p className="text-sm text-gray-600">{merchant.category}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {merchant.city}, {merchant.state}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Submitted: {formatDate(merchant.createdAt)}</p>
                </div>

                {/* Business Details */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Business Details</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Owner</span>
                            <span className="font-medium">{merchant.ownerName || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Owner Phone</span>
                            <span className="font-medium">{merchant.ownerPhone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{merchant.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pin Code</span>
                            <span className="font-medium">{merchant.pinCode || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-right max-w-[60%]">{merchant.address || '-'}</span>
                        </div>
                        {merchant.googleMapsLink && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Location</span>
                                <a
                                    href={merchant.googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Open in Google Maps
                                </a>
                            </div>
                        )}
                        {merchant.phone && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Business Phone</span>
                                <span className="font-medium">{merchant.phone}</span>
                            </div>
                        )}
                        {merchant.description && (
                            <div className="pt-2 border-t border-gray-200">
                                <span className="text-gray-500 block mb-1">Description</span>
                                <span className="text-gray-700">{merchant.description}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Images Section */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Photos & Branding</h3>

                    {/* Logo and Cover */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Image className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium">Logo</span>
                            </div>
                            {merchant.logo ? (
                                <button
                                    onClick={() => setPreviewImage(merchant.logo!)}
                                    className="w-full aspect-square rounded-lg overflow-hidden bg-white"
                                >
                                    <img src={merchant.logo} alt="Logo" className="w-full h-full object-cover" />
                                </button>
                            ) : (
                                <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">Not uploaded</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Image className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium">Cover Photo</span>
                            </div>
                            {merchant.coverPhoto ? (
                                <button
                                    onClick={() => setPreviewImage(merchant.coverPhoto!)}
                                    className="w-full aspect-square rounded-lg overflow-hidden bg-white"
                                >
                                    <img src={merchant.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                                </button>
                            ) : (
                                <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">Not uploaded</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Store Photos */}
                    {merchant.storeImages && merchant.storeImages.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-3">
                                <Image className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium">Store Photos ({merchant.storeImages.length})</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {merchant.storeImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setPreviewImage(img)}
                                        className="aspect-square rounded-lg overflow-hidden bg-white"
                                    >
                                        <img src={img} alt={`Store ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Verification Checklist */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Verification Checklist</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        {checklist.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => toggleCheck(item.id)}
                                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl"
                            >
                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${item.checked ? 'bg-primary' : 'bg-gray-200'
                                    }`}>
                                    {item.checked && <Check className="h-4 w-4 text-white" />}
                                </div>
                                <span className={`text-sm ${item.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons - Only show for pending merchants */}
                {merchant.status === 'pending' ? (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="outline"
                            className="h-14 px-4 border-red-200 text-red-500 rounded-2xl font-bold"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={() => setShowRejectModal(true)}
                            variant="outline"
                            className="flex-1 h-14 border-red-200 text-red-500 rounded-2xl font-bold"
                        >
                            <X className="h-5 w-5 mr-2" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => setShowApproveConfirm(true)}
                            disabled={!allChecked}
                            className="flex-1 h-14 bg-primary text-white rounded-2xl font-bold disabled:opacity-50"
                        >
                            <Check className="h-5 w-5 mr-2" />
                            Approve
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="outline"
                            className="h-14 px-4 border-red-200 text-red-500 rounded-2xl font-bold"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <div className={`flex-1 h-14 rounded-2xl flex items-center justify-center font-bold ${merchant.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {merchant.status === 'approved' ? (
                                <>
                                    <Check className="h-5 w-5 mr-2" />
                                    Approved - BBM: {merchant.bbmId}
                                </>
                            ) : (
                                <>
                                    <X className="h-5 w-5 mr-2" />
                                    Rejected
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
