-- Add trending score columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS trending_score float DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trending_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trending_rank int DEFAULT 0;

-- Index for fast trending queries
CREATE INDEX IF NOT EXISTS idx_merchants_trending ON merchants(is_trending_override DESC, trending_score DESC);

-- Function to calculate trending scores (can be scheduled)
CREATE OR REPLACE FUNCTION calculate_trending_scores()
RETURNS void AS $$
BEGIN
    UPDATE merchants m
    SET trending_score = (
        -- Simple algorithm: Total redemptions + (Offers count * 0.5) + (Average rating * 2)
        -- In a real scenario, this would check transaction dates for "recent" activity
        (COALESCE(m.total_redemptions, 0) * 1.0) + 
        (COALESCE(m.total_offers, 0) * 0.5) +
        (COALESCE(m.average_rating, 0) * 2.0)
    );
END;
$$ LANGUAGE plpgsql;
