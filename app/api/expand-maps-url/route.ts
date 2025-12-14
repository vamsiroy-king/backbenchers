import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to expand short Google Maps URLs
 * Mobile share links (maps.app.goo.gl/xxx) are redirects that need to be followed server-side
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check if it's a short Google Maps link
        const isShortLink = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(url);
        if (!isShortLink) {
            // Not a short link, return as-is
            return NextResponse.json({ expandedUrl: url });
        }

        // Follow the redirect to get the full URL
        // Using HEAD request to avoid downloading full page content
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Backbenchers/1.0)'
            }
        });

        // The final URL after following redirects
        const expandedUrl = response.url;

        // Try to extract coordinates from the expanded URL
        let lat = null;
        let lng = null;

        // Pattern 1: @lat,lng
        const atMatch = expandedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (atMatch) {
            lat = parseFloat(atMatch[1]);
            lng = parseFloat(atMatch[2]);
        }

        // Pattern 2: !3d{lat}!4d{lng}
        if (!lat || !lng) {
            const placeMatch = expandedUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
            if (placeMatch) {
                lat = parseFloat(placeMatch[1]);
                lng = parseFloat(placeMatch[2]);
            }
        }

        // Pattern 3: ?q=lat,lng
        if (!lat || !lng) {
            const qMatch = expandedUrl.match(/[?&]q=(-?\d+\.?\d*)[,+](-?\d+\.?\d*)/);
            if (qMatch) {
                lat = parseFloat(qMatch[1]);
                lng = parseFloat(qMatch[2]);
            }
        }

        return NextResponse.json({
            expandedUrl,
            lat,
            lng,
            success: lat !== null && lng !== null
        });

    } catch (error: any) {
        console.error('Error expanding maps URL:', error);
        return NextResponse.json(
            { error: 'Failed to expand URL', details: error.message },
            { status: 500 }
        );
    }
}

// Also handle GET for testing
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Redirect to POST handler
    return POST(new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
    }));
}
