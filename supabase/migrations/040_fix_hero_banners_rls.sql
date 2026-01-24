-- =============================================
-- FIX RLS FOR HERO BANNERS
-- =============================================

-- Enable RLS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (for the app)
DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;
CREATE POLICY "Public can view active hero_banners" ON hero_banners
    FOR SELECT USING (is_active = true);

-- 2. Admin Full Access
-- Allow admins to do EVERYTHING (Select, Insert, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage hero_banners" ON hero_banners;
CREATE POLICY "Admins can manage hero_banners" ON hero_banners
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );
