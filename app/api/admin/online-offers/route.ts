import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Use Service Role to insert (Bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('online_offers')
            .insert(body)
            .select()
            .single();

        if (error) {
            console.error('Admin Offer Create Error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Admin Offer Create Exception:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
