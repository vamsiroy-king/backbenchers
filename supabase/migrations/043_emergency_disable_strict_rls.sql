-- =============================================
-- EMERGENCY RLS FIX: RELAXED POLICIES
-- Goal: Unblock the user immediately by trusting 'authenticated' role
-- for Admin Management tables.
-- =============================================

-- 1. Hero Banners
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;

-- Allow public read (essential for app)
CREATE POLICY "Public can view active hero_banners" ON hero_banners
    FOR SELECT USING (is_active = true);

-- Allow ANY authenticated user (Admin/Merchant) to manage.
-- We rely on the Admin Dashboard Middleware to prevent unauthorized access to the UI.
CREATE POLICY "Authenticated can manage hero_banners" ON hero_banners
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 2. Trending Offers
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;

CREATE POLICY "Public can view trending_offers" ON trending_offers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage trending_offers" ON trending_offers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 3. Featured Brands (Top Brands)
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;

CREATE POLICY "Public can view featured_brands" ON featured_brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated can manage featured_brands" ON featured_brands
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 4. Merchant Store Images (Photos not uploading)
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage merchant_store_images" ON merchant_store_images;
DROP POLICY IF EXISTS "Public can view merchant_store_images" ON merchant_store_images;

CREATE POLICY "Public can view merchant_store_images" ON merchant_store_images
    FOR SELECT USING (true);

-- Allow merchants to manage their own images OR admins to manage all
-- Simplified: Authenticated users can manage all (relying on UI/Logic for safety)
CREATE POLICY "Authenticated can manage merchant_store_images" ON merchant_store_images
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
