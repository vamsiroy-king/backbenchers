-- BACKBENCHERS: Complete Schema Fix for Online Offers
-- Run this in Supabase SQL Editor to fix "Online (0)" issue
-- =========================================================

-- STEP 1: Add missing columns to online_offers table
-- These columns are REQUIRED for location-based filtering
ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS location_scope text DEFAULT 'PAN_INDIA';

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS location_values text[] DEFAULT '{}';

-- STEP 2: Backfill existing offers with default values
UPDATE public.online_offers 
SET location_scope = 'PAN_INDIA' 
WHERE location_scope IS NULL;

UPDATE public.online_offers 
SET location_values = '{}' 
WHERE location_values IS NULL;

-- STEP 3: Drop ALL conflicting RLS policies (prevents "already exists" errors)
DROP POLICY IF EXISTS "Public View Brands" ON public.online_brands;
DROP POLICY IF EXISTS "Public View Offers" ON public.online_offers;
DROP POLICY IF EXISTS "Everyone can view online brands" ON public.online_brands;
DROP POLICY IF EXISTS "Everyone can view online offers" ON public.online_offers;
DROP POLICY IF EXISTS "Public can view online brands" ON public.online_brands;
DROP POLICY IF EXISTS "Public can view online offers" ON public.online_offers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.online_brands;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.online_offers;

-- STEP 4: Enable RLS on both tables
ALTER TABLE public.online_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_offers ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create permissive read policies (allows all users to read)
CREATE POLICY "Public View Brands" ON public.online_brands 
    FOR SELECT 
    USING (true);

CREATE POLICY "Public View Offers" ON public.online_offers 
    FOR SELECT 
    USING (true);

-- STEP 6: Grant SELECT privileges to anonymous and authenticated users
GRANT SELECT ON public.online_brands TO anon, authenticated;
GRANT SELECT ON public.online_offers TO anon, authenticated;

-- =========================================================
-- VERIFICATION: Run this query after to confirm columns exist
-- =========================================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'online_offers' AND table_schema = 'public';
--
-- Expected output should include:
--   location_scope  | text
--   location_values | ARRAY
-- =========================================================
