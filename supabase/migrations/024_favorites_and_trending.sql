-- =============================================
-- FAVORITES/SAVED TABLE
-- For saving merchants and offers
-- =============================================

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can only save each item once
    CONSTRAINT unique_user_merchant UNIQUE (user_id, merchant_id),
    CONSTRAINT unique_user_offer UNIQUE (user_id, offer_id),
    
    -- At least one of merchant_id or offer_id must be set
    CONSTRAINT must_have_target CHECK (merchant_id IS NOT NULL OR offer_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for favorites
ALTER PUBLICATION supabase_realtime ADD TABLE favorites;

-- Index for fast lookups
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_merchant_id ON favorites(merchant_id);
CREATE INDEX idx_favorites_offer_id ON favorites(offer_id);

-- =============================================
-- TRENDING BY REDEMPTIONS (Algorithm)
-- Auto-calculate top offers by redemption count
-- =============================================

-- Function to get trending offers by redemption count
CREATE OR REPLACE FUNCTION get_trending_by_redemptions(
    section_type TEXT DEFAULT 'offline',
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    offer_id UUID,
    title TEXT,
    discount_value NUMERIC,
    type TEXT,
    merchant_id UUID,
    merchant_name TEXT,
    merchant_city TEXT,
    redemption_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as offer_id,
        o.title,
        o.discount_value,
        o.type,
        o.merchant_id,
        m.business_name as merchant_name,
        m.city as merchant_city,
        COALESCE(COUNT(t.id), 0) as redemption_count
    FROM offers o
    INNER JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN transactions t ON t.offer_id = o.id 
        AND t.created_at > NOW() - INTERVAL '7 days'
    WHERE o.status = 'active'
        AND m.status = 'approved'
        AND m.online_store = (section_type = 'online')
    GROUP BY o.id, o.title, o.discount_value, o.type, o.merchant_id, m.business_name, m.city
    ORDER BY redemption_count DESC, o.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
