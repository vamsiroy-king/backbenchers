// Pending Ratings Service
// Stores rating requests in SUPABASE DATABASE so they work across devices
// (localStorage is browser-specific and won't work if merchant and student use different devices)

import { supabase } from '../supabase';

export interface PendingRating {
    id: string;
    transactionId: string;
    merchantId: string;
    merchantName: string;
    studentId: string;
    createdAt: string;
    expiresAt: string;
}

// Get all pending ratings for current student from database
export async function getPendingRatingsFromDB(studentId: string): Promise<PendingRating[]> {
    try {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('pending_ratings')
            .select('*')
            .eq('student_id', studentId)
            .eq('is_dismissed', false)
            .gt('expires_at', now)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[PendingRatings] Error fetching:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            transactionId: row.transaction_id,
            merchantId: row.merchant_id,
            merchantName: row.merchant_name,
            studentId: row.student_id,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        }));
    } catch (error) {
        console.error('[PendingRatings] Error:', error);
        return [];
    }
}

// Add a new pending rating to database
export async function addPendingRatingToDB(rating: {
    transactionId: string;
    merchantId: string;
    merchantName: string;
    studentId: string;
}): Promise<boolean> {
    console.log('[PendingRatings] ⏳ Attempting to add pending rating...');
    console.log('[PendingRatings] Input data:', JSON.stringify(rating, null, 2));

    try {
        const { data, error } = await supabase
            .from('pending_ratings')
            .upsert({
                transaction_id: rating.transactionId,
                merchant_id: rating.merchantId,
                merchant_name: rating.merchantName,
                student_id: rating.studentId,
            }, {
                onConflict: 'transaction_id',
            })
            .select();

        if (error) {
            console.error('[PendingRatings] ❌ ERROR adding:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return false;
        }

        console.log('[PendingRatings] ✅ Successfully added! Result:', data);
        return true;
    } catch (error) {
        console.error('[PendingRatings] Error:', error);
        return false;
    }
}

// Remove/dismiss a pending rating (after user rates or skips)
export async function dismissPendingRating(transactionId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('pending_ratings')
            .update({ is_dismissed: true })
            .eq('transaction_id', transactionId);

        if (error) {
            console.error('[PendingRatings] Error dismissing:', error);
            return false;
        }

        console.log('[PendingRatings] Dismissed pending rating for transaction:', transactionId);
        return true;
    } catch (error) {
        console.error('[PendingRatings] Error:', error);
        return false;
    }
}

// Get the first (oldest) pending rating to show
export async function getNextPendingRatingFromDB(studentId: string): Promise<PendingRating | null> {
    const ratings = await getPendingRatingsFromDB(studentId);
    return ratings.length > 0 ? ratings[0] : null;
}

// Delete a pending rating completely (after successful rating submission)
export async function deletePendingRating(transactionId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('pending_ratings')
            .delete()
            .eq('transaction_id', transactionId);

        if (error) {
            console.error('[PendingRatings] Error deleting:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[PendingRatings] Error:', error);
        return false;
    }
}
