import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        // Validate service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

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
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
