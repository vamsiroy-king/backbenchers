-- =============================================
-- ROBUST RLS FIX: SECURITY DEFINER APPROACH
-- Solves "infinite recursion" and policy check failures
-- =============================================

-- 1. Create a Secure Helper Function
-- This runs with Superuser privileges (SECURITY DEFINER)
-- but checks the calling user's ID securely.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESET & APPLY POLICIES FOR HERO BANNERS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;
CREATE POLICY "Public can view active hero_banners" ON hero_banners
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can insert hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can update hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can delete hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can select hero_banners" ON hero_banners;

-- Unified Admin Policy using the new secure function
CREATE POLICY "Admins can manage hero_banners" ON hero_banners
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 3. RESET & APPLY POLICIES FOR TRENDING OFFERS (Fixes 'Failed to save changes')
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;
CREATE POLICY "Public can view trending_offers" ON trending_offers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can insert trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can update trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can delete trending_offers" ON trending_offers;

CREATE POLICY "Admins can manage trending_offers" ON trending_offers
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 4. RESET & APPLY POLICIES FOR FEATURED BRANDS (Top Brands)
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;
CREATE POLICY "Public can view featured_brands" ON featured_brands
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can insert featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can update featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can delete featured_brands" ON featured_brands;

CREATE POLICY "Admins can manage featured_brands" ON featured_brands
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 5. ENSURE ADMINS CAN READ EVERYTHING ELSE (Merchants, Students, etc.)
-- This prevents the "0" stats issue in dashboard
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students" ON students FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all merchants" ON merchants;
CREATE POLICY "Admins can view all merchants" ON merchants FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all offers" ON offers;
CREATE POLICY "Admins can view all offers" ON offers FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage merchant_store_images" ON merchant_store_images;
CREATE POLICY "Admins can manage merchant_store_images" ON merchant_store_images 
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
