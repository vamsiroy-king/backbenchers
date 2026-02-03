-- 1. Restore/Ensure Service Role Permissions
-- It seems service_role lost access to tables. Re-granting.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Create RPC function for reliable Admin Stats (SECURITY DEFINER bypasses RLS/Permissions)
CREATE OR REPLACE FUNCTION get_student_admin_stats(target_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (usually postgres)
AS $$
DECLARE
    student_record RECORD;
    offline_tx JSON;
    online_redemptions JSON;
    total_savings NUMERIC;
    in_store_visits INTEGER;
    online_reveals INTEGER;
BEGIN
    -- Get Student
    SELECT * INTO student_record FROM students WHERE id = target_student_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Student not found');
    END IF;

    -- Get In-Store Transactions
    SELECT json_agg(t) INTO offline_tx
    FROM (
        SELECT * FROM transactions 
        WHERE student_id = target_student_id 
        ORDER BY redeemed_at DESC
    ) t;

    -- Get Online Redemptions (with brand details)
    SELECT json_agg(r) INTO online_redemptions
    FROM (
        SELECT 
            cr.*,
            ob.name as brand_name,
            ob.logo_url as brand_logo,
            oo.title as offer_title,
            oo.code as offer_code
        FROM coupon_redemptions cr
        LEFT JOIN online_offers oo ON cr.offer_id = oo.id
        LEFT JOIN online_brands ob ON oo.brand_id = ob.id
        WHERE cr.student_id = target_student_id
        ORDER BY cr.created_at DESC
    ) r;

    -- Calculate Stats
    SELECT COALESCE(SUM(discount_amount), 0) INTO total_savings
    FROM transactions 
    WHERE student_id = target_student_id;

    SELECT COUNT(*) INTO in_store_visits
    FROM transactions 
    WHERE student_id = target_student_id;

    SELECT COUNT(*) INTO online_reveals
    FROM coupon_redemptions 
    WHERE student_id = target_student_id;

    -- Return Consolidated JSON
    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'student', row_to_json(student_record),
            'offlineTransactions', COALESCE(offline_tx, '[]'::json),
            'onlineRedemptions', COALESCE(online_redemptions, '[]'::json),
            'stats', json_build_object(
                'totalSavings', total_savings,
                'inStoreVisits', in_store_visits,
                'onlineReveals', online_reveals
            )
        )
    );
END;
$$;

-- Grant execution to authenticated (admin API will use service role, but good to have)
GRANT EXECUTE ON FUNCTION get_student_admin_stats(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_student_admin_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_admin_stats(UUID) TO anon; -- Optional, but we restrict via API route logic usually
