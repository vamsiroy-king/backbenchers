import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// COMING SOON MODE: Set to true to redirect all traffic to /coming-soon
// Set to false to launch the full app
const COMING_SOON_MODE = false; // DISABLED - Full app is now live!

// Pages that are allowed even in coming soon mode
const ALLOWED_PATHS = [
    '/coming-soon',
    '/api/waitlist',
    '/_next',
    '/favicon.ico',
];

export function middleware(request: NextRequest) {
    // Skip if coming soon mode is disabled
    if (!COMING_SOON_MODE) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Allow certain paths
    const isAllowed = ALLOWED_PATHS.some(path => pathname.startsWith(path));
    if (isAllowed) {
        return NextResponse.next();
    }

    // Redirect everything else to coming-soon
    return NextResponse.redirect(new URL('/coming-soon', request.url));
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
