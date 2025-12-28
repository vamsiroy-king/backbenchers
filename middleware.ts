import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin authentication secret - Change this to a strong secret!
// Set via environment variable for security
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'backbenchers-admin-2024-secret';

// Cookie name for admin session
const ADMIN_SESSION_COOKIE = 'bb_admin_session';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;
    const url = request.nextUrl.clone();

    // Skip static files and API routes that need to work everywhere
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.') // static files
    ) {
        return NextResponse.next();
    }

    // === LOCAL DEVELOPMENT ===
    // Allow all routes in localhost for testing
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return NextResponse.next();
    }

    // === SUBDOMAIN DETECTION ===

    // MERCHANT SUBDOMAIN: merchant.backbenchers.app
    if (hostname.startsWith('merchant.')) {
        // Only allow merchant routes and shared API
        if (pathname.startsWith('/admin') || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
            url.pathname = '/merchant/dashboard';
            return NextResponse.redirect(url);
        }
        // Redirect root to merchant dashboard
        if (pathname === '/') {
            url.pathname = '/merchant/auth/login';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // ADMIN SUBDOMAIN: admin.backbenchers.app
    if (hostname.startsWith('admin.')) {
        // === ADMIN AUTHENTICATION ===
        // Check for admin auth cookie or secret in URL
        const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
        const secretParam = url.searchParams.get('secret');

        // Allow the admin-auth page (login page)
        if (pathname === '/admin-auth') {
            return NextResponse.next();
        }

        // If secret is provided in URL, set cookie and redirect
        if (secretParam === ADMIN_SECRET) {
            const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
            response.cookies.set(ADMIN_SESSION_COOKIE, 'authenticated', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            });
            return response;
        }

        // Check if authenticated
        if (adminSession !== 'authenticated') {
            // Redirect to admin auth page
            url.pathname = '/admin-auth';
            return NextResponse.redirect(url);
        }

        // Only allow admin routes
        if (!pathname.startsWith('/admin') && pathname !== '/') {
            url.pathname = '/admin/dashboard';
            return NextResponse.redirect(url);
        }

        // Redirect root to admin dashboard
        if (pathname === '/') {
            url.pathname = '/admin/dashboard';
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    }

    // MAIN DOMAIN: backbenchers.app (Student App)
    // Block access to admin and merchant routes
    if (pathname.startsWith('/admin')) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/merchant')) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Allow all other routes for student app
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         */
        '/((?!_next/static|_next/image).*)',
    ],
};
