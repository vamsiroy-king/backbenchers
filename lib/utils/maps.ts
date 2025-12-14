/**
 * Extract latitude and longitude from various Google Maps link formats
 * 
 * Supports:
 * - https://maps.google.com/?q=12.9716,77.5946
 * - https://www.google.com/maps/@12.9716,77.5946,15z
 * - https://www.google.com/maps/place/.../@12.9716,77.5946,17z
 * - https://goo.gl/maps/xxxxx (short links - need expansion)
 * - https://maps.app.goo.gl/xxxxx (app short links)
 */

export function extractCoordinatesFromGoogleMapsLink(url: string): { lat: number; lng: number } | null {
    if (!url || typeof url !== 'string') return null;

    try {
        // Pattern 1: ?q=lat,lng or ?q=lat+lng
        const qMatch = url.match(/[?&]q=(-?\d+\.?\d*)[,+](-?\d+\.?\d*)/);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }

        // Pattern 2: @lat,lng,zoom
        const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (atMatch) {
            return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }

        // Pattern 3: /place/.../@lat,lng or !3d{lat}!4d{lng}
        const placeMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (placeMatch) {
            return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
        }

        // Pattern 4: ll=lat,lng
        const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (llMatch) {
            return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
        }

        // Pattern 5: destination=lat,lng
        const destMatch = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (destMatch) {
            return { lat: parseFloat(destMatch[1]), lng: parseFloat(destMatch[2]) };
        }

        // Pattern 6: data=...!8m2!3d{lat}!4d{lng}
        const dataMatch = url.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (dataMatch) {
            return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
        }

        return null;
    } catch (error) {
        console.error('Error extracting coordinates:', error);
        return null;
    }
}

/**
 * Check if URL is a short Google Maps link that needs expansion
 */
export function isShortGoogleMapsLink(url: string): boolean {
    if (!url) return false;
    return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(url);
}

/**
 * Expand a short Google Maps URL to get coordinates
 * This uses our API endpoint to follow the redirect safely
 */
export async function expandAndExtractCoordinates(shortUrl: string): Promise<{ lat: number; lng: number } | null> {
    try {
        // Try to expand the URL via our API endpoint
        const response = await fetch('/api/expand-maps-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: shortUrl })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.expandedUrl) {
                // Extract coordinates from expanded URL
                return extractCoordinatesFromGoogleMapsLink(data.expandedUrl);
            }
            if (data.lat && data.lng) {
                return { lat: data.lat, lng: data.lng };
            }
        }

        return null;
    } catch (error) {
        console.error('Error expanding short URL:', error);
        return null;
    }
}

/**
 * Validate if coordinates are reasonable (within valid lat/lng range)
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Check if a URL is a valid Google Maps link
 */
export function isGoogleMapsLink(url: string): boolean {
    if (!url) return false;
    const googleMapsPatterns = [
        /google\.com\/maps/i,
        /maps\.google\.com/i,
        /goo\.gl\/maps/i,
        /maps\.app\.goo\.gl/i,
    ];
    return googleMapsPatterns.some(pattern => pattern.test(url));
}
