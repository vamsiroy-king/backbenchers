"use client";

import { Button } from "@/components/ui/button";
import { Plus, Tag, Percent, IndianRupee, Gift, Sparkles, Clock, Trash2, Pause, Play, X, Users, TrendingUp, Calendar, AlertTriangle, Shield, ChevronRight, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { offerService } from "@/lib/services/offer.service";
import { Offer } from "@/lib/types";

// Offer type configuration for UI
const OFFER_CONFIG = {
    percentage: { icon: Percent, color: "from-violet-500 to-purple-600", bg: "bg-violet-100", text: "text-violet-600" },
    flat: { icon: IndianRupee, color: "from-emerald-500 to-green-600", bg: "bg-emerald-100", text: "text-emerald-600" },
    bogo: { icon: Gift, color: "from-orange-500 to-amber-600", bg: "bg-orange-100", text: "text-orange-600" },
    freebie: { icon: Gift, color: "from-pink-500 to-rose-600", bg: "bg-pink-100", text: "text-pink-600" },
    custom: { icon: Sparkles, color: "from-blue-500 to-cyan-600", bg: "bg-blue-100", text: "text-blue-600" },
};

type ConfirmAction = "pause" | "resume" | "delete" | null;

// Extended offer with UI state
interface OfferWithState extends Offer {
    isActive: boolean;
    lastActionAt: Date;
    revenue?: number;
    newCustomers?: number;
}

export default function OffersPage() {
    const [offers, setOffers] = useState<OfferWithState[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOffer, setSelectedOffer] = useState<OfferWithState | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [showTerms, setShowTerms] = useState(false);

    // Fetch real offers from database
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setLoading(true);
                const result = await offerService.getMyOffers();
                if (result.success && result.data) {
                    // Map to OfferWithState format
                    const mappedOffers: OfferWithState[] = result.data.map(offer => ({
                        ...offer,
                        isActive: offer.status === 'active',
                        lastActionAt: new Date(offer.createdAt),
                        // Revenue = Final Price × Redemptions (what merchant actually earned)
                        revenue: (offer.finalPrice || 0) * offer.totalRedemptions,
                        newCustomers: Math.floor(offer.totalRedemptions * 0.3) // Estimate
                    }));
                    setOffers(mappedOffers);
                }
            } catch (error) {
                console.error("Failed to fetch offers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    // Check if action is allowed (midnight reset logic)
    const canTakeAction = (offer: OfferWithState) => {
        const now = new Date();
        const lastAction = new Date(offer.lastActionAt);

        const nextAllowedMidnight = new Date(lastAction);
        nextAllowedMidnight.setDate(nextAllowedMidnight.getDate() + 1);
        nextAllowedMidnight.setHours(0, 0, 0, 0);

        return now >= nextAllowedMidnight;
    };

    // Get time until next allowed action
    const getTimeUntilAllowed = (offer: OfferWithState) => {
        const now = new Date();
        const lastAction = new Date(offer.lastActionAt);

        const nextAllowedMidnight = new Date(lastAction);
        nextAllowedMidnight.setDate(nextAllowedMidnight.getDate() + 1);
        nextAllowedMidnight.setHours(0, 0, 0, 0);

        const diff = nextAllowedMidnight.getTime() - now.getTime();
        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const handleAction = (action: ConfirmAction) => {
        if (!selectedOffer || !action) return;

        const updatedOffers = offers.map(o => {
            if (o.id === selectedOffer.id) {
                if (action === "delete") return null;
                return {
                    ...o,
                    isActive: action === "resume" ? true : action === "pause" ? false : o.isActive,
                    lastActionAt: new Date()
                };
            }
            return o;
        }).filter(Boolean) as OfferWithState[];

        setOffers(updatedOffers);
        setConfirmAction(null);
        setSelectedOffer(null);
    };

    const activeCount = offers.filter(o => o.isActive).length;
    const totalRedemptions = offers.reduce((sum, o) => sum + (o.totalRedemptions || 0), 0);
    const totalRevenue = offers.reduce((sum, o) => sum + (o.revenue || 0), 0);

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-32 pt-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-xl text-gray-900 tracking-tight">My Offers</h1>
                        <p className="text-xs text-gray-400 mt-0.5">{activeCount} active • {totalRedemptions} redemptions</p>
                    </div>
                    <Link href="/merchant/dashboard/offers/new">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-11 px-5 bg-primary text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-4 w-4" /> New
                        </motion.button>
                    </Link>
                </div>
            </header>

            <main className="px-5 pt-5">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-gray-500">Total Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500">New Customers</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">+{offers.reduce((s, o) => s + (o.newCustomers || 0), 0)}</p>
                    </div>
                </div>

                {/* Offers List */}
                <div className="space-y-3">
                    {offers.map(offer => {
                        const config = OFFER_CONFIG[offer.type as keyof typeof OFFER_CONFIG];
                        const IconComponent = config?.icon || Tag;

                        return (
                            <motion.div
                                key={offer.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedOffer(offer)}
                                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md ${!offer.isActive ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${config?.color} flex items-center justify-center shadow-lg`}>
                                        <IconComponent className="h-7 w-7 text-white" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-gray-900 truncate">{offer.title}</h3>
                                            {offer.createdByType === 'admin' && (
                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">ADMIN</span>
                                            )}
                                            {!offer.isActive && (
                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">PAUSED</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span>{offer.type === "flat" ? `₹${offer.discountValue} off` : offer.type === "bogo" ? "B1G1" : `${offer.discountValue}% off`}</span>
                                            <span>•</span>
                                            <span>{offer.totalRedemptions || 0} used</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${config?.text}`}>
                                            {offer.type === "flat" ? `₹${offer.discountValue}` : offer.type === "bogo" ? "B1G1" : `${offer.discountValue}%`}
                                        </p>
                                        <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1 mt-1">
                                            <Clock className="h-3 w-3" />
                                            {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No expiry'}
                                        </p>
                                    </div>

                                    <ChevronRight className="h-5 w-5 text-gray-300" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Terms Link */}
                <button onClick={() => setShowTerms(true)} className="flex items-center gap-2 text-gray-400 text-sm mt-6 mx-auto">
                    <FileText className="h-4 w-4" />
                    View Offer Terms & Conditions
                </button>
            </main>

            {/* Offer Detail Sheet - ABSOLUTE positioning for mobile containment */}
            <AnimatePresence>
                {selectedOffer && !confirmAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedOffer(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="absolute bottom-20 left-0 right-0 bg-white rounded-t-[28px] max-h-[70%] overflow-y-auto shadow-2xl"
                        >
                            {/* Handle */}
                            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 flex justify-center z-10">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                            </div>

                            <div className="px-5 pb-8">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${OFFER_CONFIG[selectedOffer.type as keyof typeof OFFER_CONFIG]?.color} flex items-center justify-center`}>
                                            {(() => {
                                                const Icon = OFFER_CONFIG[selectedOffer.type as keyof typeof OFFER_CONFIG]?.icon || Tag;
                                                return <Icon className="h-6 w-6 text-white" />;
                                            })()}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900">{selectedOffer.title}</h2>
                                            <p className="text-xs text-gray-500">Created {selectedOffer.createdAt ? new Date(selectedOffer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedOffer(null)}>
                                        <X className="h-6 w-6 text-gray-400" />
                                    </button>
                                </div>

                                {/* Price Display */}
                                <div className={`rounded-2xl p-5 mb-6 bg-gradient-to-br ${OFFER_CONFIG[selectedOffer.type as keyof typeof OFFER_CONFIG]?.color}`}>
                                    <p className="text-white/70 text-xs uppercase tracking-wider mb-2">Student Price</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-white/50 text-xl line-through">₹{selectedOffer.originalPrice || 0}</span>
                                        <span className="text-white text-4xl font-black">₹{selectedOffer.finalPrice || 0}</span>
                                    </div>
                                    <div className="mt-3 bg-white/20 inline-block px-3 py-1.5 rounded-lg text-white text-sm font-semibold">
                                        Save ₹{(selectedOffer.originalPrice || 0) - (selectedOffer.finalPrice || 0)}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{selectedOffer.totalRedemptions || 0}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">Used</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">₹{((selectedOffer.revenue || 0) / 1000).toFixed(1)}k</p>
                                        <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">+{selectedOffer.newCustomers || 0}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">New</p>
                                    </div>
                                </div>

                                {/* Validity */}
                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-6">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Valid Until</p>
                                        <p className="font-semibold text-gray-900">{selectedOffer.validUntil ? new Date(selectedOffer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No expiry'}</p>
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</p>
                                    <ul className="space-y-2">
                                        {(selectedOffer.terms ? (typeof selectedOffer.terms === 'string' ? [selectedOffer.terms] : Array.isArray(selectedOffer.terms) ? selectedOffer.terms : []) : ['Standard terms apply']).map((term: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Check className="h-3 w-3 text-primary" />
                                                </div>
                                                {term}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action Restriction Notice */}
                                {!canTakeAction(selectedOffer) && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                                        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-amber-800 text-sm">Action Restricted</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                You can modify this offer after midnight ({getTimeUntilAllowed(selectedOffer)} remaining)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Offer Notice */}
                                {selectedOffer.createdByType === 'admin' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-blue-800 text-sm">Admin-Created Offer</p>
                                            <p className="text-xs text-blue-700 mt-1">
                                                This offer was created by Backbenchers admin. Only admin can pause, resume, or delete this offer.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons - Only show for merchant-created offers */}
                                {selectedOffer.createdByType !== 'admin' && (
                                    <div className="space-y-3">
                                        {selectedOffer.isActive ? (
                                            <Button
                                                onClick={() => canTakeAction(selectedOffer) ? setConfirmAction("pause") : null}
                                                disabled={!canTakeAction(selectedOffer)}
                                                className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl disabled:opacity-50"
                                                variant="ghost"
                                            >
                                                <Pause className="h-5 w-5 mr-2" /> Pause Offer
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => canTakeAction(selectedOffer) ? setConfirmAction("resume") : null}
                                                disabled={!canTakeAction(selectedOffer)}
                                                className="w-full h-14 bg-primary text-white font-semibold rounded-2xl disabled:opacity-50"
                                            >
                                                <Play className="h-5 w-5 mr-2" /> Resume Offer
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => canTakeAction(selectedOffer) ? setConfirmAction("delete") : null}
                                            disabled={!canTakeAction(selectedOffer)}
                                            variant="outline"
                                            className="w-full h-14 border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-2xl disabled:opacity-50"
                                        >
                                            <Trash2 className="h-5 w-5 mr-2" /> Delete Offer
                                        </Button>
                                    </div>
                                )}

                                {/* Terms Link */}
                                <button onClick={() => setShowTerms(true)} className="flex items-center gap-2 text-gray-400 text-xs mt-4 mx-auto">
                                    <Shield className="h-3 w-3" />
                                    View Platform Terms & Conditions
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmAction && selectedOffer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 w-full shadow-2xl"
                        >
                            <div className={`h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${confirmAction === "delete" ? "bg-red-100" : confirmAction === "pause" ? "bg-amber-100" : "bg-emerald-100"
                                }`}>
                                {confirmAction === "delete" ? (
                                    <Trash2 className="h-8 w-8 text-red-500" />
                                ) : confirmAction === "pause" ? (
                                    <Pause className="h-8 w-8 text-amber-500" />
                                ) : (
                                    <Play className="h-8 w-8 text-emerald-500" />
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                                {confirmAction === "delete" ? "Delete Offer?" : confirmAction === "pause" ? "Pause Offer?" : "Resume Offer?"}
                            </h3>

                            <p className="text-gray-500 text-sm text-center mb-4">
                                {confirmAction === "delete"
                                    ? `Are you sure you want to delete "${selectedOffer.title}"? This cannot be undone.`
                                    : confirmAction === "pause"
                                        ? `Students will not see this offer until you resume it.`
                                        : `This offer will be visible to students again.`
                                }
                            </p>

                            {/* Warning Box */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700">
                                        <strong>Important:</strong> You cannot modify this offer again until midnight.
                                    </p>
                                </div>
                            </div>

                            {/* T&C Link */}
                            <button onClick={() => { setConfirmAction(null); setShowTerms(true); }} className="flex items-center gap-1 text-primary text-xs font-medium mx-auto mb-4">
                                <FileText className="h-3 w-3" />
                                Read Terms & Conditions
                            </button>

                            <div className="flex gap-3">
                                <Button onClick={() => setConfirmAction(null)} variant="outline" className="flex-1 h-12 rounded-xl font-medium">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleAction(confirmAction)}
                                    className={`flex-1 h-12 rounded-xl font-semibold ${confirmAction === "delete" ? "bg-red-500 hover:bg-red-600"
                                        : confirmAction === "pause" ? "bg-amber-500 hover:bg-amber-600"
                                            : "bg-emerald-500 hover:bg-emerald-600"
                                        } text-white`}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Terms & Conditions Modal */}
            <AnimatePresence>
                {showTerms && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowTerms(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-6 w-full max-h-[80%] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900">Terms & Conditions</h3>
                                </div>
                                <button onClick={() => setShowTerms(false)}>
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4 text-sm text-gray-600">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">1. Offer Modification Rules</h4>
                                    <ul className="space-y-1 list-disc list-inside text-xs">
                                        <li>Once an offer is created, paused, resumed, or deleted, you <strong>cannot modify it again until midnight (12:00 AM)</strong>.</li>
                                        <li>This ensures students who saw your offer can avail it.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">2. Paused Offers</h4>
                                    <ul className="space-y-1 list-disc list-inside text-xs">
                                        <li>Paused offers are <strong>not visible to students</strong>.</li>
                                        <li>Resume after midnight reset.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">3. Deleted Offers</h4>
                                    <ul className="space-y-1 list-disc list-inside text-xs">
                                        <li>Deleted offers <strong>cannot be recovered</strong>.</li>
                                        <li>All stats will be lost.</li>
                                    </ul>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Legal Notice
                                    </h4>
                                    <ul className="space-y-1 list-disc list-inside text-xs text-red-700">
                                        <li>Violations may result in <strong>account suspension</strong>.</li>
                                        <li>Misleading students may lead to <strong>legal consequences</strong>.</li>
                                        <li>You agree to honor all active offers.</li>
                                    </ul>
                                </div>
                            </div>

                            <Button onClick={() => setShowTerms(false)} className="w-full h-12 bg-gray-900 text-white font-semibold rounded-xl mt-6">
                                I Understand
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Check component for terms
function Check({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
