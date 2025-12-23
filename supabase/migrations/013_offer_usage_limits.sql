-- Offer Usage Limits
-- Adds fields to control how many times an offer can be redeemed

-- Add usage limit fields to offers table
ALTER TABLE offers ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) DEFAULT 'unlimited' 
    CHECK (usage_type IN ('unlimited', 'limited', 'one_time'));

-- Maximum total uses (null = unlimited)
ALTER TABLE offers ADD COLUMN IF NOT EXISTS max_total_uses INTEGER DEFAULT NULL;

-- Maximum uses per student (1 = one-time per student, null = unlimited)
ALTER TABLE offers ADD COLUMN IF NOT EXISTS max_per_student INTEGER DEFAULT NULL;

-- Current total uses counter
ALTER TABLE offers ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

-- Function to check if offer can be redeemed by a student
CREATE OR REPLACE FUNCTION can_redeem_offer(p_offer_id UUID, p_student_id UUID)
RETURNS TABLE(can_redeem BOOLEAN, reason TEXT) AS $$
DECLARE
    v_offer RECORD;
    v_student_redemptions INTEGER;
BEGIN
    -- Get offer details
    SELECT usage_type, max_total_uses, max_per_student, current_uses, status
    INTO v_offer
    FROM offers
    WHERE id = p_offer_id;
    
    -- Check if offer exists and is active
    IF v_offer IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Offer not found'::TEXT;
        RETURN;
    END IF;
    
    IF v_offer.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Offer is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check total uses limit
    IF v_offer.max_total_uses IS NOT NULL AND v_offer.current_uses >= v_offer.max_total_uses THEN
        RETURN QUERY SELECT FALSE, 'Offer has reached maximum redemptions'::TEXT;
        RETURN;
    END IF;
    
    -- Check per-student limit
    IF v_offer.max_per_student IS NOT NULL THEN
        SELECT COUNT(*) INTO v_student_redemptions
        FROM transactions
        WHERE offer_id = p_offer_id AND student_id = p_student_id;
        
        IF v_student_redemptions >= v_offer.max_per_student THEN
            RETURN QUERY SELECT FALSE, 'You have already redeemed this offer'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT TRUE, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to increment offer usage (called after successful redemption)
CREATE OR REPLACE FUNCTION increment_offer_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE offers
    SET current_uses = current_uses + 1
    WHERE id = NEW.offer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment usage on transaction insert
DROP TRIGGER IF EXISTS tr_increment_offer_usage ON transactions;
CREATE TRIGGER tr_increment_offer_usage
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_offer_usage();
