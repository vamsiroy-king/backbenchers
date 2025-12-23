-- Auto-Trending Calculation
-- Calculates trending offers based on 24-hour performance

-- Function to calculate trending offers
CREATE OR REPLACE FUNCTION calculate_trending_offers(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
    offer_id UUID,
    merchant_id UUID,
    redemption_count BIGINT,
    unique_students BIGINT,
    score NUMERIC,
    channel VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as offer_id,
        o.merchant_id,
        COUNT(t.id) as redemption_count,
        COUNT(DISTINCT t.student_id) as unique_students,
        -- Score = redemptions + (unique students * 2) for diversity bonus
        (COUNT(t.id) + COUNT(DISTINCT t.student_id) * 2)::NUMERIC as score,
        COALESCE(o.channel, 'offline')::VARCHAR as channel
    FROM offers o
    LEFT JOIN transactions t ON t.offer_id = o.id 
        AND t.created_at > NOW() - (p_hours || ' hours')::INTERVAL
    WHERE o.status = 'active'
    GROUP BY o.id, o.merchant_id, o.channel
    ORDER BY score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get trending merchants (for "New on BackBenchers" section)
CREATE OR REPLACE FUNCTION get_new_merchants(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
    merchant_id UUID,
    business_name VARCHAR,
    category VARCHAR,
    city VARCHAR,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as merchant_id,
        m.business_name,
        m.category,
        m.city,
        m.logo_url,
        m.created_at
    FROM merchants m
    WHERE m.status = 'approved'
        AND m.created_at > NOW() - (p_days || ' days')::INTERVAL
    ORDER BY m.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add is_trending and is_promoted flags to offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;

-- Add is_new flag logic (virtual - based on created_at)
-- Merchants are "new" if created within last 7 days
-- Offers are "new" if created within last 3 days
