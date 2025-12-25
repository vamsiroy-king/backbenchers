// API Route to delete student from both database AND Supabase Auth
// This requires the service role key (admin privileges)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client with service role key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // This is the secret service role key
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function DELETE(request: NextRequest) {
    try {
        const { studentId, userId, collegeEmail } = await request.json();

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }

        // 1. Delete related transactions
        await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('student_id', studentId);

        // 2. Delete favorites
        await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('student_id', studentId);

        // 3. Delete from google_signups if exists
        if (userId) {
            await supabaseAdmin
                .from('google_signups')
                .delete()
                .eq('user_id', userId);
        }

        // 4. Delete from students table
        const { error: deleteError } = await supabaseAdmin
            .from('students')
            .delete()
            .eq('id', studentId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 5. Delete from Supabase Auth (both Google account and college email if exists)
        if (userId) {
            try {
                await supabaseAdmin.auth.admin.deleteUser(userId);
                console.log('Deleted Google auth user:', userId);
            } catch (authError) {
                console.error('Error deleting Google auth user:', authError);
                // Continue even if this fails
            }
        }

        // 6. Also delete college email from Auth if it exists as separate user
        if (collegeEmail) {
            try {
                // Find user by college email
                const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
                const collegeAuthUser = authUsers?.users?.find(
                    u => u.email?.toLowerCase() === collegeEmail.toLowerCase()
                );

                if (collegeAuthUser) {
                    await supabaseAdmin.auth.admin.deleteUser(collegeAuthUser.id);
                    console.log('Deleted college email auth user:', collegeEmail);
                }
            } catch (authError) {
                console.error('Error deleting college email auth user:', authError);
                // Continue even if this fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete student API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
