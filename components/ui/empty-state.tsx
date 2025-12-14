"use client";

import { motion } from "framer-motion";
import { Package, Users, Store, FileText, Search, MapPin, Heart } from "lucide-react";

interface EmptyStateProps {
    type: 'offers' | 'students' | 'merchants' | 'transactions' | 'search' | 'saved' | 'nearby';
    title?: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EMPTY_STATES = {
    offers: {
        icon: Package,
        title: "No Offers Yet",
        description: "Create your first offer to attract students!"
    },
    students: {
        icon: Users,
        title: "No Students Found",
        description: "No students match your search criteria."
    },
    merchants: {
        icon: Store,
        title: "No Merchants Found",
        description: "No merchants match your filters."
    },
    transactions: {
        icon: FileText,
        title: "No Transactions",
        description: "Transactions will appear here once students start redeeming offers."
    },
    search: {
        icon: Search,
        title: "No Results",
        description: "Try a different search term or adjust your filters."
    },
    saved: {
        icon: Heart,
        title: "No Saved Offers",
        description: "Offers you save will appear here for quick access."
    },
    nearby: {
        icon: MapPin,
        title: "No Nearby Offers",
        description: "Enable location to find offers near you."
    }
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
    const config = EMPTY_STATES[type];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <div className="h-20 w-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                <Icon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
                {title || config.title}
            </h3>
            <p className="text-sm text-gray-500 max-w-[250px]">
                {description || config.description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-2xl text-sm"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
}
