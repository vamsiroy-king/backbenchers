import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force this to run on Node.js runtime, not Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to verify admin session
async function verifyAdminSession(request: NextRequest): Promise<boolean> {
    const adminSession = request.cookies.get('bb_admin_session')?.value;
    return adminSession === 'authenticated';
}

export async function POST(request: NextRequest) {
    try {
        // DEFENSE IN DEPTH: Verify session cookie
        const isAdmin = await verifyAdminSession(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        // Create admin client inside the handler to ensure env vars are available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing env vars:', {
                urlPresent: !!supabaseUrl,
                keyPresent: !!serviceKey
            });
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing Supabase credentials' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const body = await request.json();

        // Use Service Role to insert (Bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('online_brands')
            .insert(body)
            .select()
            .single();

        if (error) {
            console.error('Admin Brand Create Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Admin Brand Create Exception:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Unknown error occurred' },
            { status: 500 }
        );
    }
}
