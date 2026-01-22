import { motion } from "framer-motion";
import { Heart, MapPin, ChevronRight, Star } from "lucide-react";
import { Offer } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import { useState } from "react";

interface OfferCardProps {
    offer: Offer & { avgRating?: number; totalRatings?: number };
    isFavorited?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    priority?: boolean;
    variant?: 'default' | 'horizontal' | 'featured';
}

export function OfferCard({
    offer,
    isFavorited = false,
    onToggleFavorite,
    onClick,
    priority = false,
    variant = 'default'
}: OfferCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const discountBadge = offer.type === 'percentage'
        ? `${offer.discountValue}% OFF`
        : `₹${offer.discountValue} OFF`;

    const handleTap = () => {
        vibrate('light');
        if (onClick) onClick({} as any);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        vibrate(isFavorited ? 'light' : 'success');
        if (onToggleFavorite) onToggleFavorite(e);
    };

    // Horizontal card - District style list item
    if (variant === 'horizontal') {
        return (
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={handleTap}
                className="flex gap-4 p-4 bg-[#1a1a1a] rounded-2xl cursor-pointer"
            >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                    {offer.merchantLogo ? (
                        <img src={offer.merchantLogo} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-bold">
                            {offer.merchantName?.[0] || 'B'}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold text-white text-[15px] truncate">{offer.merchantName}</h3>
                    <p className="text-[#888] text-[13px] truncate mt-0.5">{offer.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-green-400 font-bold text-sm">{discountBadge}</span>
                        {offer.merchantCity && (
                            <span className="text-[#555] text-xs">• {offer.merchantCity}</span>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-[#444]" />
                </div>
            </motion.div>
        );
    }

    // Featured - Large hero card with gradient overlay
    if (variant === 'featured') {
        return (
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={handleTap}
                className="relative rounded-3xl overflow-hidden cursor-pointer aspect-[16/9]"
            >
                {/* Background Image */}
                <div className="absolute inset-0 bg-[#1a1a1a]">
                    {offer.merchantLogo && (
                        <img src={offer.merchantLogo} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 bg-green-500 text-black px-3 py-1.5 rounded-xl font-bold text-sm">
                        {discountBadge}
                    </div>

                    {/* Heart - Consistent icon */}
                    {onToggleFavorite && (
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={handleSave}
                            className="absolute top-4 right-4 h-10 w-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
                        >
                            <Heart
                                className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`}
                            />
                        </motion.button>
                    )}

                    {/* Info */}
                    <div className="flex items-center gap-3">
                        {offer.merchantLogo && (
                            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur overflow-hidden border border-white/20">
                                <img src={offer.merchantLogo} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg truncate">{offer.merchantName}</h3>
                            <p className="text-white/60 text-sm truncate">{offer.title}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Default - Grid card (District style)
    return (
        <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={handleTap}
            className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-square bg-[#222] overflow-hidden">
                {/* Shimmer while loading */}
                {!imageLoaded && offer.merchantLogo && (
                    <motion.div
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-[#2a2a2a]"
                    />
                )}

                {offer.merchantLogo ? (
                    <img
                        src={offer.merchantLogo}
                        alt=""
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading={priority ? "eager" : "lazy"}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                        <div className="h-16 w-16 rounded-2xl bg-[#333] flex items-center justify-center">
                            <span className="text-white/30 font-bold text-2xl">{offer.merchantName?.[0] || 'B'}</span>
                        </div>
                    </div>
                )}

                {/* Discount Badge - Top Left */}
                <div className="absolute top-3 left-3">
                    <div className="bg-green-500 text-black px-2.5 py-1 rounded-lg font-bold text-xs shadow-lg">
                        {discountBadge}
                    </div>
                </div>

                {/* Heart - Top Right (Consistent icon) */}
                {onToggleFavorite && (
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={handleSave}
                        className="absolute top-3 right-3 h-8 w-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                        <Heart
                            className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white/80'}`}
                        />
                    </motion.button>
                )}


                {/* Rating - Bottom Right Overlay */}
                {(offer as any).avgRating > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span className="text-white text-[10px] font-bold">{(offer as any).avgRating?.toFixed(1)}</span>
                        <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
                        <span className="text-white/60 text-[9px]">({(offer as any).totalRatings})</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="font-semibold text-white text-[14px] truncate">
                    {offer.merchantName || 'Merchant'}
                </h3>
                <p className="text-[#666] text-[12px] truncate mt-0.5">
                    {offer.title}
                </p>
                {offer.merchantCity && (
                    <div className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3 text-[#555]" />
                        <span className="text-[#555] text-[11px]">{offer.merchantCity}</span>
                    </div>
                )}
            </div>
        </motion.div >
    );
}

