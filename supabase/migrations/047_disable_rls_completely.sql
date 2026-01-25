-- =============================================
-- ABSOLUTE NUCLEAR FIX - COMPLETELY OPEN POLICIES
-- This bypasses ALL authentication checks
-- Run this to confirm RLS is the issue
-- =============================================

-- STEP 1: DISABLE RLS ON ALL TABLES
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;

-- That's it! With RLS disabled, there are NO restrictions.
-- If errors STILL occur after this, the problem is NOT RLS.
-- 
-- If you want to re-enable with open policies later, use:
-- ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "open_all" ON hero_banners FOR ALL USING (true) WITH CHECK (true);
