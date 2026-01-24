-- =============================================
-- FORCE FIX RLS FOR HERO BANNERS (Final Attempt)
-- =============================================

-- 1. Reset RLS
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to be sure
DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can manage hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can insert hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can update hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can delete hero_banners" ON hero_banners;

-- 3. Public Read Access
CREATE POLICY "Public can view active hero_banners" ON hero_banners
    FOR SELECT USING (is_active = true);

-- 4. Admin Insert (Explicit)
CREATE POLICY "Admins can insert hero_banners" ON hero_banners
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 5. Admin Update (Explicit)
CREATE POLICY "Admins can update hero_banners" ON hero_banners
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    ) WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 6. Admin Delete (Explicit)
CREATE POLICY "Admins can delete hero_banners" ON hero_banners
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 7. Admin Select (Explicit)
CREATE POLICY "Admins can select hero_banners" ON hero_banners
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );
