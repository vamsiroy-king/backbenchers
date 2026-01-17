-- BACKBENCHERS DEV DATABASE SETUP
-- Run this in your DEV Supabase SQL Editor to set up online offers
-- ================================================================

-- STEP 1: Create online_brands table if not exists
CREATE TABLE IF NOT EXISTS public.online_brands (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    logo_url text,
    website text,
    category text DEFAULT 'Store',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- STEP 2: Create online_offers table if not exists
CREATE TABLE IF NOT EXISTS public.online_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid REFERENCES public.online_brands(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    code text,
    link text,
    location_scope text DEFAULT 'PAN_INDIA',
    location_values text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- STEP 3: Enable RLS
ALTER TABLE public.online_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_offers ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create permissive RLS policies
DROP POLICY IF EXISTS "Public View Brands" ON public.online_brands;
DROP POLICY IF EXISTS "Public View Offers" ON public.online_offers;

CREATE POLICY "Public View Brands" ON public.online_brands FOR SELECT USING (true);
CREATE POLICY "Public View Offers" ON public.online_offers FOR SELECT USING (true);

-- STEP 5: Grant access
GRANT SELECT ON public.online_brands TO anon, authenticated;
GRANT SELECT ON public.online_offers TO anon, authenticated;

-- STEP 6: Insert sample online brands
INSERT INTO public.online_brands (name, logo_url, category, is_active) VALUES
    ('Spotify', 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', 'Music', true),
    ('Netflix', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', 'Entertainment', true),
    ('Amazon', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'Shopping', true),
    ('Swiggy', 'https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg', 'Food Delivery', true)
ON CONFLICT DO NOTHING;

-- STEP 7: Insert sample online offers
INSERT INTO public.online_offers (brand_id, title, code, link, location_scope, is_active)
SELECT 
    ob.id, 
    'Student Special - 50% OFF',
    'STUDENT50',
    'https://www.spotify.com/student',
    'PAN_INDIA',
    true
FROM public.online_brands ob WHERE ob.name = 'Spotify'
ON CONFLICT DO NOTHING;

INSERT INTO public.online_offers (brand_id, title, code, link, location_scope, is_active)
SELECT 
    ob.id, 
    '3 Months Free for Students',
    'NFLXSTUDENT',
    'https://www.netflix.com/student',
    'PAN_INDIA',
    true
FROM public.online_brands ob WHERE ob.name = 'Netflix'
ON CONFLICT DO NOTHING;

INSERT INTO public.online_offers (brand_id, title, code, link, location_scope, is_active)
SELECT 
    ob.id, 
    'Prime Student - 6 Months Free',
    'AMAZONSTUDENT',
    'https://www.amazon.in/primestudent',
    'PAN_INDIA',
    true
FROM public.online_brands ob WHERE ob.name = 'Amazon'
ON CONFLICT DO NOTHING;

INSERT INTO public.online_offers (brand_id, title, code, link, location_scope, is_active)
SELECT 
    ob.id, 
    '60% OFF First 5 Orders',
    'SWIGGY60',
    'https://www.swiggy.com',
    'PAN_INDIA',
    true
FROM public.online_brands ob WHERE ob.name = 'Swiggy'
ON CONFLICT DO NOTHING;

-- ================================================================
-- VERIFICATION: Run these queries to confirm setup
-- ================================================================
-- SELECT * FROM online_brands;
-- SELECT * FROM online_offers;
