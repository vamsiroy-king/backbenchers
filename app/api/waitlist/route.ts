import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { email, userType = 'student', source = 'coming_soon' } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Insert into waitlist
        const { data, error } = await supabase
            .from('waitlist')
            .insert({
                email: email.toLowerCase().trim(),
                user_type: userType,
                source: source,
            })
            .select()
            .single();

        if (error) {
            // Check for duplicate email
            if (error.code === '23505') {
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
    // This could be used by admin to get waitlist count
    try {
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
