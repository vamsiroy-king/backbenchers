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

        // Create admin client inside the handler
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error: Missing Supabase credentials' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string || 'online-brands';
        const path = formData.get('path') as string;

        if (!file || !path) {
            return NextResponse.json(
                { success: false, error: 'File and path are required' },
                { status: 400 }
            );
        }

        // Use Service Role to upload (Bypasses RLS)
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, file, {
                upsert: true,
                contentType: file.type
            });

        if (error) {
            console.error('Admin Upload Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error('Admin Upload Exception:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
