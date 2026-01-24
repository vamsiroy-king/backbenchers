import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

// Note: This API is protected by Middleware (blocks access on public domain)
// AND by this internal session check (Defense in Depth)
async function verifyAdminSession(request: NextRequest): Promise<boolean> {
    try {
        const adminSession = request.cookies.get('bb_admin_session')?.value;
        return adminSession === 'authenticated';
    } catch (error) {
        console.error('[Admin API] Auth verification error:', error);
        return false;
    }
}


// PATCH - Update student status (suspend/reinstate/verify)
export async function PATCH(request: NextRequest) {
    try {
        const isAdmin = await verifyAdminSession(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Invalid Admin Session' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { studentId, status } = body;

        if (!studentId || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing studentId or status' },
                { status: 400 }
            );
        }

        if (!['verified', 'pending', 'suspended'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status value' },
                { status: 400 }
            );
        }

        // Update using admin client (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('students')
            .update({ status })
            .eq('id', studentId)
            .select('id, status')
            .single();

        if (error) {
            console.error('[Admin API] Update student error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log(`[Admin API] Student ${studentId} status updated to ${status}`);
        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[Admin API] Exception:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a student permanently
export async function DELETE(request: NextRequest) {
    try {
        const isAdmin = await verifyAdminSession(request);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('id');

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Missing student ID' },
                { status: 400 }
            );
        }

        // Delete related records first
        await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('student_id', studentId);

        await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('student_id', studentId);

        await supabaseAdmin
            .from('pending_ratings')
            .delete()
            .eq('student_id', studentId);

        // Delete the student
        const { error } = await supabaseAdmin
            .from('students')
            .delete()
            .eq('id', studentId);

        if (error) {
            console.error('[Admin API] Delete student error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log(`[Admin API] Student ${studentId} deleted successfully`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Admin API] Exception:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
