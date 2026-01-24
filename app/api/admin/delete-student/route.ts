// API Route to delete student from both database AND Supabase Auth
// This requires the service role key (admin privileges)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper to verify admin session
async function verifyAdminSession(request: NextRequest): Promise<boolean> {
    const adminSession = request.cookies.get('bb_admin_session')?.value;
    return adminSession === 'authenticated';
}

export async function DELETE(request: NextRequest) {
    try {
        // DEFENSE IN DEPTH: Verify session cookie
        const isAdmin = await verifyAdminSession(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        // Create admin client inside function to ensure env vars are loaded
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log('Delete API called');
        console.log('Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET');
        console.log('Service Role Key:', serviceRoleKey ? 'SET' : 'NOT SET');

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing environment variables');
            return NextResponse.json({
                error: 'Server configuration error - missing credentials'
            }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { studentId, userId, collegeEmail } = await request.json();
        console.log('Deleting student:', { studentId, userId, collegeEmail });

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }

        // 1. Delete related transactions
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('student_id', studentId);
        console.log('Transactions delete:', txError ? txError.message : 'OK');

        // 2. Delete favorites
        const { error: favError } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('student_id', studentId);
        console.log('Favorites delete:', favError ? favError.message : 'OK');

        // 3. Delete from google_signups if exists
        if (userId) {
            const { error: gsError } = await supabaseAdmin
                .from('google_signups')
                .delete()
                .eq('user_id', userId);
            console.log('Google signups delete:', gsError ? gsError.message : 'OK');
        }

        // 4. Delete from students table
        const { error: deleteError } = await supabaseAdmin
            .from('students')
            .delete()
            .eq('id', studentId);

        console.log('Students delete:', deleteError ? deleteError.message : 'OK');

        if (deleteError) {
            console.error('Failed to delete student:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 5. Delete from Supabase Auth (college email user)
        if (collegeEmail) {
            try {
                const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
                const collegeAuthUser = authUsers?.users?.find(
                    u => u.email?.toLowerCase() === collegeEmail.toLowerCase()
                );

                if (collegeAuthUser) {
                    await supabaseAdmin.auth.admin.deleteUser(collegeAuthUser.id);
                    console.log('Deleted college email auth user:', collegeEmail);
                }
            } catch (authError: any) {
                console.error('Error deleting college email auth user:', authError?.message);
            }
        }

        console.log('Student deleted successfully');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete student API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
