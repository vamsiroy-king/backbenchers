import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin authentication secret - Change this to a strong secret!
// Set via environment variable for security
// SECURITY: Do not use hardcoded secrets. Admin access requires this ENV variable.
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: ADMIN_SECRET is not set in environment variables. Admin access is disabled.');
}

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

    // BUSINESS SUBDOMAIN: business.backbenchers.app
    if (hostname.startsWith('business.')) {
        // Only allow recruiter routes and shared API
        if (pathname.startsWith('/admin') || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
            url.pathname = '/recruiter/dashboard';
            return NextResponse.redirect(url);
        }
        // Redirect root to recruiter login
        if (pathname === '/') {
            url.pathname = '/recruiter/auth/login';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // ADMIN SUBDOMAIN: admin.backbenchers.app
    if (hostname.startsWith('admin.')) {
        // === ADMIN AUTHENTICATION ===
        // Check for admin auth cookie
        const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

        // Allow the admin-auth page (login page) and the login API
        if (pathname === '/admin-auth' || pathname === '/api/auth/admin-login') {
            return NextResponse.next();
        }

        // Check if authenticated
        if (adminSession !== 'authenticated') {
            // Redirect to admin auth page
            url.pathname = '/admin-auth';
            return NextResponse.redirect(url);
        }

        // Only allow admin routes and API routes
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && pathname !== '/') {
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
    // Block access to admin routes AND admin APIs
    // CRITICAL SECURITY FIX: Explicitly block /api/admin on public domains
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // Return 404 for API routes to hide them completely
        if (pathname.startsWith('/api/')) {
            return new NextResponse(null, { status: 404 });
        }
        // Redirect UI routes
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/merchant') || pathname.startsWith('/recruiter')) {
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
