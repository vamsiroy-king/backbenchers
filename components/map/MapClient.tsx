"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useEffect, useState } from "react";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 15, { animate: true, duration: 2.5 });
    }, [center, map]);
    return null;
}

const createCustomIcon = (type: string, isSelected: boolean) => {
    // Ultra-minimal dot indicators
    const colorMap: Record<string, string> = {
        "Food": "#FF9500", // Apple Orange
        "Tech": "#0A84FF", // Apple Blue
        "Fashion": "#BF5AF2", // Apple Purple
        "Books": "#FFD60A" // Apple Yellow
    };
    const color = colorMap[type] || "#FFFFFF";
    const size = isSelected ? 24 : 16;
    const glow = isSelected ? `box-shadow: 0 0 20px ${color};` : "";

    return divIcon({
        className: "custom-icon",
        html: `<div style="width:${size}px; height:${size}px; background:${color}; border-radius:50%; border:3px solid #1c1c1e; ${glow} transition:all 0.3s ease;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

interface Offer {
    id: number;
    name: string;
    lat: number;
    lng: number;
    discount: string;
    type: string;
    distance?: string;
}

interface MapClientProps {
    userLocation: [number, number] | null;
    offers: Offer[];
    onOfferClick: (offer: Offer) => void;
    selectedCategory: string;
}

export default function MapClient({ userLocation, offers, onOfferClick, selectedCategory }: MapClientProps) {
    const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

    const center: [number, number] = userLocation || [12.9716, 77.5946];

    // Logic: Filters
    const visibleOffers = selectedCategory === "All"
        ? offers
        : offers.filter(o => o.type === selectedCategory);

    const handleMarkerClick = (offer: Offer) => {
        const dist = userLocation
            ? getDistance(userLocation[0], userLocation[1], offer.lat, offer.lng)
            : "N/A";

        const offerWithDist = { ...offer, distance: dist };
        setSelectedOfferId(offer.id);
        onOfferClick(offerWithDist);
    };

    return (
        <div className="h-full w-full z-0 bg-[#000]">
            <MapContainer center={center} zoom={15} scrollWheelZoom={true} className="h-full w-full" zoomControl={false}>
                {/* CartoDB Dark Matter: The closest free equivalent to a generic "Dark Mode Premium" map */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapController center={center} />

                {/* User Pulse - Radar Style */}
                {userLocation && (
                    <Marker position={userLocation} icon={divIcon({
                        className: "user-loc",
                        html: `
                   <div class="relative flex items-center justify-center h-12 w-12">
                      <div class="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
                      <div class="h-4 w-4 bg-[#0A84FF] rounded-full border-2 border-white shadow-lg z-10"></div>
                   </div>
                 `,
                        iconSize: [48, 48],
                        iconAnchor: [24, 24]
                    })}>
                    </Marker>
                )}

                {/* Dynamic Navigation Line */}
                {userLocation && visibleOffers.find(o => o.id === selectedOfferId) && (
                    <Polyline
                        positions={[
                            userLocation,
                            [visibleOffers.find(o => o.id === selectedOfferId)!.lat, visibleOffers.find(o => o.id === selectedOfferId)!.lng]
                        ]}
                        pathOptions={{
                            color: '#0A84FF',
                            weight: 2,
                            opacity: 0.8,
                            dashArray: '5, 10',
                        }}
                    />
                )}

                {visibleOffers.map(offer => (
                    <Marker
                        key={offer.id}
                        position={[offer.lat, offer.lng]}
                        icon={createCustomIcon(offer.type, selectedOfferId === offer.id)}
                        eventHandlers={{
                            click: () => handleMarkerClick(offer)
                        }}
                    />
                ))}
            </MapContainer>
        </div>
    );
}
