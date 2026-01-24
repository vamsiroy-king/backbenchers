-- ================================================================
-- BACKBENCHERS PRODUCTION SQL - RUN THIS IN REAL SUPABASE
-- Complete SQL for Online Brands & Offers Feature
-- Run each section in order in the Supabase SQL Editor
-- ================================================================

-- ================================================================
-- SECTION 1: CREATE TABLES (Skip if tables already exist)
-- ================================================================

-- 1A. Create Online Brands Table
CREATE TABLE IF NOT EXISTS public.online_brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  logo_url text,
  cover_image_url text,
  description text,
  website_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1B. Create Online Offers Table
CREATE TABLE IF NOT EXISTS public.online_offers (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.online_brands(id) on delete cascade not null,
  title text not null,
  description text,
  code text,
  link text,
  expiry_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ================================================================
-- SECTION 2: ADD REQUIRED COLUMNS (Safe - uses IF NOT EXISTS)
-- ================================================================

-- 2A. Add location columns to online_offers
ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS location_scope text DEFAULT 'PAN_INDIA';

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS location_values text[] DEFAULT '{}';

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS valid_from timestamp with time zone DEFAULT now();

-- 2B. Add app deep link columns to online_brands
ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS app_url TEXT;

ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS prefer_app BOOLEAN DEFAULT FALSE;

ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS playstore_url TEXT;

ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS appstore_url TEXT;

-- 2C. Add trending/tier columns (optional but useful)
ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;

ALTER TABLE public.online_brands 
ADD COLUMN IF NOT EXISTS tier integer DEFAULT 0;

-- ================================================================
-- SECTION 3: BACKFILL DEFAULT VALUES
-- ================================================================

UPDATE public.online_offers 
SET location_scope = 'PAN_INDIA' 
WHERE location_scope IS NULL;

UPDATE public.online_offers 
SET location_values = '{}' 
WHERE location_values IS NULL;

-- ================================================================
-- SECTION 4: FIX RLS POLICIES (Drop old, create new)
-- ================================================================

-- 4A. Drop ALL potentially conflicting policies
DROP POLICY IF EXISTS "Public View Brands" ON public.online_brands;
DROP POLICY IF EXISTS "Public View Offers" ON public.online_offers;
DROP POLICY IF EXISTS "Everyone can view online brands" ON public.online_brands;
DROP POLICY IF EXISTS "Everyone can view online offers" ON public.online_offers;
DROP POLICY IF EXISTS "Public can view online brands" ON public.online_brands;
DROP POLICY IF EXISTS "Public can view online offers" ON public.online_offers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.online_brands;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.online_offers;
DROP POLICY IF EXISTS "Admin Full Access" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin insert" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin update" ON public.online_brands;
DROP POLICY IF EXISTS "Allow admin delete" ON public.online_brands;
DROP POLICY IF EXISTS "Admin Full Access Offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin insert offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin update offers" ON public.online_offers;
DROP POLICY IF EXISTS "Allow admin delete offers" ON public.online_offers;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.online_brands;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.online_offers;
DROP POLICY IF EXISTS "Anyone can read online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Anyone can read online_offers" ON public.online_offers;
DROP POLICY IF EXISTS "Authenticated can insert online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Authenticated can update online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Authenticated can delete online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Authenticated can insert online_offers" ON public.online_offers;
DROP POLICY IF EXISTS "Authenticated can update online_offers" ON public.online_offers;
DROP POLICY IF EXISTS "Authenticated can delete online_offers" ON public.online_offers;

-- 4B. Enable RLS
ALTER TABLE public.online_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_offers ENABLE ROW LEVEL SECURITY;

-- 4C. Create READ policies (everyone can read)
CREATE POLICY "Anyone can read online_brands" 
ON public.online_brands FOR SELECT 
USING (true);

CREATE POLICY "Anyone can read online_offers" 
ON public.online_offers FOR SELECT 
USING (true);

-- 4D. WRITE POLICIES (Secure: STRICTLY Service Role / Admin API only)
-- We DO NOT create any INSERT/UPDATE/DELETE policies for 'authenticated'.
-- This ensures students cannot modify data via the browser console.
-- Admin operations must use the Service Role Key (server-side) to bypass RLS.


-- ================================================================
-- SECTION 5: GRANT PERMISSIONS
-- ================================================================

GRANT ALL ON public.online_brands TO authenticated;
GRANT ALL ON public.online_offers TO authenticated;
GRANT SELECT ON public.online_brands TO anon;
GRANT SELECT ON public.online_offers TO anon;

-- ================================================================
-- SECTION 6: ADD COLUMN COMMENTS (Documentation)
-- ================================================================

COMMENT ON COLUMN online_brands.app_url IS 'Mobile app deep link URL (e.g., zomato:// or https://link.zomato.com/)';
COMMENT ON COLUMN online_brands.prefer_app IS 'If true, redirect to app first; if false, use website';
COMMENT ON COLUMN online_brands.playstore_url IS 'Google Play Store URL for Android users';
COMMENT ON COLUMN online_brands.appstore_url IS 'Apple App Store URL for iOS users';

-- ================================================================
-- VERIFICATION QUERIES (Run these to confirm everything works)
-- ================================================================

-- Check online_brands columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'online_brands' AND table_schema = 'public';

-- Check online_offers columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'online_offers' AND table_schema = 'public';

-- Check RLS policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE tablename IN ('online_brands', 'online_offers');

-- Test data fetch:
-- SELECT * FROM online_brands LIMIT 5;
-- SELECT * FROM online_offers LIMIT 5;

-- ================================================================
-- DONE! All online brand features should now work in production.
-- ================================================================
