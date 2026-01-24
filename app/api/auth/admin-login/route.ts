import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret } = body;

        const ADMIN_SECRET = process.env.ADMIN_SECRET;

        if (!ADMIN_SECRET) {
            console.error("ADMIN_SECRET is not defined in environment variables");
            return NextResponse.json(
                { success: false, error: "Server misconfiguration" },
                { status: 500 }
            );
        }

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json(
                { success: false, error: "Invalid secret" },
                { status: 401 }
            );
        }

        // Set secure cookie
        const response = NextResponse.json({ success: true });

        // Cookie settings must match middleware expectations
        response.cookies.set("bb_admin_session", "authenticated", {
            httpOnly: true,
            secure: true, // Always secure in production
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
