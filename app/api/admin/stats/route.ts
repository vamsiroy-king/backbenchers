import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
    try {
        // Get dashboard stats directly from database with service role key
        // This bypasses RLS to get accurate counts

        // Parallel queries for speed
        const [
            studentsResult,
            merchantsResult,
            offersResult,
            transactionsResult
        ] = await Promise.all([
            // Students stats
            supabaseAdmin.from('students').select('status', { count: 'exact', head: false }),
            // Merchants stats  
            supabaseAdmin.from('merchants').select('status', { count: 'exact', head: false }),
            // Offers stats
            supabaseAdmin.from('offers').select('status', { count: 'exact', head: false }),
            // Transactions with revenue and savings
            supabaseAdmin.from('transactions').select('final_amount, discount_amount, redeemed_at')
        ]);

        // Calculate student stats
        const students = studentsResult.data || [];
        const totalStudents = students.length;
        const verifiedStudents = students.filter(s => s.status === 'verified').length;
        const pendingStudents = students.filter(s => s.status === 'pending').length;

        // Calculate merchant stats
        const merchants = merchantsResult.data || [];
        const totalMerchants = merchants.length;
        const approvedMerchants = merchants.filter(m => m.status === 'approved').length;
        const pendingMerchants = merchants.filter(m => m.status === 'pending').length;

        // Calculate offer stats
        const offers = offersResult.data || [];
        const totalOffers = offers.length;
        const activeOffers = offers.filter(o => o.status === 'active').length;

        // Calculate transaction stats
        const transactions = transactionsResult.data || [];
        const totalTransactions = transactions.length;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let totalRevenue = 0;
        let totalSavings = 0;
        let todayRevenue = 0;
        let todaySavings = 0;
        let todayTransactions = 0;
        let weekTransactions = 0;

        for (const tx of transactions) {
            const finalAmount = parseFloat(tx.final_amount) || 0;
            const discountAmount = parseFloat(tx.discount_amount) || 0;
            const redeemedAt = tx.redeemed_at ? new Date(tx.redeemed_at) : null;

            totalRevenue += finalAmount;
            totalSavings += discountAmount;

            if (redeemedAt) {
                if (redeemedAt >= today) {
                    todayTransactions++;
                    todayRevenue += finalAmount;
                    todaySavings += discountAmount;
                }
                if (redeemedAt >= weekAgo) {
                    weekTransactions++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalStudents,
                verifiedStudents,
                pendingStudents,
                totalMerchants,
                approvedMerchants,
                pendingMerchants,
                totalOffers,
                activeOffers,
                totalTransactions,
                todayTransactions,
                weekTransactions,
                totalRevenue: Math.round(totalRevenue),
                totalSavings: Math.round(totalSavings),
                todayRevenue: Math.round(todayRevenue),
                todaySavings: Math.round(todaySavings),
            }
        });

    } catch (error: any) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
