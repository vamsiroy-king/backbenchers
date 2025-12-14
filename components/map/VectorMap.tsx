"use client";

import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer, useMap } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState, useMemo, useEffect } from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface Offer {
    id: string | number;
    name: string;
    lat: number;
    lng: number;
    discount: string;
    type: string;
    distance?: string;
    logo?: string;
    category?: string;
}

interface VectorMapProps {
    userLocation: [number, number] | null;
    offers: Offer[];
    onOfferClick: (offer: Offer) => void;
    selectedCategory: string;
    viewState: { latitude: number; longitude: number; zoom: number };
    onMove: (evt: any) => void;
}

export default function VectorMap({ userLocation, offers, onOfferClick, selectedCategory, viewState, onMove }: VectorMapProps) {

    // Filter offers
    const visibleOffers = useMemo(() => {
        return selectedCategory === "All"
            ? offers
            : offers.filter(o => o.type === selectedCategory);
    }, [offers, selectedCategory]);

    return (
        <Map
            {...viewState}
            onMove={onMove}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            attributionControl={false}
        >
            {/* User Location Pulse */}
            {userLocation && (
                <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
                    <div className="relative flex items-center justify-center h-12 w-12">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
                        <div className="h-4 w-4 bg-[#0A84FF] rounded-full border-2 border-white shadow-lg z-10" />
                    </div>
                </Marker>
            )}

            {/* Offer Markers */}
            {visibleOffers.map((offer) => (
                <Marker
                    key={offer.id}
                    longitude={offer.lng}
                    latitude={offer.lat}
                    anchor="bottom"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        onOfferClick(offer);
                    }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className={`cursor-pointer flex flex-col items-center group`}
                    >
                        <div className={`h-8 w-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center
                ${offer.type === 'Food' ? 'bg-orange-500' :
                                offer.type === 'Tech' ? 'bg-blue-500' :
                                    offer.type === 'Fashion' ? 'bg-purple-500' : 'bg-yellow-500'
                            }`}
                        >
                            <span className="text-[10px] font-bold text-white">B</span>
                        </div>
                        {/* Tooltip on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded mt-1 whitespace-nowrap backdrop-blur-md">
                            {offer.discount}
                        </div>
                    </motion.div>
                </Marker>
            ))}

            <NavigationControl position="bottom-left" showCompass={false} />
        </Map>
    );
}
