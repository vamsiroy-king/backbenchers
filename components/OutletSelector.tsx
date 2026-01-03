"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Clock, Navigation, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Outlet } from "@/lib/types";

interface OutletSelectorProps {
    outlets: Outlet[];
    selectedOutlet: Outlet | null;
    onSelectOutlet: (outlet: Outlet) => void;
}

export default function OutletSelector({ outlets, selectedOutlet, onSelectOutlet }: OutletSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!outlets || outlets.length === 0) return null;

    // If only one outlet, don't show selector
    if (outlets.length === 1) {
        const outlet = outlets[0];
        return (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{outlet.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{outlet.address}, {outlet.city}</p>
                        {outlet.phone && (
                            <a href={`tel:${outlet.phone}`} className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {outlet.phone}
                            </a>
                        )}
                    </div>
                    {outlet.latitude && outlet.longitude && (
                        <button
                            onClick={() => {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`, '_blank');
                            }}
                            className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center"
                        >
                            <Navigation className="h-4 w-4 text-primary" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-gray-400">
                            {outlets.length} outlets available
                        </p>
                        <p className="font-medium text-white text-sm">
                            {selectedOutlet ? selectedOutlet.name : 'Select an outlet'}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {/* Expanded list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-700/50 max-h-64 overflow-y-auto">
                            {outlets.map((outlet) => (
                                <button
                                    key={outlet.id}
                                    onClick={() => {
                                        onSelectOutlet(outlet);
                                        setIsExpanded(false);
                                    }}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-700/30 transition-colors ${selectedOutlet?.id === outlet.id ? 'bg-primary/10' : ''
                                        }`}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedOutlet?.id === outlet.id ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={`font-medium text-sm ${selectedOutlet?.id === outlet.id ? 'text-primary' : 'text-white'
                                            }`}>
                                            {outlet.name}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{outlet.address}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {outlet.phone && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {outlet.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {outlet.latitude && outlet.longitude && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`, '_blank');
                                            }}
                                            className="h-8 w-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0"
                                        >
                                            <ExternalLink className="h-3 w-3 text-gray-400" />
                                        </button>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
