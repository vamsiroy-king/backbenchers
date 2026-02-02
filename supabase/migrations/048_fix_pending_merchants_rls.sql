-- =============================================
-- FIX: Enable pending_merchants access for admin dashboard
-- The previous RLS disable didn't cover this table!
-- =============================================

-- STEP 1: Disable RLS on pending_merchants table (matches other tables)
ALTER TABLE pending_merchants DISABLE ROW LEVEL SECURITY;

-- STEP 2: Also ensure these tables have RLS disabled for consistency
ALTER TABLE hero_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE trending_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verification query (run this in Supabase SQL Editor to verify):
-- SELECT COUNT(*) FROM pending_merchants WHERE status = 'pending';
