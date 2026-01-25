-- =============================================
-- EMERGENCY RLS FIX - RUN THIS IMMEDIATELY
-- This uses auth.uid() IS NOT NULL which is more reliable
-- =============================================

-- STEP 1: Disable RLS completely on all tables first (to clear any blocking)
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies (use multiple names to catch any existing ones)
-- Hero Banners
DROP POLICY IF EXISTS "Public can view hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Authenticated can manage hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Public can view active hero_banners" ON hero_banners;
DROP POLICY IF EXISTS "Enable read access for all users" ON hero_banners;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON hero_banners;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON hero_banners;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON hero_banners;
DROP POLICY IF EXISTS "hero_banners_select_policy" ON hero_banners;
DROP POLICY IF EXISTS "hero_banners_insert_policy" ON hero_banners;
DROP POLICY IF EXISTS "hero_banners_update_policy" ON hero_banners;
DROP POLICY IF EXISTS "hero_banners_delete_policy" ON hero_banners;

-- Featured Brands
DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Authenticated can manage featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Enable read access for all users" ON featured_brands;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON featured_brands;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON featured_brands;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON featured_brands;

-- Trending Offers
DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Authenticated can manage trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Enable read access for all users" ON trending_offers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON trending_offers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON trending_offers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON trending_offers;

-- Online Brands
DROP POLICY IF EXISTS "Public can view online_brands" ON online_brands;
DROP POLICY IF EXISTS "Authenticated can manage online_brands" ON online_brands;

-- Online Offers
DROP POLICY IF EXISTS "Public can view online_offers" ON online_offers;
DROP POLICY IF EXISTS "Authenticated can manage online_offers" ON online_offers;

-- Merchants
DROP POLICY IF EXISTS "Public can view merchants" ON merchants;
DROP POLICY IF EXISTS "Authenticated can manage merchants" ON merchants;
DROP POLICY IF EXISTS "Public can view active merchants" ON merchants;

-- Offers
DROP POLICY IF EXISTS "Public can view offers" ON offers;
DROP POLICY IF EXISTS "Authenticated can manage offers" ON offers;
DROP POLICY IF EXISTS "Public can view active offers" ON offers;

-- Merchant Store Images
DROP POLICY IF EXISTS "Public can view merchant_store_images" ON merchant_store_images;
DROP POLICY IF EXISTS "Authenticated can manage merchant_store_images" ON merchant_store_images;

-- STEP 3: Re-enable RLS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create new PERMISSIVE policies using auth.uid() IS NOT NULL
-- This is more reliable than auth.role() = 'authenticated'

-- Hero Banners
CREATE POLICY "allow_select_hero_banners" ON hero_banners FOR SELECT USING (true);
CREATE POLICY "allow_insert_hero_banners" ON hero_banners FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_hero_banners" ON hero_banners FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_hero_banners" ON hero_banners FOR DELETE USING (auth.uid() IS NOT NULL);

-- Featured Brands
CREATE POLICY "allow_select_featured_brands" ON featured_brands FOR SELECT USING (true);
CREATE POLICY "allow_insert_featured_brands" ON featured_brands FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_featured_brands" ON featured_brands FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_featured_brands" ON featured_brands FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trending Offers
CREATE POLICY "allow_select_trending_offers" ON trending_offers FOR SELECT USING (true);
CREATE POLICY "allow_insert_trending_offers" ON trending_offers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_trending_offers" ON trending_offers FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_trending_offers" ON trending_offers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Online Brands
CREATE POLICY "allow_select_online_brands" ON online_brands FOR SELECT USING (true);
CREATE POLICY "allow_insert_online_brands" ON online_brands FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_online_brands" ON online_brands FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_online_brands" ON online_brands FOR DELETE USING (auth.uid() IS NOT NULL);

-- Online Offers
CREATE POLICY "allow_select_online_offers" ON online_offers FOR SELECT USING (true);
CREATE POLICY "allow_insert_online_offers" ON online_offers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_online_offers" ON online_offers FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_online_offers" ON online_offers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Merchants
CREATE POLICY "allow_select_merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "allow_insert_merchants" ON merchants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_merchants" ON merchants FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_merchants" ON merchants FOR DELETE USING (auth.uid() IS NOT NULL);

-- Offers
CREATE POLICY "allow_select_offers" ON offers FOR SELECT USING (true);
CREATE POLICY "allow_insert_offers" ON offers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_offers" ON offers FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_offers" ON offers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Merchant Store Images
CREATE POLICY "allow_select_merchant_store_images" ON merchant_store_images FOR SELECT USING (true);
CREATE POLICY "allow_insert_merchant_store_images" ON merchant_store_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_merchant_store_images" ON merchant_store_images FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_merchant_store_images" ON merchant_store_images FOR DELETE USING (auth.uid() IS NOT NULL);
