import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client with service role key (bypasses RLS if permissions allow, or calls SECURITY DEFINER functions)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function GET(
    req: NextRequest,
    paramsPromise: { params: Promise<{ id: string }> } // Correct param type for Next.js 15
) {
    try {
        const { id } = await paramsPromise.params;

        if (!id) {
            return NextResponse.json({ success: false, error: "Student ID is required" }, { status: 400 });
        }

        // Use the new secure RPC function
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('get_student_admin_stats', {
            target_student_id: id
        });

        if (rpcError) {
            console.error('[Admin API] RPC Error:', rpcError);
            // Fallback: Check if it's a permission error (42501)
            // If so, it means the migration hasn't run yet.
            return NextResponse.json({ success: false, error: "Database error or permissions missing. Please apply migration 050." }, { status: 500 });
        }

        const result = rpcResult as any;

        if (!result || !result.success) {
            return NextResponse.json({ success: false, error: result?.error || "Student not found" }, { status: 404 });
        }

        const rawData = result.data;
        const rawStudent = rawData.student;

        // Map Student (snake_case -> camelCase) to match frontend expectations
        const student = {
            id: rawStudent.id,
            name: rawStudent.name,
            email: rawStudent.email,
            bbId: rawStudent.bb_id,
            profileImage: rawStudent.profile_image,
            college: rawStudent.college,
            city: rawStudent.city,
            state: rawStudent.state,
            gender: rawStudent.gender,
            dob: rawStudent.dob,
            status: rawStudent.status,
            createdAt: rawStudent.created_at,
            totalSavings: rawData.stats.totalSavings,
            totalRedemptions: rawStudent.total_redemptions
        };

        // Map Offline Transactions
        const offlineTransactions = (rawData.offlineTransactions || []).map((row: any) => ({
            id: row.id,
            studentId: row.student_id,
            merchantId: row.merchant_id,
            merchantName: row.merchant_name,
            offerTitle: row.offer_title,
            discountAmount: Number(row.discount_amount),
            finalAmount: Number(row.final_amount),
            redeemedAt: row.redeemed_at,
            status: 'completed'
        }));

        // Map Online Redemptions
        const onlineRedemptions = (rawData.onlineRedemptions || []).map((item: any) => ({
            id: item.id,
            offerId: item.offer_id,
            codeUsed: item.code_used,
            revealedAt: item.revealed_at || item.created_at,
            status: item.status,
            offerTitle: item.offer_title,
            offerCode: item.offer_code,
            brandName: item.brand_name || "Unknown Brand",
            brandLogo: item.brand_logo
        }));

        return NextResponse.json({
            success: true,
            data: {
                student: student,
                offlineTransactions,
                onlineRedemptions,
                stats: rawData.stats
            }
        });

    } catch (error: any) {
        console.error('[Admin Student Stats] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch student stats' },
            { status: 500 }
        );
    }
}
