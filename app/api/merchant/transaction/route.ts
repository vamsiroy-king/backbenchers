import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validate Payload
        // Ensure numbers are valid (NaN protection)
        const payload = {
            student_id: body.studentId,
            student_bb_id: body.studentBbId || '',
            student_name: body.studentName,
            merchant_id: body.merchantId,
            merchant_bbm_id: body.merchantBbmId || '',
            merchant_name: body.merchantName,
            offer_id: body.offerId,
            offer_title: body.offerTitle,
            original_amount: Number(body.originalAmount) || 0,
            discount_amount: Number(body.discountAmount) || 0,
            final_amount: Number(body.finalAmount) || 0,
            savings_amount: Number(body.discountAmount) || 0, // Same as discount
            payment_method: body.paymentMethod || 'cash'
        };

        console.log('[API] Recording Transaction:', { ...payload, student_name: 'REDACTED' });

        // 2. Insert Transaction (Bypass RLS)
        const { data: transaction, error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert(payload)
            .select()
            .single();

        if (insertError) {
            console.error('[API] Insert Failed:', insertError);
            return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
        }

        // 3. Update Statistics (Stats)
        // We use Promise.all to run these updates in parallel without blocking the response too much
        // Errors here are non-fatal for the transaction itself but logged
        try {
            // Update Student Savings
            // Try RPC first
            const { error: rpcError } = await supabaseAdmin.rpc('update_student_after_transaction', {
                p_student_id: payload.student_id,
                p_discount_amount: payload.discount_amount
            });

            if (rpcError) {
                // Manual Fallback
                const { data: currentStudent } = await supabaseAdmin
                    .from('students')
                    .select('total_savings, total_redemptions')
                    .eq('id', payload.student_id)
                    .single();

                if (currentStudent) {
                    await supabaseAdmin
                        .from('students')
                        .update({
                            total_savings: Number(currentStudent.total_savings) + payload.discount_amount,
                            total_redemptions: (currentStudent.total_redemptions || 0) + 1
                        })
                        .eq('id', payload.student_id);
                }
            }

            // Update Merchant Stats
            const { data: currentMerchant } = await supabaseAdmin
                .from('merchants')
                .select('total_redemptions, total_revenue')
                .eq('id', payload.merchant_id)
                .single();

            if (currentMerchant) {
                await supabaseAdmin
                    .from('merchants')
                    .update({
                        total_redemptions: (currentMerchant.total_redemptions || 0) + 1,
                        total_revenue: Number(currentMerchant.total_revenue) + payload.final_amount
                    })
                    .eq('id', payload.merchant_id);
            }

            // Update Offer Stats
            const { data: currentOffer } = await supabaseAdmin
                .from('offers')
                .select('total_redemptions')
                .eq('id', payload.offer_id)
                .single();

            if (currentOffer) {
                await supabaseAdmin
                    .from('offers')
                    .update({
                        total_redemptions: (currentOffer.total_redemptions || 0) + 1
                    })
                    .eq('id', payload.offer_id);
            }

            // 4. Create Pending Rating for Student (so rating popup appears!)
            // This is done server-side because merchant can't insert for student due to RLS
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 48); // Expires in 48 hours

            const { error: pendingRatingError } = await supabaseAdmin
                .from('pending_ratings')
                .upsert({
                    transaction_id: transaction.id,
                    merchant_id: payload.merchant_id,
                    merchant_name: payload.merchant_name,
                    student_id: payload.student_id,
                    expires_at: expiresAt.toISOString(),
                    is_dismissed: false
                }, {
                    onConflict: 'transaction_id'
                });

            if (pendingRatingError) {
                console.error('[API] Pending Rating Creation Warning:', pendingRatingError);
                // Non-fatal, continue
            } else {
                console.log('[API] ✅ Pending rating created for student:', payload.student_id);
            }

        } catch (statsError) {
            console.error('[API] Stats Update Warning:', statsError);
            // We do NOT fail the request, as the transaction is recorded.
        }

        return NextResponse.json({ success: true, data: transaction });

    } catch (error: any) {
        console.error('[API] Unhandled Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
