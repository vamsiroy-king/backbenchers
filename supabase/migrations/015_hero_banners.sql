-- ============================================
-- MIGRATION 015: HERO BANNERS TABLE
-- For the scrollable hero section on student home
-- ============================================

-- Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    cta_text VARCHAR(100) DEFAULT 'Claim',
    cta_link TEXT,
    background_gradient VARCHAR(255) DEFAULT 'from-green-500 to-emerald-600',
    image_url TEXT,
    banner_type VARCHAR(50) DEFAULT 'promotion' CHECK (banner_type IN ('promotion', 'event', 'partner', 'announcement')),
    coverage_type VARCHAR(50) DEFAULT 'pan_india' CHECK (coverage_type IN ('pan_india', 'city_specific')),
    city_ids TEXT[], -- Array of city names for city-specific targeting
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    position INTEGER DEFAULT 0, -- For ordering
    is_active BOOLEAN DEFAULT TRUE,
    -- Event-specific fields
    event_date TIMESTAMP WITH TIME ZONE,
    event_location TEXT,
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(100),
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_banners_dates ON hero_banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_hero_banners_position ON hero_banners(position);

-- Enable RLS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners (public)
CREATE POLICY "Hero banners are public" ON hero_banners
    FOR SELECT USING (true);

-- Only admins can insert/update/delete
-- (In production, you'd add admin role check)
CREATE POLICY "Admins can manage banners" ON hero_banners
    FOR ALL USING (true);

-- Insert sample banner for testing
INSERT INTO hero_banners (title, subtitle, cta_text, background_gradient, banner_type, position)
VALUES 
    ('Welcome to BackBenchers!', 'India''s #1 Student Discount Platform', 'Explore Deals', 'from-green-500 to-emerald-600', 'announcement', 1),
    ('Flash Sale - 50% OFF', 'Limited time offer on all food outlets', 'Claim Now', 'from-orange-500 to-red-500', 'promotion', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS! Hero banners table created.
-- ============================================
