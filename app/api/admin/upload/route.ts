import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
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
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
