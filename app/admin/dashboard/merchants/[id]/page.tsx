"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, MapPin, FileText, Check, X, Eye, Download, Image, Loader2, Trash2, AlertTriangle, Tag, Percent, IndianRupee, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { merchantService } from "@/lib/services/merchant.service";
import { offerService } from "@/lib/services/offer.service";
import { Merchant, Offer } from "@/lib/types";

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

// Category-based terms templates
const TERMS_TEMPLATES: Record<string, string[]> = {
    'Food': [
        'Valid for dine-in only',
        'Cannot be combined with other offers',
        'Valid student ID required',
        'One redemption per visit',
        'Minimum order value may apply'
    ],
    'Cafe': [
        'Valid on all beverages',
        'Valid student ID required',
        'Cannot be clubbed with other offers',
        'One redemption per day',
        'Applicable on dine-in only'
    ],
    'Gym': [
        'Valid on monthly membership only',
        'Valid student ID required',
        'First-time members only',
        'Registration fee applies separately',
        'Cannot be transferred'
    ],
    'Salon': [
        'Prior appointment required',
        'Valid student ID required',
        'Applicable on selected services',
        'Cannot be combined with other offers',
        'One redemption per month'
    ],
    'Electronics': [
        'Valid on MRP only',
        'Valid student ID required',
        'Not applicable on sale items',
        'One unit per student',
        'Warranty as per brand policy'
    ],
    'Fashion': [
        'Valid on fresh arrivals',
        'Valid student ID required',
        'Not valid on discounted items',
        'One redemption per purchase',
        'Exchange policy as per store'
    ],
    'Books': [
        'Valid on all books',
        'Valid student ID required',
        'Not applicable on stationery',
        'One redemption per bill',
        'No cash refunds'
    ],
    'General': [
        'Valid student ID required',
        'Cannot be combined with other offers',
        'One redemption per visit',
        'Subject to availability',
        'Terms may change without notice'
    ]
};

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
        freeItemName: '',
        terms: '',
        expiryDate: ''
    });

    // Offers Management State
    const [offers, setOffers] = useState<Offer[]>([]);
    const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
    const [offersLoading, setOffersLoading] = useState(false);
    const [expandedAdminOfferId, setExpandedAdminOfferId] = useState<string | null>(null);

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

        async function fetchOffers() {
            setOffersLoading(true);
            try {
                const result = await offerService.getByMerchantId(merchantId);
                if (result.success && result.data) {
                    setOffers(result.data);
                }
            } catch (err: any) {
                console.error("Failed to fetch offers:", err);
            } finally {
                setOffersLoading(false);
            }
        }

        if (merchantId) {
            fetchMerchant();
            fetchOffers();
        }
    }, [merchantId]);

    // Refresh offers list (called after creating new offer)
    const refreshOffers = async () => {
        setOffersLoading(true);
        try {
            const result = await offerService.getByMerchantId(merchantId);
            if (result.success && result.data) {
                setOffers(result.data);
            }
        } catch (err: any) {
            console.error("Failed to refresh offers:", err);
        } finally {
            setOffersLoading(false);
        }
    };

    // Handle creating a new offer (for approved merchants)
    const handleCreateNewOffer = async () => {
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
            // Calculate discount amount and final price
            let discountAmount = 0;
            let finalPrice = actualPrice;

            if (offerData.type === 'flat') {
                discountAmount = discountVal;
                finalPrice = Math.max(0, actualPrice - discountVal);
            } else if (offerData.type === 'percentage') {
                discountAmount = Math.round(actualPrice * (discountVal / 100));
                finalPrice = actualPrice - discountAmount;
            }

            // Create the offer with admin tracking
            const termsArray = offerData.terms
                ? offerData.terms.split('\n').filter((t: string) => t.trim())
                : ["Valid for verified students only"];

            const offerResult = await offerService.createForMerchant(merchantId, {
                title: offerData.name,
                type: offerData.type,
                discountValue: discountVal,
                originalPrice: actualPrice || 100,
                finalPrice: finalPrice,
                discountAmount: discountAmount,
                minOrderValue: actualPrice || 100,
                freeItemName: offerData.freeItemName || undefined,
                terms: termsArray,
                status: 'active',
                validUntil: offerData.expiryDate || undefined
            });

            if (!offerResult.success) {
                setError(offerResult.error || "Failed to create offer");
            } else {
                // Success - close modal and refresh offers
                setShowCreateOfferModal(false);
                setOfferData({
                    type: 'flat',
                    discountValue: '',
                    actualPrice: '',
                    name: '',
                    freeItemName: '',
                    terms: '',
                    expiryDate: ''
                });
                await refreshOffers();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

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
                status: 'active',
                validUntil: offerData.expiryDate || undefined
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

            {/* Create New Offer Modal (for approved merchants) */}
            {showCreateOfferModal && merchant.status === 'approved' && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Admin</p>
                                    <h2 className="font-bold">Create New Offer</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowCreateOfferModal(false); setError(""); }}
                                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Quick Templates */}
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

                            {/* Offer Name */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Name</label>
                                <input
                                    type="text"
                                    value={offerData.name}
                                    onChange={(e) => {
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

                            {/* Actual Price */}
                            {(offerData.type === 'flat' || offerData.type === 'percentage') && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actual Item Price (₹)
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

                            {/* Terms & Conditions - Templates + Custom */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Terms & Conditions</label>

                                {/* Quick Templates based on category */}
                                {merchant?.category && (
                                    <div className="mt-2 mb-3">
                                        <p className="text-[10px] text-gray-400 mb-2">Quick select ({merchant.category}):</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(TERMS_TEMPLATES[merchant.category] || TERMS_TEMPLATES['General']).map((template, idx) => {
                                                const currentTerms = offerData.terms ? offerData.terms.split('\n').filter(t => t.trim()) : [];
                                                const isSelected = currentTerms.includes(template);
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                // Remove template
                                                                const newTerms = currentTerms.filter(t => t !== template);
                                                                setOfferData({ ...offerData, terms: newTerms.join('\n') });
                                                            } else {
                                                                // Add template
                                                                const newTerms = [...currentTerms, template];
                                                                setOfferData({ ...offerData, terms: newTerms.join('\n') });
                                                            }
                                                        }}
                                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSelected
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                                                            }`}
                                                    >
                                                        {isSelected ? '✓ ' : '+ '}{template}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Selected Terms (editable) */}
                                <div className="space-y-2">
                                    {(offerData.terms ? offerData.terms.split('\n').filter(t => t.trim()) : []).map((term, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{index + 1}</span>
                                            <input
                                                type="text"
                                                value={term}
                                                onChange={(e) => {
                                                    const terms = offerData.terms.split('\n').filter(t => t.trim());
                                                    terms[index] = e.target.value;
                                                    setOfferData({ ...offerData, terms: terms.join('\n') });
                                                }}
                                                className="flex-1 h-10 bg-gray-100 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const terms = offerData.terms.split('\n').filter((t, i) => t.trim() && i !== index);
                                                    setOfferData({ ...offerData, terms: terms.join('\n') });
                                                }}
                                                className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentTerms = offerData.terms ? offerData.terms.split('\n').filter(t => t.trim()) : [];
                                            setOfferData({ ...offerData, terms: [...currentTerms, ''].join('\n') });
                                        }}
                                        className="w-full h-10 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Custom Term
                                    </button>
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Offer Valid Until</label>
                                <input
                                    type="date"
                                    value={offerData.expiryDate}
                                    onChange={(e) => setOfferData({ ...offerData, expiryDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full h-12 bg-gray-100 rounded-xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            {/* Enhanced Live Preview */}
                            {offerData.name && (offerData.discountValue || offerData.type === 'bogo') && (
                                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">Live Preview</p>

                                    {/* Offer Card Preview */}
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex flex-col items-center justify-center text-white">
                                            <span className="text-sm font-black leading-none">
                                                {offerData.type === 'percentage' ? `${offerData.discountValue}%` : `₹${offerData.discountValue}`}
                                            </span>
                                            <span className="text-[8px] font-medium opacity-80">OFF</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{offerData.name}</p>
                                            <div className="flex items-baseline gap-2">
                                                {offerData.actualPrice && (
                                                    <>
                                                        <span className="text-gray-400 text-sm line-through">₹{offerData.actualPrice}</span>
                                                        <span className="text-primary font-bold">
                                                            ₹{offerData.type === 'flat'
                                                                ? Math.max(0, parseFloat(offerData.actualPrice) - parseFloat(offerData.discountValue || '0'))
                                                                : Math.round(parseFloat(offerData.actualPrice) * (1 - parseFloat(offerData.discountValue || '0') / 100))
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms Preview */}
                                    {offerData.terms && offerData.terms.trim() && (
                                        <div className="pt-3">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Terms</p>
                                            {offerData.terms.split('\n').filter(t => t.trim()).map((term, i) => (
                                                <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                    <span className="text-gray-400">•</span>
                                                    {term}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Expiry Preview */}
                                    {offerData.expiryDate && (
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            Valid until {new Date(offerData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            {/* Create Button */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateOfferModal(false); setError(""); }}
                                    className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateNewOffer}
                                    disabled={actionLoading || !offerData.name || (!offerData.discountValue && offerData.type !== 'bogo')}
                                    className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Create Offer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
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

                {/* Discount Offers Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Discount Offers</h3>
                        {merchant.status === 'approved' && (
                            <button
                                onClick={() => setShowCreateOfferModal(true)}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                            >
                                <Plus className="h-4 w-4" />
                                Add Offer
                            </button>
                        )}
                    </div>

                    {offersLoading ? (
                        <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : offers.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center">
                            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-400">No offers created yet</p>
                            {merchant.status === 'approved' && (
                                <button
                                    onClick={() => setShowCreateOfferModal(true)}
                                    className="mt-3 text-xs font-medium text-primary hover:underline"
                                >
                                    + Create First Offer
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {offers.map((offer) => (
                                <motion.div
                                    key={offer.id}
                                    layout
                                    onClick={() => setExpandedAdminOfferId(expandedAdminOfferId === offer.id ? null : offer.id)}
                                    className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm cursor-pointer hover:border-primary/30 transition-colors"
                                >
                                    {/* Compact Row */}
                                    <div className="flex items-center gap-3">
                                        {/* Discount Badge */}
                                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex flex-col items-center justify-center text-white">
                                            <span className="text-sm font-black leading-none">
                                                {offer.type === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                                            </span>
                                            <span className="text-[8px] font-medium opacity-80">OFF</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-semibold text-gray-900 truncate text-sm">{offer.title}</p>
                                                {offer.createdByType === 'admin' && (
                                                    <span className="flex-shrink-0 text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">ADMIN</span>
                                                )}
                                                <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${offer.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {offer.status?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-gray-400 text-xs line-through">₹{offer.originalPrice}</span>
                                                <span className="text-primary font-bold">₹{offer.finalPrice}</span>
                                                <span className="text-[10px] text-green-600">Save ₹{offer.discountAmount}</span>
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <motion.div
                                            animate={{ rotate: expandedAdminOfferId === offer.id ? 90 : 0 }}
                                            className="flex-shrink-0 text-gray-400"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </motion.div>
                                    </div>

                                    {/* Expanded - Terms */}
                                    <AnimatePresence>
                                        {expandedAdminOfferId === offer.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-3 mt-3 border-t border-gray-100 pl-[60px]">
                                                    {offer.terms && offer.terms.length > 0 && (
                                                        <div className="mb-2">
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Terms</p>
                                                            {(() => {
                                                                let termsArray: string[] = [];
                                                                if (Array.isArray(offer.terms)) {
                                                                    termsArray = offer.terms;
                                                                } else if (typeof offer.terms === 'string') {
                                                                    const patterns = /(?=Valid |Cannot |One |Minimum |Prior |First|Not |Subject |Terms |Applicable |No |Exchange )/g;
                                                                    termsArray = offer.terms.split(patterns).filter(t => t.trim());
                                                                }
                                                                return termsArray.map((term: string, i: number) => (
                                                                    <p key={i} className="text-xs text-gray-600 flex items-start gap-1 mb-0.5">
                                                                        <span className="text-primary flex-shrink-0">•</span>
                                                                        <span>{term.trim()}</span>
                                                                    </p>
                                                                ));
                                                            })()}
                                                        </div>
                                                    )}
                                                    {offer.validUntil && (
                                                        <p className="text-[10px] text-gray-400">
                                                            Valid until {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
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
