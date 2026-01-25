-- =============================================
-- FINAL FIX: COMPREHENSIVE RLS REPAIR
-- Covers: Trending, Top Brands, Hero Banners, and Merchant Images
-- Usage: Run this in Supabase SQL Editor
-- =============================================

-- 1. MERCHANT STORE IMAGES (Fixes missing photos on approval)
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view merchant_store_images" ON merchant_store_images;
DROP POLICY IF EXISTS "Admins can manage merchant_store_images" ON merchant_store_images;
DROP POLICY IF EXISTS "Merchants can manage own images" ON merchant_store_images;
DROP POLICY IF EXISTS "Authenticated can manage merchant_store_images" ON merchant_store_images;

CREATE POLICY "Public can view merchant_store_images" ON merchant_store_images
    FOR SELECT USING (true);

-- Allow ANY authenticated user (Admin performing approval) to insert/manage images
CREATE POLICY "Authenticated can manage merchant_store_images" ON merchant_store_images
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 2. TRENDING OFFERS (Fixes 'Failed to save' / 'Selection not working')
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can manage trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Authenticated can manage trending_offers" ON trending_offers;

CREATE POLICY "Public can view trending_offers" ON trending_offers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage trending_offers" ON trending_offers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 3. FEATURED BRANDS (Top Brands - Fixes 'Error saving')
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can manage featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Authenticated can manage featured_brands" ON featured_brands;

CREATE POLICY "Public can view featured_brands" ON featured_brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated can manage featured_brands" ON featured_brands
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- 4. HERO BANNERS (Fixes 'Failed to save banner')
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Admins can manage hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Authenticated can manage hero_banners" ON hero_banners;

CREATE POLICY "Public can view active hero_banners" ON hero_banners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated can manage hero_banners" ON hero_banners
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. ONLINE BRANDS (Fixes editing online brands)
ALTER TABLE online_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view online_brands" ON online_brands;
DROP POLICY IF EXISTS "Admins can manage online_brands" ON online_brands;
DROP POLICY IF EXISTS "Authenticated can manage online_brands" ON online_brands;

CREATE POLICY "Public can view online_brands" ON online_brands
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage online_brands" ON online_brands
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
