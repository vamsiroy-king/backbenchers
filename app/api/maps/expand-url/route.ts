import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to expand Google Maps short links and extract coordinates
 * Short links like https://maps.app.goo.gl/xxxxx redirect to full URLs with coordinates
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check if it's a short link that needs expansion
        const isShortLink = /goo\.gl|maps\.app/.test(url);

        let finalUrl = url;

        if (isShortLink) {
            // Follow redirects to get the full URL
            const response = await fetch(url, {
                method: 'HEAD',
                redirect: 'follow',
            });
            finalUrl = response.url;
        }

        // Extract coordinates from the expanded URL
        const coords = extractCoordinates(finalUrl);

        if (coords) {
            return NextResponse.json({
                success: true,
                latitude: coords.lat,
                longitude: coords.lng,
                expandedUrl: finalUrl,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Could not extract coordinates from URL',
                expandedUrl: finalUrl,
            });
        }
    } catch (error: any) {
        console.error('Error expanding URL:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to expand URL'
        }, { status: 500 });
    }
}

function extractCoordinates(url: string): { lat: number; lng: number } | null {
    if (!url) return null;

    try {
        // Pattern 1: @lat,lng,zoom
        const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (atMatch) {
            return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }

        // Pattern 2: ?q=lat,lng
        const qMatch = url.match(/[?&]q=(-?\d+\.?\d*)[,+](-?\d+\.?\d*)/);
        if (qMatch) {
            return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }

        // Pattern 3: !3d{lat}!4d{lng}
        const placeMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (placeMatch) {
            return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
        }

        // Pattern 4: ll=lat,lng
        const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (llMatch) {
            return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
        }

        // Pattern 5: /place/.../@lat,lng
        const placeAtMatch = url.match(/\/place\/[^@]+@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (placeAtMatch) {
            return { lat: parseFloat(placeAtMatch[1]), lng: parseFloat(placeAtMatch[2]) };
        }

        return null;
    } catch (error) {
        return null;
    }
}
