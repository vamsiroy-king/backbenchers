-- =============================================
-- REDEMPTION RULES - Add columns to offers table
-- =============================================

-- Add redemption rule columns to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS max_per_student INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS one_time_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_total_redemptions INTEGER DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN offers.max_per_student IS 'Maximum number of times a single student can redeem this offer. NULL = unlimited';
COMMENT ON COLUMN offers.cooldown_hours IS 'Hours student must wait between redemptions. NULL = no cooldown';
COMMENT ON COLUMN offers.one_time_only IS 'If true, offer can only be redeemed once per student ever';
COMMENT ON COLUMN offers.max_total_redemptions IS 'Maximum total redemptions across all students. NULL = unlimited';

-- Function to check if student can redeem offer
CREATE OR REPLACE FUNCTION can_student_redeem_offer(
    p_student_id UUID,
    p_offer_id UUID
) RETURNS TABLE (
    can_redeem BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_offer RECORD;
    v_student_redemptions INTEGER;
    v_last_redemption TIMESTAMP WITH TIME ZONE;
    v_total_redemptions INTEGER;
BEGIN
    -- Get offer details
    SELECT * INTO v_offer FROM offers WHERE id = p_offer_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Offer not found';
        RETURN;
    END IF;
    
    -- Check if offer is active
    IF v_offer.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Offer is not active';
        RETURN;
    END IF;
    
    -- Check if offer has expired
    IF v_offer.valid_until IS NOT NULL AND v_offer.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 'Offer has expired';
        RETURN;
    END IF;
    
    -- Get student's redemption count for this offer
    SELECT COUNT(*), MAX(redeemed_at) 
    INTO v_student_redemptions, v_last_redemption
    FROM transactions 
    WHERE student_id = p_student_id AND offer_id = p_offer_id;
    
    -- Check one_time_only
    IF v_offer.one_time_only AND v_student_redemptions > 0 THEN
        RETURN QUERY SELECT FALSE, 'You have already redeemed this offer';
        RETURN;
    END IF;
    
    -- Check max_per_student
    IF v_offer.max_per_student IS NOT NULL AND v_student_redemptions >= v_offer.max_per_student THEN
        RETURN QUERY SELECT FALSE, format('Maximum redemptions reached (%s/%s)', v_student_redemptions, v_offer.max_per_student);
        RETURN;
    END IF;
    
    -- Check cooldown
    IF v_offer.cooldown_hours IS NOT NULL AND v_last_redemption IS NOT NULL THEN
        IF v_last_redemption + (v_offer.cooldown_hours || ' hours')::INTERVAL > NOW() THEN
            RETURN QUERY SELECT FALSE, format('Please wait %s hours between redemptions', v_offer.cooldown_hours);
            RETURN;
        END IF;
    END IF;
    
    -- Check max_total_redemptions
    IF v_offer.max_total_redemptions IS NOT NULL THEN
        SELECT total_redemptions INTO v_total_redemptions FROM offers WHERE id = p_offer_id;
        IF v_total_redemptions >= v_offer.max_total_redemptions THEN
            RETURN QUERY SELECT FALSE, 'This offer is sold out';
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT TRUE, 'OK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
