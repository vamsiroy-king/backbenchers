"use client";

import { ArrowLeft, MapPin, Globe, Heart, ChevronRight, Share2, Tag, X, Clock, Gift, Copy, Check, ExternalLink, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { onlineBrandService } from "@/lib/services/online-brand.service";
import { OnlineBrand, OnlineOffer } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import { toast } from "sonner";

// Tab options - Same as offline store page
const TABS = [
    { id: 'offers', label: 'Offers' },
    { id: 'about', label: 'About' },
];

// Reveal persistence in localStorage
const REVEALED_KEY = 'bb_revealed_offers';

function getRevealedOffers(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(REVEALED_KEY) || '[]');
    } catch {
        return [];
    }
}

function markOfferRevealed(offerId: string) {
    const revealed = getRevealedOffers();
    if (!revealed.includes(offerId)) {
        revealed.push(offerId);
        localStorage.setItem(REVEALED_KEY, JSON.stringify(revealed));
    }
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function OnlineBrandPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;

    const [brand, setBrand] = useState<OnlineBrand | null>(null);
    const [offers, setOffers] = useState<OnlineOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('offers');
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
    const [revealedOffers, setRevealedOffers] = useState<string[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        setRevealedOffers(getRevealedOffers());
        loadData();
    }, [brandId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const brandData = await onlineBrandService.getBrandById(brandId);
            setBrand(brandData);
            const offersData = await onlineBrandService.getOffersByBrandId(brandId);
            setOffers(offersData);
        } catch (error) {
            console.error("Failed to load brand data:", error);
            toast.error("Failed to load brand details");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        vibrate('light');
        if (navigator.share) {
            await navigator.share({
                title: brand?.name,
                text: `Check out ${brand?.name} student deals on BackBenchers!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
        }
    };

    const handleSave = () => {
        vibrate(isFavorite ? 'light' : 'success');
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
    };

    // Smart redirect: Try app first if preferApp is true
    // If app not installed, redirect to Play Store (Android) or App Store (iOS)
    // NO fallback to website when preferApp is enabled
    const handleVisitWebsite = () => {
        vibrate('light');

        // If preferApp is enabled, use app-first strategy
        if (brand?.preferApp && brand?.appUrl) {
            // Detect device type
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);

            // Try to open app deep link
            window.location.href = brand.appUrl;

            // After a delay, redirect to appropriate app store if app didn't open
            setTimeout(() => {
                if (isIOS && brand.appstoreUrl) {
                    window.location.href = brand.appstoreUrl;
                } else if (isAndroid && brand.playstoreUrl) {
                    window.location.href = brand.playstoreUrl;
                } else if (brand.playstoreUrl || brand.appstoreUrl) {
                    // Fallback to any available store URL
                    window.location.href = brand.playstoreUrl || brand.appstoreUrl || '';
                }
                // NO website fallback when preferApp is enabled
            }, 1000);
        } else if (brand?.websiteUrl) {
            // Default: open website (when preferApp is disabled)
            window.open(brand.websiteUrl, '_blank');
        }
    };

    const handleRevealCode = (offer: OnlineOffer) => {
        vibrate('medium');
        markOfferRevealed(offer.id);
        setRevealedOffers(prev => [...prev, offer.id]);

        // Auto-copy
        if (offer.code) {
            navigator.clipboard.writeText(offer.code).then(() => {
                setCopiedCode(offer.code!);
                toast.success("Code copied!", {
                    icon: "✓",
                    description: "Ready to paste at checkout"
                });
                setTimeout(() => setCopiedCode(null), 3000);
            }).catch(() => { });
        }
    };

    const handleCopyCode = (code: string) => {
        vibrate('light');
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            toast.success("Copied!");
            setTimeout(() => setCopiedCode(null), 2500);
        }).catch(() => {
            toast.error("Failed to copy");
        });
    };

    // Loading State - Same as offline store
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black flex items-center justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                            <span className="text-black font-bold text-xl">B</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black flex flex-col items-center justify-center p-6">
                    <p className="text-lg font-semibold mb-3 text-white">Brand not found</p>
                    <Link href="/dashboard" className="text-green-400 text-sm font-medium">Go back</Link>
                </div>
            </div>
        );
    }

    const activeOffers = offers.filter(o => o.isActive !== false);
    const heroImage = brand.coverImageUrl || null;

    return (
        <>
            {/* Mobile Container - Same as Offline Store */}
            <div className="min-h-screen bg-black flex justify-center">
                <div className="w-full max-w-[430px] min-h-screen bg-black">

                    {/* Large Hero Image - 320px like Offline Store */}
                    <div className="relative h-[320px]">
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt={brand.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center">
                                <div className="text-center">
                                    <div className="h-20 w-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-black font-bold text-3xl">{brand.name[0]}</span>
                                    </div>
                                    <p className="text-[#444] text-sm">No cover image</p>
                                </div>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* Top Buttons - Same as Offline */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.back()}
                                className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
                            >
                                <ArrowLeft className="h-5 w-5 text-white" />
                            </motion.button>
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} className="h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Share2 className="h-5 w-5 text-white" />
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Scrolling Ticker - Green BackBenchers Theme - Same as Offline */}
                    {activeOffers.length > 0 && (
                        <div className="bg-gradient-to-r from-green-600 to-green-500 py-2.5 overflow-hidden">
                            <motion.div
                                className="flex whitespace-nowrap"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                                {[0, 1].map((i) => (
                                    <div key={i} className="flex items-center gap-6 px-4 text-white text-xs font-medium">
                                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/60" />Student Exclusive</span>
                                        <span className="font-bold">{activeOffers.length} Active Deals</span>
                                        <span>+ Instant Activation</span>
                                        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white/60" />Verified Brand</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {/* Brand Info Section - Adidas Style - LEFT ALIGNED like Offline */}
                    <div className="px-4 pt-4 pb-4 border-b border-[#222]">
                        <div className="flex items-start gap-3 mb-4">
                            {/* Square Logo - LEFT aligned */}
                            <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#333]">
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="text-black font-bold text-2xl">{brand.name[0]}</span>
                                )}
                            </div>

                            {/* Brand Info - LEFT aligned */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg font-bold text-white">{brand.name}</h1>
                                <p className="text-xs text-[#888] mb-0.5">{brand.category}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-400 font-medium">Online Brand</span>
                                    <span className="text-[#555]">• {activeOffers.length} offers</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Same layout as Offline (3 buttons) */}
                        <div className="flex gap-3">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium"
                            >
                                <Share2 className="h-3.5 w-3.5" />
                                Share
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleVisitWebsite}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 rounded-xl text-black text-xs font-semibold"
                            >
                                <Globe className="h-3.5 w-3.5" />
                                {brand.preferApp && brand.appUrl ? 'Open App' : 'Website'}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] rounded-xl border border-[#333] text-white text-xs font-medium"
                            >
                                <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                Save
                            </motion.button>
                        </div>
                    </div>

                    {/* Tabs - Centered like Offline Store */}
                    <div className="border-b border-[#222] px-4">
                        <div className="flex gap-6 justify-center">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); vibrate('light'); }}
                                    className={`py-3 text-sm font-medium relative ${activeTab === tab.id ? 'text-white' : 'text-[#666]'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="px-4 py-4 pb-24">
                        {activeTab === 'offers' && (
                            <div className="space-y-3">
                                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Use codes at checkout on brand website</p>

                                {activeOffers.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Tag className="h-8 w-8 text-[#333] mx-auto mb-2" />
                                        <p className="text-[#555] text-xs">No active offers</p>
                                    </div>
                                ) : (
                                    activeOffers.map(offer => {
                                        const isRevealed = revealedOffers.includes(offer.id);
                                        const isExpanded = expandedOfferId === offer.id;
                                        const daysUntilExpiry = offer.expiryDate ? getDaysUntilExpiry(offer.expiryDate) : null;
                                        const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                                        const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

                                        return (
                                            <motion.div
                                                key={offer.id}
                                                className="relative bg-[#111] rounded-xl p-4 border border-[#222] overflow-hidden"
                                            >
                                                {/* REVEALED Corner Ribbon - Clean diagonal design */}
                                                {isRevealed && (
                                                    <div className="absolute top-0 right-0 overflow-hidden h-24 w-24 pointer-events-none">
                                                        <div className="absolute top-[18px] right-[-28px] bg-green-500 text-black text-[9px] font-bold px-8 py-1 rotate-45 tracking-wide">
                                                            REVEALED
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Header - Clickable to expand/collapse */}
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer"
                                                    onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                                                >
                                                    {/* Gift Badge */}
                                                    <div className="h-12 w-12 rounded-xl bg-green-500 flex flex-col items-center justify-center flex-shrink-0">
                                                        <Gift className="h-5 w-5 text-black" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-semibold text-sm">{offer.title}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[#666] text-xs truncate">
                                                                {offer.description || `${brand.name} exclusive deal`}
                                                            </p>
                                                            {/* Urgency Badge in header */}
                                                            {isUrgent && !isExpired && (
                                                                <span className="flex-shrink-0 text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                                                    <Zap className="h-2.5 w-2.5" />
                                                                    {daysUntilExpiry}d left
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                                        <ChevronRight className="h-5 w-5 text-[#444]" />
                                                    </motion.div>
                                                </div>

                                                {/* Expanded Details - Content area (clicks don't collapse card) */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="pt-4 mt-4 border-t border-[#222] space-y-4">
                                                                {/* Coupon Code Section */}
                                                                {offer.code && (
                                                                    <div>
                                                                        <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Coupon Code</p>

                                                                        {isRevealed ? (
                                                                            /* REVEALED - Clean display */
                                                                            <div
                                                                                className="flex items-center gap-3"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 flex items-center justify-center">
                                                                                    <span className="text-lg font-mono font-bold text-white tracking-[0.15em]">
                                                                                        {offer.code}
                                                                                    </span>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        e.preventDefault();
                                                                                        handleCopyCode(offer.code!);
                                                                                    }}
                                                                                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${copiedCode === offer.code
                                                                                        ? 'bg-green-500 text-black'
                                                                                        : 'bg-green-500 text-black'
                                                                                        }`}
                                                                                >
                                                                                    {copiedCode === offer.code ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            /* NOT REVEALED - Show reveal button */
                                                                            <motion.button
                                                                                whileTap={{ scale: 0.98 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleRevealCode(offer);
                                                                                }}
                                                                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                                                                            >
                                                                                <Gift className="h-4 w-4" />
                                                                                Reveal Code & Activate
                                                                            </motion.button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Go to Website/App Button - Clean */}
                                                                {isRevealed && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            vibrate('light');

                                                                            // Smart redirect: app first if preferApp enabled
                                                                            if (brand.preferApp && brand.appUrl) {
                                                                                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                                                                                const isAndroid = /Android/.test(navigator.userAgent);

                                                                                // Try app deep link first
                                                                                window.location.href = brand.appUrl;

                                                                                // After delay, redirect to appropriate store
                                                                                setTimeout(() => {
                                                                                    if (isIOS && brand.appstoreUrl) {
                                                                                        window.location.href = brand.appstoreUrl;
                                                                                    } else if (isAndroid && brand.playstoreUrl) {
                                                                                        window.location.href = brand.playstoreUrl;
                                                                                    } else if (brand.playstoreUrl || brand.appstoreUrl) {
                                                                                        window.location.href = brand.playstoreUrl || brand.appstoreUrl || '';
                                                                                    }
                                                                                    // NO website fallback when preferApp enabled
                                                                                }, 1000);
                                                                            } else {
                                                                                // Website mode - use offer.link or brand website
                                                                                window.open(offer.link || brand.websiteUrl, '_blank');
                                                                            }
                                                                        }}
                                                                        className="w-full py-3 bg-green-500 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                                                                    >
                                                                        {brand.preferApp && brand.appUrl ? (
                                                                            <>
                                                                                Open {brand.name} App
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Go to {brand.name}
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {/* Terms */}
                                                                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                                                                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">How to use</p>
                                                                    <ul className="space-y-1">
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                            <span className="text-green-500 mt-0.5">1.</span>
                                                                            <span>Copy the coupon code above</span>
                                                                        </li>
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                            <span className="text-green-500 mt-0.5">2.</span>
                                                                            <span>Visit {brand.name} website</span>
                                                                        </li>
                                                                        <li className="text-[#666] text-[11px] flex items-start gap-1.5">
                                                                            <span className="text-green-500 mt-0.5">3.</span>
                                                                            <span>Paste code at checkout</span>
                                                                        </li>
                                                                    </ul>
                                                                </div>

                                                                {/* Tags */}
                                                                <div className="flex gap-2 flex-wrap">
                                                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-medium">
                                                                        Student Exclusive
                                                                    </span>
                                                                    {offer.expiryDate && daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                                                                        <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ${isUrgent
                                                                            ? 'bg-amber-500/20 text-amber-400'
                                                                            : 'bg-[#1a1a1a] text-[#888]'
                                                                            }`}>
                                                                            {isUrgent ? <Zap className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                                                            {isUrgent
                                                                                ? `Expiring in ${daysUntilExpiry} days!`
                                                                                : `Valid until ${new Date(offer.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-3">
                                {brand.description && (
                                    <p className="text-[#888] text-sm leading-relaxed">{brand.description}</p>
                                )}

                                {!brand.description && (
                                    <p className="text-[#888] text-sm leading-relaxed">
                                        {brand.name} offers exclusive student discounts for verified college students. Use the coupon codes above to unlock special savings on your favorite products and services.
                                    </p>
                                )}

                                {brand.websiteUrl && (
                                    <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                                        <div className="flex items-start gap-3">
                                            <Globe className="h-5 w-5 text-[#666] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-white text-sm font-medium">Website</p>
                                                <a
                                                    href={brand.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-400 text-xs hover:underline"
                                                >
                                                    {brand.websiteUrl.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                                    <div className="flex items-center gap-3">
                                        <Tag className="h-5 w-5 text-green-400" />
                                        <div>
                                            <p className="text-white text-sm font-medium">{brand.category}</p>
                                            <p className="text-[#666] text-xs">{activeOffers.length} active offers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
