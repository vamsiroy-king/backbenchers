"use client";

import { AutoScrollingRow } from "@/components/ui/AutoScrollingRow";
import { Tag, Zap, Gift, Sparkles } from "lucide-react";

interface DiscountTickerProps {
    items?: TickerItem[];
    className?: string;
}

interface TickerItem {
    id: string;
    text: string;
    icon?: 'tag' | 'zap' | 'gift' | 'sparkles';
    highlight?: boolean;
}

// Default discount messages if none provided
const DEFAULT_ITEMS: TickerItem[] = [
    { id: '1', text: '50% OFF at Pizza Hut', icon: 'tag', highlight: true },
    { id: '2', text: 'Free Chai Fridays!', icon: 'gift' },
    { id: '3', text: 'FLAT ₹100 OFF on Fashion', icon: 'sparkles', highlight: true },
    { id: '4', text: 'Buy 1 Get 1 at Domino\'s', icon: 'zap' },
    { id: '5', text: '20% OFF on Groceries', icon: 'tag' },
    { id: '6', text: 'Student Special: Extra 10% OFF', icon: 'sparkles', highlight: true },
];

const IconMap = {
    tag: Tag,
    zap: Zap,
    gift: Gift,
    sparkles: Sparkles,
};

export function DiscountTicker({ items = DEFAULT_ITEMS, className = "" }: DiscountTickerProps) {
    // Duplicate items for seamless loop
    const displayItems = [...items, ...items, ...items];

    return (
        <div className={`bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 border-y border-green-500/20 py-2.5 ${className}`}>
            <AutoScrollingRow direction="left" speed={0.6}>
                {displayItems.map((item, index) => {
                    const Icon = IconMap[item.icon || 'tag'];
                    return (
                        <div
                            key={`${item.id}-${index}`}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all shrink-0 ${item.highlight
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-white/5 text-white/70 border border-white/10'
                                }`}
                        >
                            <Icon className="h-3 w-3" />
                            <span>{item.text}</span>
                        </div>
                    );
                })}
            </AutoScrollingRow>
        </div>
    );
}
