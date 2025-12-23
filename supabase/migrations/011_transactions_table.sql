-- Redemption Tracking System
-- This migration creates the complete transactions/redemptions tracking

-- 1. Create transactions table to track every redemption
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    scanned_by_user_id UUID REFERENCES auth.users(id), -- merchant user who scanned
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_offer_id ON transactions(offer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_scanned_at ON transactions(scanned_at);
CREATE INDEX IF NOT EXISTS idx_transactions_student_offer ON transactions(student_id, offer_id);

-- 3. Function to count student's redemptions for an offer
CREATE OR REPLACE FUNCTION get_student_redemption_count(
    p_student_id UUID,
    p_offer_id UUID
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM transactions
        WHERE student_id = p_student_id
        AND offer_id = p_offer_id
        AND status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get last redemption time for cooldown check
CREATE OR REPLACE FUNCTION get_last_redemption_time(
    p_student_id UUID,
    p_offer_id UUID
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN (
        SELECT scanned_at
        FROM transactions
        WHERE student_id = p_student_id
        AND offer_id = p_offer_id
        AND status = 'completed'
        ORDER BY scanned_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Main validation function - checks if student can redeem offer
CREATE OR REPLACE FUNCTION can_student_redeem_offer(
    p_student_id UUID,
    p_offer_id UUID
) RETURNS JSON AS $$
DECLARE
    v_offer RECORD;
    v_redemption_count INTEGER;
    v_last_redemption TIMESTAMP WITH TIME ZONE;
    v_hours_since_last NUMERIC;
    v_total_redemptions INTEGER;
BEGIN
    -- Get offer details with redemption rules
    SELECT 
        status,
        valid_until,
        max_per_student,
        cooldown_hours,
        one_time_only,
        max_total_redemptions,
        total_redemptions
    INTO v_offer
    FROM offers
    WHERE id = p_offer_id;
    
    -- Check if offer exists and is active
    IF v_offer IS NULL THEN
        RETURN json_build_object('allowed', false, 'reason', 'Offer not found');
    END IF;
    
    IF v_offer.status != 'active' THEN
        RETURN json_build_object('allowed', false, 'reason', 'Offer is not active');
    END IF;
    
    -- Check if offer has expired
    IF v_offer.valid_until IS NOT NULL AND v_offer.valid_until < NOW() THEN
        RETURN json_build_object('allowed', false, 'reason', 'Offer has expired');
    END IF;
    
    -- Check max total redemptions
    IF v_offer.max_total_redemptions IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_total_redemptions
        FROM transactions
        WHERE offer_id = p_offer_id AND status = 'completed';
        
        IF v_total_redemptions >= v_offer.max_total_redemptions THEN
            RETURN json_build_object('allowed', false, 'reason', 'Offer has reached maximum total redemptions');
        END IF;
    END IF;
    
    -- Get student's redemption count for this offer
    v_redemption_count := get_student_redemption_count(p_student_id, p_offer_id);
    
    -- Check one-time-only
    IF v_offer.one_time_only = true AND v_redemption_count >= 1 THEN
        RETURN json_build_object('allowed', false, 'reason', 'You have already used this one-time offer');
    END IF;
    
    -- Check max per student
    IF v_offer.max_per_student IS NOT NULL AND v_redemption_count >= v_offer.max_per_student THEN
        RETURN json_build_object('allowed', false, 'reason', 'You have reached the maximum redemptions for this offer (' || v_offer.max_per_student || ' times)');
    END IF;
    
    -- Check cooldown period
    IF v_offer.cooldown_hours IS NOT NULL AND v_redemption_count > 0 THEN
        v_last_redemption := get_last_redemption_time(p_student_id, p_offer_id);
        v_hours_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_redemption)) / 3600;
        
        IF v_hours_since_last < v_offer.cooldown_hours THEN
            RETURN json_build_object(
                'allowed', false, 
                'reason', 'Please wait ' || CEIL(v_offer.cooldown_hours - v_hours_since_last) || ' more hours before using this offer again'
            );
        END IF;
    END IF;
    
    -- All checks passed
    RETURN json_build_object(
        'allowed', true, 
        'reason', 'OK',
        'remaining_uses', CASE 
            WHEN v_offer.max_per_student IS NOT NULL 
            THEN v_offer.max_per_student - v_redemption_count 
            ELSE NULL 
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to record a redemption
CREATE OR REPLACE FUNCTION record_redemption(
    p_student_id UUID,
    p_offer_id UUID,
    p_merchant_id UUID,
    p_scanned_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_can_redeem JSON;
    v_transaction_id UUID;
BEGIN
    -- First check if redemption is allowed
    v_can_redeem := can_student_redeem_offer(p_student_id, p_offer_id);
    
    IF NOT (v_can_redeem->>'allowed')::BOOLEAN THEN
        RETURN v_can_redeem;
    END IF;
    
    -- Record the transaction
    INSERT INTO transactions (student_id, offer_id, merchant_id, scanned_by_user_id)
    VALUES (p_student_id, p_offer_id, p_merchant_id, p_scanned_by)
    RETURNING id INTO v_transaction_id;
    
    -- Update offer's total_redemptions counter
    UPDATE offers 
    SET total_redemptions = COALESCE(total_redemptions, 0) + 1
    WHERE id = p_offer_id;
    
    RETURN json_build_object(
        'allowed', true,
        'reason', 'Redemption successful',
        'transaction_id', v_transaction_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Students can view their own transactions
CREATE POLICY "Students can view own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

-- Merchants can view transactions for their offers
CREATE POLICY "Merchants can view their transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

-- Merchants can insert transactions (when scanning)
CREATE POLICY "Merchants can create transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION can_student_redeem_offer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_redemption(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_redemption_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_redemption_time(UUID, UUID) TO authenticated;
