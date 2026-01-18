import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force this to run on Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Track a reveal event
export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const body = await request.json();
        const { studentId, offerId, brandId, code, source, deviceType, action } = body;

        if (!offerId || !code) {
            return NextResponse.json(
                { success: false, error: 'offerId and code are required' },
                { status: 400 }
            );
        }

        // Check if entry already exists
        const { data: existing } = await supabaseAdmin
            .from('coupon_redemptions')
            .select('id, status')
            .eq('student_id', studentId)
            .eq('offer_id', offerId)
            .single();

        if (existing) {
            // Update existing entry with new action
            const updates: any = {};

            if (action === 'copy') {
                updates.copied_at = new Date().toISOString();
                updates.status = 'COPIED';
            } else if (action === 'click') {
                updates.clicked_through_at = new Date().toISOString();
                updates.status = 'CLICKED';
            } else if (action === 'redeem') {
                updates.redeemed_at = new Date().toISOString();
                updates.status = 'REDEEMED';
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabaseAdmin
                    .from('coupon_redemptions')
                    .update(updates)
                    .eq('id', existing.id);

                if (error) {
                    console.error('Update tracking error:', error);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Tracking updated',
                redemptionId: existing.id
            });
        }

        // Create new reveal entry
        const { data, error } = await supabaseAdmin
            .from('coupon_redemptions')
            .insert({
                student_id: studentId || null,
                offer_id: offerId,
                brand_id: brandId || null,
                code_used: code,
                status: 'REVEALED',
                source: source || 'APP',
                device_type: deviceType || 'MOBILE'
            })
            .select()
            .single();

        if (error) {
            console.error('Insert tracking error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Reveal tracked',
            redemptionId: data?.id
        });

    } catch (error: any) {
        console.error('Tracking exception:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Tracking failed' },
            { status: 500 }
        );
    }
}

// Get tracking stats for admin dashboard
export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { searchParams } = new URL(request.url);
        const offerId = searchParams.get('offerId');
        const brandId = searchParams.get('brandId');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('coupon_redemptions')
            .select(`
                *,
                students:student_id (id, name, email, college),
                online_offers:offer_id (id, title, code),
                online_brands:brand_id (id, name, logo_url)
            `)
            .order('revealed_at', { ascending: false })
            .limit(limit);

        if (offerId) {
            query = query.eq('offer_id', offerId);
        }
        if (brandId) {
            query = query.eq('brand_id', brandId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch tracking error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Get aggregate stats
        const { data: stats } = await supabaseAdmin
            .from('coupon_redemptions')
            .select('status')
            .then(result => {
                const statusCounts = {
                    total: result.data?.length || 0,
                    revealed: result.data?.filter(r => r.status === 'REVEALED').length || 0,
                    copied: result.data?.filter(r => r.status === 'COPIED').length || 0,
                    clicked: result.data?.filter(r => r.status === 'CLICKED').length || 0,
                    redeemed: result.data?.filter(r => r.status === 'REDEEMED').length || 0
                };
                return { data: statusCounts, error: null };
            });

        return NextResponse.json({
            success: true,
            data: {
                redemptions: data,
                stats
            }
        });

    } catch (error: any) {
        console.error('Tracking GET exception:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch tracking data' },
            { status: 500 }
        );
    }
}
