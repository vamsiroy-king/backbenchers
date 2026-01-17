-- FIX ONLINE BRANDS ADMIN PERMISSIONS
-- Run this in your DEV Supabase SQL Editor
-- ================================================================

-- STEP 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Public View Brands" ON public.online_brands;
DROP POLICY IF EXISTS "Admin Full Access" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin insert" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin update" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin delete" ON public.online_brands;

DROP POLICY IF EXISTS "Public View Offers" ON public.online_offers;
DROP POLICY IF EXISTS "Admin Full Access Offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin insert offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin update offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin delete offers" ON public.online_offers;

-- STEP 2: Create READ policies for everyone (students)
CREATE POLICY "Anyone can read online_brands" 
ON public.online_brands FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read online_offers" 
ON public.online_offers FOR SELECT 
USING (true);

-- STEP 3: Create WRITE policies for authenticated users (admin)
CREATE POLICY "Authenticated can insert online_brands" 
ON public.online_brands FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update online_brands" 
ON public.online_brands FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete online_brands" 
ON public.online_brands FOR DELETE 
TO authenticated
USING (true);

-- STEP 4: Create WRITE policies for online_offers
CREATE POLICY "Authenticated can insert online_offers" 
ON public.online_offers FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update online_offers" 
ON public.online_offers FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete online_offers" 
ON public.online_offers FOR DELETE 
TO authenticated
USING (true);

-- STEP 5: Grant all permissions
GRANT ALL ON public.online_brands TO authenticated;
GRANT ALL ON public.online_offers TO authenticated;
GRANT SELECT ON public.online_brands TO anon;
GRANT SELECT ON public.online_offers TO anon;

-- ================================================================
-- VERIFICATION: Test queries
-- ================================================================
-- SELECT * FROM online_brands;
-- SELECT * FROM online_offers;
