-- =============================================
-- NUCLEAR RLS FIX: Fixes ALL Admin Dashboard Permissions
-- Covers: Merchants, Offers, Trending, Brands, Banners
-- =============================================

-- 1. MERCHANTS (Critical for joins)
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active merchants" ON merchants;
DROP POLICY IF EXISTS "Authenticated can manage merchants" ON merchants;
-- Allow public to view ALL merchants (needed for Admin joins) or at least approved
CREATE POLICY "Public can view merchants" ON merchants FOR SELECT USING (true);
-- Allow authenticated (Admins/Merchants) to manage
CREATE POLICY "Authenticated can manage merchants" ON merchants FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. OFFERS (Critical for joins)
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active offers" ON offers;
DROP POLICY IF EXISTS "Authenticated can manage offers" ON offers;
CREATE POLICY "Public can view offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage offers" ON offers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. ONLINE OFFERS (Online Partner Service)
ALTER TABLE online_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view online_offers" ON online_offers;
DROP POLICY IF EXISTS "Authenticated can manage online_offers" ON online_offers;
CREATE POLICY "Public can view online_offers" ON online_offers FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage online_offers" ON online_offers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. TRENDING OFFERS (Fixes 'Selection not working')
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Authenticated can manage trending_offers" ON trending_offers;
CREATE POLICY "Public can view trending_offers" ON trending_offers FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage trending_offers" ON trending_offers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. FEATURED BRANDS (Top Brands)
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Authenticated can manage featured_brands" ON featured_brands;
CREATE POLICY "Public can view featured_brands" ON featured_brands FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage featured_brands" ON featured_brands FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. HERO BANNERS
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Authenticated can manage hero_banners" ON hero_banners;
CREATE POLICY "Public can view hero_banners" ON hero_banners FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage hero_banners" ON hero_banners FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. ONLINE BRANDS
ALTER TABLE online_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view online_brands" ON online_brands;
DROP POLICY IF EXISTS "Authenticated can manage online_brands" ON online_brands;
CREATE POLICY "Public can view online_brands" ON online_brands FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage online_brands" ON online_brands FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 8. MERCHANT STORE IMAGES
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view merchant_store_images" ON merchant_store_images;
DROP POLICY IF EXISTS "Authenticated can manage merchant_store_images" ON merchant_store_images;
CREATE POLICY "Public can view merchant_store_images" ON merchant_store_images FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage merchant_store_images" ON merchant_store_images FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
