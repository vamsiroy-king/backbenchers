import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Zod Schema for Waitlist Input
const waitlistSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    userType: z.enum(['student', 'merchant', 'admin']).default('student'),
    source: z.string().max(50).default('coming_soon')
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const result = waitlistSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({
                error: result.error.issues[0].message
            }, { status: 400 });
        }

        const { email, userType, source } = result.data;

        // 2. Insert into DB
        const { data, error } = await supabase
            .from('waitlist')
            .insert({
                email,
                user_type: userType,
                source,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint code
                return NextResponse.json({
                    success: true,
                    message: 'You are already on the waitlist!'
                });
            }
            console.error('[Waitlist] Error:', error);
            return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Successfully joined the waitlist!',
            data: { id: data.id }
        });

    } catch (error: any) {
        console.error('[Waitlist] Exception:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Admin-only check could go here, but for now it's just a count
        const { count, error } = await supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
        }

        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
