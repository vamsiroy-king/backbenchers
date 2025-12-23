import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Simple polling endpoint
        // You can secure this by checking headers if needed
        // const authHeader = request.headers.get('authorization');

        console.log('[Cron] Refreshing trending offers...');
        const { error } = await supabase.rpc('refresh_trending_offers');

        if (error) {
            console.error('[Cron] Error refreshing trending offers:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Trending offers refreshed successfully based on 24h transactions'
        });

    } catch (error: any) {
        console.error('[Cron] Internal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
