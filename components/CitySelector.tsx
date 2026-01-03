"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, MapPin, Loader2, Navigation } from "lucide-react";
import { cityService, City } from "@/lib/services/city.service";
import { vibrate } from "@/lib/haptics";

// City icons for popular cities - line art style like District
const CITY_ICONS: Record<string, string> = {
    'Mumbai': '🏛️',
    'Delhi-NCR': '🕌',
    'Delhi NCR': '🕌',
    'Bengaluru': '🏙️',
    'Hyderabad': '🏰',
    'Chennai': '⛪',
    'Pune': '🏔️',
    'Kolkata': '🌉',
    'Chandigarh': '🏛️',
};

interface CitySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCity: (city: string) => void;
    currentCity?: string | null;
}

export function CitySelector({ isOpen, onClose, onSelectCity, currentCity }: CitySelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [popularCities, setPopularCities] = useState<City[]>([]);
    const [searchResults, setSearchResults] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPopularCities();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchCities();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const fetchPopularCities = async () => {
        setLoading(true);
        try {
            const result = await cityService.getPopular();
            if (result.success && result.data) {
                setPopularCities(result.data);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchCities = async () => {
        setSearching(true);
        try {
            const result = await cityService.search(searchQuery);
            if (result.success && result.data) {
                setSearchResults(result.data);
            }
        } catch (error) {
            console.error('Error searching cities:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAutoDetect = async () => {
        setDetectingLocation(true);
        vibrate('light');
        try {
            const { locationService } = await import('@/lib/services/location.service');
            const result = await locationService.detectUserCity();

            if (result.success && result.city) {
                setDetectedAddress(result.fullAddress || result.city);
                handleSelectCity(result.city);
            } else if (result.fullAddress) {
                setDetectedAddress(result.fullAddress);
                const addressLower = result.fullAddress.toLowerCase();
                const matchedCity = popularCities.find(c =>
                    addressLower.includes(c.name.toLowerCase())
                );
                if (matchedCity) {
                    handleSelectCity(matchedCity.name);
                }
            }
        } catch (error) {
            console.error('Auto detect error:', error);
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleSelectCity = (cityName: string) => {
        vibrate('light');
        cityService.setSelectedCity(cityName);
        onSelectCity(cityName);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black"
            >
                {/* Header */}
                <div className="sticky top-0 bg-black px-4 py-4 border-b border-[#222]">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => { vibrate('light'); onClose(); }} className="p-2 -ml-2">
                            <ChevronDown className="h-6 w-6 text-white" />
                        </button>
                        <h2 className="text-base font-semibold text-white">Location</h2>
                        <div className="w-10" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                        <input
                            type="text"
                            placeholder="Search city, area or locality"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 bg-[#111] rounded-xl text-sm text-white placeholder:text-[#555] outline-none border border-[#222] focus:border-[#333]"
                        />
                    </div>

                    {/* Use Current Location - District Style */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAutoDetect}
                        disabled={detectingLocation}
                        className="w-full mt-3 p-3 bg-[#111] rounded-xl border border-[#222] flex items-start gap-3"
                    >
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            {detectingLocation ? (
                                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                            ) : (
                                <Navigation className="h-4 w-4 text-blue-400" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">Use current location</p>
                            <p className="text-xs text-[#666] mt-0.5 line-clamp-1">
                                {detectedAddress || 'Enable location to auto-detect'}
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-[#555] ml-auto -rotate-90 mt-2" />
                    </motion.button>
                </div>

                {/* Content */}
                <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        </div>
                    ) : searchQuery.trim() ? (
                        // Search Results
                        <div>
                            {searching && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                                </div>
                            )}
                            {searchResults.length > 0 ? (
                                <div className="space-y-1">
                                    {searchResults.map((city) => (
                                        <motion.button
                                            key={city.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectCity(city.name)}
                                            className={`w-full py-3 px-3 text-left rounded-lg transition-colors ${currentCity === city.name
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'text-white hover:bg-[#111]'
                                                }`}
                                        >
                                            {city.name}
                                        </motion.button>
                                    ))}
                                </div>
                            ) : !searching && (
                                <p className="text-center text-[#555] py-8 text-sm">No cities found</p>
                            )}
                        </div>
                    ) : (
                        // Popular Cities Grid - District Style
                        <div>
                            <h3 className="text-xs font-medium text-[#888] mb-4">
                                Popular cities
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {popularCities.slice(0, 6).map((city) => (
                                    <motion.button
                                        key={city.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSelectCity(city.name)}
                                        className={`flex flex-col items-center p-4 rounded-xl border transition-all ${currentCity === city.name
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-[#222] bg-[#111] hover:border-[#333]'
                                            }`}
                                    >
                                        <span className="text-3xl mb-2">
                                            {CITY_ICONS[city.name] || city.iconEmoji || '🏙️'}
                                        </span>
                                        <span className="text-xs font-medium text-center text-white">
                                            {city.name}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* All Cities List */}
                            <h3 className="text-xs font-medium text-[#888] mb-3">
                                All cities
                            </h3>
                            <div className="space-y-1">
                                {['Abohar', 'Abu Road', 'Achampet', 'Acharapakkam', 'Addanki', 'Adilabad', 'Vizag', 'Jaipur', 'Lucknow', 'Indore', 'Bhopal', 'Coimbatore'].map((city) => (
                                    <motion.button
                                        key={city}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectCity(city)}
                                        className={`w-full py-3 px-3 text-left text-sm rounded-lg transition-colors border-b border-[#1a1a1a] ${currentCity === city
                                                ? 'text-green-400'
                                                : 'text-white hover:bg-[#111]'
                                            }`}
                                    >
                                        {city}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
