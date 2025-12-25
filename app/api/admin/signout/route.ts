import { NextResponse } from 'next/server';

// Cookie name must match middleware
const ADMIN_SESSION_COOKIE = 'bb_admin_session';

export async function POST() {
    // Create response with cookie deletion
    const response = NextResponse.json({ success: true });

    // Delete the admin session cookie
    response.cookies.set(ADMIN_SESSION_COOKIE, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 0, // Expire immediately
    });

    return response;
}
