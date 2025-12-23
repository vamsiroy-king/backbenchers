-- Create trending_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS trending_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    section VARCHAR NOT NULL CHECK (section IN ('online', 'offline')),
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(offer_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trending_section_position ON trending_offers(section, position);

-- Function to refresh trending offers based on 24-hour transaction volume
-- Runs with SECURITY DEFINER to bypass RLS (effectively running as admin/postgres)
CREATE OR REPLACE FUNCTION refresh_trending_offers()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_online_count INTEGER;
    v_offline_count INTEGER;
BEGIN
    -- 1. Clear existing trending offers 
    DELETE FROM trending_offers;

    -- 2. Insert Top Offline Offers (based on transaction count in last 24h)
    INSERT INTO trending_offers (offer_id, section, position)
    SELECT 
        o.id,
        'offline',
        ROW_NUMBER() OVER (ORDER BY COUNT(t.id) DESC, o.created_at DESC) - 1 as position
    FROM offers o
    LEFT JOIN transactions t ON t.offer_id = o.id 
        AND t.created_at > (NOW() - INTERVAL '24 hours')
    WHERE o.status = 'active'
      AND (o.channel = 'offline' OR o.channel IS NULL)
    GROUP BY o.id
    ORDER BY COUNT(t.id) DESC
    LIMIT 20;

    -- 3. Insert Top Online Offers
    INSERT INTO trending_offers (offer_id, section, position)
    SELECT 
        o.id,
        'online',
        ROW_NUMBER() OVER (ORDER BY COUNT(t.id) DESC, o.created_at DESC) - 1 as position
    FROM offers o
    LEFT JOIN transactions t ON t.offer_id = o.id 
        AND t.created_at > (NOW() - INTERVAL '24 hours')
    WHERE o.status = 'active'
      AND o.channel = 'online'
    GROUP BY o.id
    ORDER BY COUNT(t.id) DESC
    LIMIT 20;

END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION refresh_trending_offers TO anon, authenticated, service_role;
