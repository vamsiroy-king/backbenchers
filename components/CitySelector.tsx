"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Loader2 } from "lucide-react";
import { cityService, City } from "@/lib/services/city.service";

// City icons for popular cities
const CITY_ICONS: Record<string, string> = {
    'Mumbai': '🏛️',
    'Delhi-NCR': '🕌',
    'Bengaluru': '💻',
    'Hyderabad': '🏰',
    'Chennai': '⛪',
    'Pune': '🏔️',
    'Kolkata': '🌉',
    'Ahmedabad': '🏛️',
    'Chandigarh': '🌸',
    'Kochi': '🌴',
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
        try {
            // Import and use the new location service
            const { locationService } = await import('@/lib/services/location.service');
            const result = await locationService.detectUserCity();

            if (result.success && result.city) {
                // Successfully detected city - select it
                handleSelectCity(result.city);
            } else if (result.fullAddress) {
                // Couldn't map to supported city, but got address
                // Try to find a matching city from our popular cities
                const addressLower = result.fullAddress.toLowerCase();
                const matchedCity = popularCities.find(c =>
                    addressLower.includes(c.name.toLowerCase())
                );

                if (matchedCity) {
                    handleSelectCity(matchedCity.name);
                } else {
                    // No match - show error and let user select manually
                    console.log('Could not detect supported city:', result.fullAddress);
                    alert(`We detected "${result.fullAddress.split(',')[0]}" but it's not in our supported cities yet. Please select your nearest city.`);
                }
            } else {
                alert(result.error || 'Could not detect your location. Please select manually.');
            }
        } catch (error) {
            console.error('Auto detect error:', error);
            alert('Location detection failed. Please allow location access and try again.');
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleSelectCity = (cityName: string) => {
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
                className="fixed inset-0 z-[100] bg-white"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onClose} className="p-2 -ml-2">
                            <X className="h-6 w-6 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-bold">{currentCity || 'Select City'}</h2>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for your city"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-xl text-base outline-none"
                        />
                    </div>

                    {/* Auto Detect */}
                    <button
                        onClick={handleAutoDetect}
                        disabled={detectingLocation}
                        className="flex items-center gap-2 mt-4 text-red-500 font-medium text-sm"
                    >
                        {detectingLocation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MapPin className="h-4 w-4" />
                        )}
                        Auto Detect My Location
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                    ) : searchQuery.trim() ? (
                        // Search Results
                        <div>
                            {searching && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                                </div>
                            )}
                            {searchResults.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {searchResults.map((city) => (
                                        <button
                                            key={city.id}
                                            onClick={() => handleSelectCity(city.name)}
                                            className={`w-full py-4 text-left hover:bg-gray-50 ${currentCity === city.name ? 'text-purple-600 font-medium' : ''
                                                }`}
                                        >
                                            {city.name}
                                        </button>
                                    ))}
                                </div>
                            ) : !searching && (
                                <p className="text-center text-gray-400 py-8">No cities found</p>
                            )}
                        </div>
                    ) : (
                        // Popular Cities Grid
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                Popular Cities
                            </h3>
                            <div className="grid grid-cols-4 gap-3 mb-8">
                                {popularCities.map((city) => (
                                    <motion.button
                                        key={city.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSelectCity(city.name)}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${currentCity === city.name
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-transparent bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-3xl mb-1">
                                            {CITY_ICONS[city.name] || city.iconEmoji || '🏙️'}
                                        </span>
                                        <span className="text-xs font-medium text-center truncate w-full">
                                            {city.name}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Other Cities List */}
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                Other Cities
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {/* Show a few other cities as examples */}
                                {['Vizag', 'Jaipur', 'Lucknow', 'Indore', 'Bhopal', 'Coimbatore'].map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => handleSelectCity(city)}
                                        className={`w-full py-4 text-left hover:bg-gray-50 ${currentCity === city ? 'text-purple-600 font-medium' : ''
                                            }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
