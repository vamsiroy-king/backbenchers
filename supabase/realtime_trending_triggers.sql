-- Create a trigger ensuring trending scores update securely in REAL-TIME
-- This avoids waiting for nightly cron jobs

-- 1. Function to update a single merchant's score
CREATE OR REPLACE FUNCTION update_single_merchant_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the merchant associated with the new transaction
    UPDATE merchants
    SET trending_score = (
        (COALESCE(total_redemptions, 0) * 1.0) + 
        (COALESCE(total_offers, 0) * 0.5) +
        (COALESCE(average_rating, 0) * 2.0)
    )
    WHERE id = NEW.merchant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on Transactions table (after Insert)
DROP TRIGGER IF EXISTS trigger_update_trending_on_transaction ON transactions;

CREATE TRIGGER trigger_update_trending_on_transaction
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_single_merchant_trending_score();

-- 3. Trigger to also update total_redemptions count automatically (if not already handled)
CREATE OR REPLACE FUNCTION increment_merchant_redemptions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE merchants
    SET total_redemptions = COALESCE(total_redemptions, 0) + 1
    WHERE id = NEW.merchant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_redemptions ON transactions;

CREATE TRIGGER trigger_increment_redemptions
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION increment_merchant_redemptions();

