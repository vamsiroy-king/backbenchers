-- =============================================
-- MERCHANT RATING STATS - Real-Time Rating System
-- This migration adds rating columns to merchants table
-- and creates an auto-update trigger
-- =============================================

-- 1. Add rating stats columns to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create indexes for fast rating queries
CREATE INDEX IF NOT EXISTS idx_merchants_rating ON merchants(average_rating DESC);

-- =============================================
-- 2. Function to update merchant rating stats
-- Called automatically after every new rating
-- =============================================
CREATE OR REPLACE FUNCTION update_merchant_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    new_avg DECIMAL(2,1);
    new_total INTEGER;
BEGIN
    -- Calculate new stats
    SELECT 
        COALESCE(ROUND(AVG(stars)::NUMERIC, 1), 0.0),
        COALESCE(COUNT(*), 0)
    INTO new_avg, new_total
    FROM ratings 
    WHERE merchant_id = NEW.merchant_id;
    
    -- Update merchant record
    UPDATE merchants SET
        average_rating = new_avg,
        total_ratings = new_total,
        updated_at = NOW()
    WHERE id = NEW.merchant_id;
    
    -- Log for debugging
    RAISE NOTICE 'Updated merchant % rating: % stars from % reviews', 
        NEW.merchant_id, new_avg, new_total;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. Create trigger on ratings table
-- =============================================
DROP TRIGGER IF EXISTS trigger_update_merchant_rating ON ratings;

CREATE TRIGGER trigger_update_merchant_rating
AFTER INSERT ON ratings
FOR EACH ROW 
EXECUTE FUNCTION update_merchant_rating_stats();

-- =============================================
-- 4. Backfill existing ratings (if any)
-- =============================================
UPDATE merchants m SET
    average_rating = COALESCE((
        SELECT ROUND(AVG(stars)::NUMERIC, 1) 
        FROM ratings r 
        WHERE r.merchant_id = m.id
    ), 0.0),
    total_ratings = COALESCE((
        SELECT COUNT(*) 
        FROM ratings r 
        WHERE r.merchant_id = m.id
    ), 0);

-- =============================================
-- 5. Function to get rating breakdown for a merchant
-- Returns percentage for each star (5, 4, 3, 2, 1)
-- =============================================
CREATE OR REPLACE FUNCTION get_merchant_rating_breakdown(p_merchant_id UUID)
RETURNS TABLE(
    star_5_percent INTEGER,
    star_4_percent INTEGER,
    star_3_percent INTEGER,
    star_2_percent INTEGER,
    star_1_percent INTEGER
) AS $$
DECLARE
    total_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM ratings WHERE merchant_id = p_merchant_id;
    
    -- If no ratings, return all zeros
    IF total_count = 0 THEN
        RETURN QUERY SELECT 0, 0, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Calculate percentages
    RETURN QUERY
    SELECT
        COALESCE((SELECT ROUND(COUNT(*) * 100.0 / total_count)::INTEGER FROM ratings WHERE merchant_id = p_merchant_id AND stars = 5), 0),
        COALESCE((SELECT ROUND(COUNT(*) * 100.0 / total_count)::INTEGER FROM ratings WHERE merchant_id = p_merchant_id AND stars = 4), 0),
        COALESCE((SELECT ROUND(COUNT(*) * 100.0 / total_count)::INTEGER FROM ratings WHERE merchant_id = p_merchant_id AND stars = 3), 0),
        COALESCE((SELECT ROUND(COUNT(*) * 100.0 / total_count)::INTEGER FROM ratings WHERE merchant_id = p_merchant_id AND stars = 2), 0),
        COALESCE((SELECT ROUND(COUNT(*) * 100.0 / total_count)::INTEGER FROM ratings WHERE merchant_id = p_merchant_id AND stars = 1), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- DONE! Rating system now auto-updates
-- =============================================
