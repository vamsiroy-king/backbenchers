"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { offerService } from "@/lib/services/offer.service";
import { Offer } from "@/lib/types";
import { ArrowLeft, Calendar, HelpCircle, Info, Share2, Store, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { vibrate } from "@/lib/haptics";

export default function OfferDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        async function fetchOffer() {
            if (params.id) {
                try {
                    const res = await offerService.getById(params.id as string);
                    if (res.success && res.data) {
                        setOffer(res.data);
                    }
                } catch (e) {
                    console.error("Failed to load offer", e);
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchOffer();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-green-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="h-8 w-8 text-white/40" />
                </div>
                <h1 className="text-white font-semibold text-lg mb-2">Offer Not Found</h1>
                <p className="text-white/40 text-sm mb-6">This offer may have expired or been removed.</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-white text-black font-semibold rounded-xl active:scale-95 transition-transform"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const discountText = offer.type === 'percentage'
        ? `${offer.discountValue}% OFF`
        : offer.type === 'flat'
            ? `₹${offer.discountValue} OFF`
            : offer.type === 'bogo' ? 'Buy 1 Get 1' : 'Special Offer';

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="h-10 w-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all"
                >
                    <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <button
                    onClick={() => vibrate('light')}
                    className="h-10 w-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all"
                >
                    <Share2 className="h-5 w-5 text-white" />
                </button>
            </header>

            {/* Hero Section */}
            <div className="pt-24 px-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-6 overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 bg-green-500/20 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Merchant Logo */}
                        <div className="h-20 w-20 bg-white rounded-2xl p-2 mb-4 shadow-xl">
                            {offer.merchantLogo ? (
                                <img src={offer.merchantLogo} alt={offer.merchantName} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-2xl font-bold text-black">
                                    {offer.merchantName?.[0]}
                                </div>
                            )}
                        </div>

                        <h2 className="text-lg font-medium text-white/80 mb-1">{offer.merchantName}</h2>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
                            {discountText}
                        </h1>
                        <p className="text-white/60 text-sm max-w-[200px] leading-relaxed">
                            {offer.title}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Validity & Terms */}
            <div className="px-5 mt-6 space-y-4">
                {/* Validity Card */}
                <div className="bg-[#111] rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Timer className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-0.5">Valid Until</h4>
                        <p className="text-sm font-medium text-white">
                            {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : "Limited Time"}
                        </p>
                    </div>
                </div>

                {/* Terms Card */}
                <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4 text-white/40" />
                        <h3 className="text-sm font-semibold text-white">Terms & Conditions</h3>
                    </div>
                    <ul className="text-sm text-white/60 space-y-2 pl-4 list-disc marker:text-white/20">
                        {offer.terms ? (
                            // Split by newlines or list items if structured string
                            offer.terms.split('\n').map((term, i) => (
                                <li key={i}>{term}</li>
                            ))
                        ) : (
                            <>
                                <li>Valid for students with Backbenchers ID</li>
                                <li>Cannot be combined with other offers</li>
                                <li>One redemption per visit</li>
                            </>
                        )}
                        {offer.minPurchase ? (
                            <li>Minimum purchase of ₹{offer.minPurchase} required</li>
                        ) : null}
                    </ul>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent z-40">
                <button
                    onClick={() => {
                        vibrate('success');
                        // Navigate to redemption or show QR
                        // For now assuming redemption flow involves visiting store
                        alert("Show your Backbenchers ID at the counter to redeem!");
                    }}
                    className="w-full bg-white text-black h-14 rounded-2xl font-bold text-lg shadow-lg shadow-white/10 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-xs">🚀</div>
                    Redeem Offer
                </button>
            </div>
        </div>
    );
}
