"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

// Category configuration with colors and emojis
const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
    // Food & Beverages
    "Food": { color: "#EF4444", emoji: "🍕" },
    "Food & Beverages": { color: "#EF4444", emoji: "🍕" },
    "Restaurant": { color: "#EF4444", emoji: "🍽️" },
    "Coffee": { color: "#92400E", emoji: "☕" },
    "Grocery": { color: "#16A34A", emoji: "🛒" },

    // Fashion
    "Fashion": { color: "#8B5CF6", emoji: "👕" },
    "Fashion & Lifestyle": { color: "#8B5CF6", emoji: "👗" },

    // Tech & Electronics
    "Tech": { color: "#3B82F6", emoji: "📱" },
    "Tech & Electronics": { color: "#3B82F6", emoji: "💻" },
    "Electronics": { color: "#3B82F6", emoji: "🔌" },

    // Beauty & Wellness
    "Beauty": { color: "#EC4899", emoji: "💄" },
    "Beauty & Wellness": { color: "#EC4899", emoji: "💅" },

    // Fitness & Sports
    "Fitness": { color: "#22C55E", emoji: "💪" },
    "Health & Fitness": { color: "#22C55E", emoji: "🏃" },
    "Sports": { color: "#14B8A6", emoji: "🏏" },

    // Entertainment
    "Entertainment": { color: "#F97316", emoji: "🎬" },

    // Services
    "Services": { color: "#6366F1", emoji: "✂️" },

    // Default
    "Other": { color: "#6B7280", emoji: "🏪" },
};

// Get category config (with fallback)
const getCategoryConfig = (category: string) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Other"];
};

// Create custom marker with category color and emoji
const createCustomIcon = (category: string, isSelected: boolean = false) => {
    const config = getCategoryConfig(category);
    const size = isSelected ? 48 : 40;
    const emojiSize = isSelected ? 20 : 16;

    return L.divIcon({
        className: "custom-marker",
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${config.color};
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s ease;
                ${isSelected ? 'transform: scale(1.2);' : ''}
            ">
                <span style="font-size: ${emojiSize}px; line-height: 1;">${config.emoji}</span>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

// User location blue pulse marker
const userLocationIcon = L.divIcon({
    className: "user-marker",
    html: `
        <div style="position: relative; width: 48px; height: 48px;">
            <div style="
                position: absolute;
                inset: 0;
                background: rgba(59, 130, 246, 0.25);
                border-radius: 50%;
                animation: userPulse 2s ease-in-out infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 18px;
                height: 18px;
                background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
            "></div>
        </div>
        <style>
            @keyframes userPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.6); opacity: 0.3; }
            }
        </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
});

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
    selectedCategory?: string;
    fitBounds?: [[number, number], [number, number]] | null;
    shouldFitBounds?: boolean;
    onBoundsApplied?: () => void;
}

// Component to handle initial map centering (only once, not continuous)
function MapInitializer({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    const initialized = useRef(false);

    useEffect(() => {
        // Only center once on initial load - NOT on every re-render
        if (!initialized.current && center) {
            map.setView(center, zoom);
            initialized.current = true;
        }
    }, [center, zoom, map]);

    return null;
}

// Component to zoom map to fit all merchants in a category
function BoundsUpdater({
    bounds,
    enabled,
    onBoundsApplied
}: {
    bounds: [[number, number], [number, number]] | null;
    enabled: boolean;
    onBoundsApplied?: () => void;
}) {
    const map = useMap();
    const lastBoundsRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled || !bounds) return;

        // Create a string key to detect actual changes
        const boundsKey = JSON.stringify(bounds);
        if (boundsKey === lastBoundsRef.current) return;

        lastBoundsRef.current = boundsKey;

        // Create Leaflet bounds and fit map to them with smooth animation
        const leafletBounds = L.latLngBounds(
            L.latLng(bounds[0][0], bounds[0][1]),
            L.latLng(bounds[1][0], bounds[1][1])
        );

        // Zoom with padding for better visual
        map.flyToBounds(leafletBounds, {
            padding: [50, 50],
            maxZoom: 13, // Lower max zoom to keep "City View" feel
            duration: 0.8
        });

        onBoundsApplied?.();
    }, [bounds, enabled, map, onBoundsApplied]);

    return null;
}

export default function LeafletMap({
    userLocation,
    merchants,
    onMerchantClick,
    center = [12.9716, 77.5946], // Default: Bengaluru
    zoom = 14,
    selectedCategory = "All",
    fitBounds = null,
    shouldFitBounds = false,
    onBoundsApplied
}: LeafletMapProps) {
    const mapCenter = userLocation || center;

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
            // Enable all interactions - NO restrictions
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            dragging={true}
            keyboard={true}
        >
            {/* Premium Dark Matter Tiles - Ultra-modern dark theme */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Map Initializer - centers only once, allows free scrolling after */}
            <MapInitializer center={mapCenter} zoom={zoom} />

            {/* Bounds Updater - zooms to fit all stores in category */}
            <BoundsUpdater
                bounds={fitBounds}
                enabled={shouldFitBounds}
                onBoundsApplied={onBoundsApplied}
            />

            {/* User Location Marker */}
            {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon}>
                    <Popup className="leaflet-popup-custom">
                        <div className="text-center py-1">
                            <span className="font-bold text-blue-600">📍 You are here</span>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Merchant Markers with category colors */}
            {merchants.map((merchant) => {
                const isHighlighted = selectedCategory !== "All" &&
                    merchant.category.toLowerCase().includes(selectedCategory.toLowerCase());

                return (
                    <Marker
                        key={merchant.id}
                        position={[merchant.latitude, merchant.longitude]}
                        icon={createCustomIcon(merchant.category, isHighlighted)}
                        eventHandlers={{
                            click: () => onMerchantClick(merchant),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[160px] p-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{getCategoryConfig(merchant.category).emoji}</span>
                                    <p className="font-bold text-gray-900 text-sm">{merchant.businessName}</p>
                                </div>
                                <p className="text-xs text-gray-500">{merchant.category}</p>
                                {merchant.discount && (
                                    <p className="text-sm font-bold text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded inline-block">
                                        {merchant.discount}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
