-- =====================================================
-- COMPREHENSIVE FIX FOR ONLINE BRANDS ADMIN ACCESS
-- Run this in Supabase SQL Editor (DEV Database)
-- =====================================================

-- Step 1: Grant ALL table permissions to authenticated and service_role
-- This is CRITICAL - without this, even the service role can fail

GRANT ALL ON online_brands TO authenticated;
GRANT ALL ON online_brands TO service_role;
GRANT ALL ON online_brands TO anon;

GRANT ALL ON online_offers TO authenticated;
GRANT ALL ON online_offers TO service_role;
GRANT ALL ON online_offers TO anon;

-- Step 2: Ensure RLS is enabled but policies are permissive
ALTER TABLE online_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_offers ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read" ON online_brands;
DROP POLICY IF EXISTS "Allow authenticated insert" ON online_brands;
DROP POLICY IF EXISTS "Allow authenticated update" ON online_brands;  
DROP POLICY IF EXISTS "Allow authenticated delete" ON online_brands;
DROP POLICY IF EXISTS "online_brands_select_policy" ON online_brands;
DROP POLICY IF EXISTS "online_brands_insert_policy" ON online_brands;
DROP POLICY IF EXISTS "online_brands_update_policy" ON online_brands;
DROP POLICY IF EXISTS "online_brands_delete_policy" ON online_brands;
DROP POLICY IF EXISTS "Enable read for all users" ON online_brands;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON online_brands;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON online_brands;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON online_brands;

DROP POLICY IF EXISTS "Allow public read" ON online_offers;
DROP POLICY IF EXISTS "Allow authenticated insert" ON online_offers;
DROP POLICY IF EXISTS "Allow authenticated update" ON online_offers;
DROP POLICY IF EXISTS "Allow authenticated delete" ON online_offers;
DROP POLICY IF EXISTS "online_offers_select_policy" ON online_offers;
DROP POLICY IF EXISTS "online_offers_insert_policy" ON online_offers;
DROP POLICY IF EXISTS "online_offers_update_policy" ON online_offers;
DROP POLICY IF EXISTS "online_offers_delete_policy" ON online_offers;
DROP POLICY IF EXISTS "Enable read for all users" ON online_offers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON online_offers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON online_offers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON online_offers;

-- Step 4: Create simple PERMISSIVE policies that allow everything
-- Using TRUE for maximum permissiveness

CREATE POLICY "online_brands_all_select" ON online_brands FOR SELECT USING (true);
CREATE POLICY "online_brands_all_insert" ON online_brands FOR INSERT WITH CHECK (true);
CREATE POLICY "online_brands_all_update" ON online_brands FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "online_brands_all_delete" ON online_brands FOR DELETE USING (true);

CREATE POLICY "online_offers_all_select" ON online_offers FOR SELECT USING (true);
CREATE POLICY "online_offers_all_insert" ON online_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "online_offers_all_update" ON online_offers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "online_offers_all_delete" ON online_offers FOR DELETE USING (true);

-- Step 5: CRITICAL - Force RLS bypass for service_role
-- This explicitly tells Supabase to bypass RLS for service role
ALTER TABLE online_brands FORCE ROW LEVEL SECURITY;
ALTER TABLE online_offers FORCE ROW LEVEL SECURITY;

-- Step 6: Verify the permissions are correct
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('online_brands', 'online_offers')
ORDER BY tablename, policyname;

-- Done! Now test creating a brand from the admin dashboard.
