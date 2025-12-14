// Location Service - City-level detection using free Nominatim API
// No API key required!

// Supported cities with their aliases and rough boundaries
const SUPPORTED_CITIES: {
    name: string;
    aliases: string[];
    state: string;
}[] = [
        {
            name: "Bengaluru",
            aliases: ["bangalore", "bengaluru", "bengaluru urban", "bengaluru rural", "whitefield", "electronic city", "koramangala", "indiranagar", "jayanagar", "yelahanka", "hebbal", "marathahalli", "sarjapur", "hsr layout", "btm layout", "jp nagar", "bannerghatta", "anekal", "devanahalli"],
            state: "Karnataka"
        },
        {
            name: "Hyderabad",
            aliases: ["hyderabad", "secunderabad", "cyberabad", "hitech city", "gachibowli", "madhapur", "banjara hills", "jubilee hills", "kukatpally", "miyapur", "kondapur"],
            state: "Telangana"
        },
        {
            name: "Chennai",
            aliases: ["chennai", "madras", "anna nagar", "t nagar", "adyar", "velachery", "omr", "ecr", "tambaram", "guindy"],
            state: "Tamil Nadu"
        },
        {
            name: "Mumbai",
            aliases: ["mumbai", "bombay", "bandra", "andheri", "powai", "worli", "lower parel", "malad", "goregaon", "thane", "navi mumbai"],
            state: "Maharashtra"
        },
        {
            name: "Delhi",
            aliases: ["delhi", "new delhi", "ncr", "noida", "gurgaon", "gurugram", "faridabad", "ghaziabad", "dwarka", "saket", "connaught place"],
            state: "Delhi"
        },
        {
            name: "Pune",
            aliases: ["pune", "pimpri", "chinchwad", "hinjewadi", "kothrud", "viman nagar", "hadapsar", "wakad", "baner"],
            state: "Maharashtra"
        },
        {
            name: "Kolkata",
            aliases: ["kolkata", "calcutta", "salt lake", "new town", "park street", "howrah"],
            state: "West Bengal"
        },
        {
            name: "Jaipur",
            aliases: ["jaipur", "pink city"],
            state: "Rajasthan"
        }
    ];

// Match location text to supported city
function matchCity(locationText: string): string | null {
    const lowerText = locationText.toLowerCase();

    for (const city of SUPPORTED_CITIES) {
        // Check city name
        if (lowerText.includes(city.name.toLowerCase())) {
            return city.name;
        }
        // Check aliases
        for (const alias of city.aliases) {
            if (lowerText.includes(alias.toLowerCase())) {
                return city.name;
            }
        }
    }
    return null;
}

export interface LocationResult {
    success: boolean;
    city: string | null;
    fullAddress: string | null;
    error?: string;
}

export const locationService = {
    // Get user's current position
    async getCurrentPosition(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: false, // Faster, less battery
                    timeout: 10000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        });
    },

    // Detect city from coordinates using Nominatim (FREE)
    async detectCity(latitude: number, longitude: number): Promise<LocationResult> {
        try {
            // Nominatim reverse geocoding - FREE, no API key!
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'Backbenchers Student App (contact@backbenchers.app)'
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Geocoding failed");
            }

            const data = await response.json();

            // Extract location components
            const address = data.address || {};
            const displayName = data.display_name || "";

            // Try to match city from various fields
            const locationParts = [
                address.city,
                address.town,
                address.village,
                address.suburb,
                address.county,
                address.state_district,
                address.state,
                displayName
            ].filter(Boolean).join(", ");

            const matchedCity = matchCity(locationParts);

            if (matchedCity) {
                return {
                    success: true,
                    city: matchedCity,
                    fullAddress: displayName
                };
            }

            // No match - return the closest city-like name we found
            const fallbackCity = address.city || address.town || address.county || address.state_district;

            return {
                success: true,
                city: fallbackCity || null,
                fullAddress: displayName,
                error: fallbackCity ? undefined : "Could not detect city"
            };

        } catch (error: any) {
            console.error("[Location] Detection failed:", error);
            return {
                success: false,
                city: null,
                fullAddress: null,
                error: error.message
            };
        }
    },

    // Full flow: Get position + detect city
    async detectUserCity(): Promise<LocationResult> {
        try {
            const position = await this.getCurrentPosition();
            return await this.detectCity(
                position.coords.latitude,
                position.coords.longitude
            );
        } catch (error: any) {
            return {
                success: false,
                city: null,
                fullAddress: null,
                error: error.message
            };
        }
    },

    // Get list of supported cities
    getSupportedCities(): string[] {
        return SUPPORTED_CITIES.map(c => c.name);
    },

    // Check if a city is supported
    isCitySupported(cityName: string): boolean {
        return matchCity(cityName) !== null;
    }
};
