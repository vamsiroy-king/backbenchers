"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix Leaflet default marker icon issue in Next.js
const createCustomIcon = (color: string = "#22c55e") => {
    return L.divIcon({
        className: "custom-marker",
        html: `
            <div style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${color};
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="color: white; font-weight: bold; font-size: 12px;">B</span>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

// User location blue pulse marker
const userLocationIcon = L.divIcon({
    className: "user-marker",
    html: `
        <div style="position: relative; width: 44px; height: 44px;">
            <div style="
                position: absolute;
                inset: 0;
                background: rgba(59, 130, 246, 0.3);
                border-radius: 50%;
                animation: pulse 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

// Category color mapping
const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
        "Food": "#f97316",
        "Food & Beverages": "#f97316",
        "Restaurant": "#f97316",
        "Fashion": "#ec4899",
        "Fashion & Lifestyle": "#ec4899",
        "Tech": "#3b82f6",
        "Tech & Electronics": "#3b82f6",
        "Electronics": "#3b82f6",
        "Beauty": "#a855f7",
        "Beauty & Wellness": "#a855f7",
        "Fitness": "#10b981",
        "Health & Fitness": "#10b981",
        "Sports": "#22c55e",
    };
    return colors[category] || "#22c55e";
};

interface MerchantMarker {
    id: string;
    businessName: string;
    category: string;
    logo?: string;
    latitude: number;
    longitude: number;
    discount?: string;
}

interface LeafletMapProps {
    userLocation: [number, number] | null;
    merchants: MerchantMarker[];
    onMerchantClick: (merchant: MerchantMarker) => void;
    center?: [number, number];
    zoom?: number;
}

// Component to handle map view changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);

    return null;
}

export default function LeafletMap({
    userLocation,
    merchants,
    onMerchantClick,
    center = [12.9716, 77.5946], // Default: Bengaluru
    zoom = 14
}: LeafletMapProps) {
    const mapCenter = userLocation || center;

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
        >
            {/* OpenStreetMap Tiles - Free, No API Key */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Map Controller for dynamic centering */}
            <MapController center={mapCenter} zoom={zoom} />

            {/* User Location Marker */}
            {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon}>
                    <Popup className="leaflet-popup-custom">
                        <div className="text-center">
                            <span className="font-bold text-blue-600">You are here</span>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Merchant Markers */}
            {merchants.map((merchant) => (
                <Marker
                    key={merchant.id}
                    position={[merchant.latitude, merchant.longitude]}
                    icon={createCustomIcon(getCategoryColor(merchant.category))}
                    eventHandlers={{
                        click: () => onMerchantClick(merchant),
                    }}
                >
                    <Popup>
                        <div className="min-w-[150px]">
                            <p className="font-bold text-gray-900">{merchant.businessName}</p>
                            <p className="text-xs text-gray-500">{merchant.category}</p>
                            {merchant.discount && (
                                <p className="text-sm font-semibold text-green-600 mt-1">{merchant.discount}</p>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
