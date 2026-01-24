-- =============================================
-- FIX ADMIN RLS AND SCHEMA FOR TRENDING/TOP BRANDS
-- =============================================

-- 1. TRENDING OFFERS: Add support for Online Offers
ALTER TABLE trending_offers 
ADD COLUMN IF NOT EXISTS online_offer_id UUID REFERENCES online_offers(id) ON DELETE CASCADE;

-- Update constraint to ensure either offer_id OR online_offer_id is present
ALTER TABLE trending_offers ALTER COLUMN offer_id DROP NOT NULL;

-- 2. FEATURED BRANDS: Add support for Online Brands
ALTER TABLE featured_brands
ADD COLUMN IF NOT EXISTS online_brand_id UUID REFERENCES online_brands(id) ON DELETE CASCADE;

-- Make merchant_id nullable
ALTER TABLE featured_brands ALTER COLUMN merchant_id DROP NOT NULL;

-- 3. ENABLE RLS (Ensure it's on)
ALTER TABLE trending_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR TRENDING OFFERS
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can manage trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can insert trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can update trending_offers" ON trending_offers;
DROP POLICY IF EXISTS "Admins can delete trending_offers" ON trending_offers;

-- Public Read
CREATE POLICY "Public can view trending_offers" ON trending_offers
    FOR SELECT USING (true);

-- Admin Full Access
CREATE POLICY "Admins can insert trending_offers" ON trending_offers
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can update trending_offers" ON trending_offers
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    )
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can delete trending_offers" ON trending_offers
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 5. RLS POLICIES FOR FEATURED BRANDS
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can manage featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can insert featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can update featured_brands" ON featured_brands;
DROP POLICY IF EXISTS "Admins can delete featured_brands" ON featured_brands;

-- Public Read
CREATE POLICY "Public can view featured_brands" ON featured_brands
    FOR SELECT USING (is_active = true);

-- Admin Full Access
CREATE POLICY "Admins can insert featured_brands" ON featured_brands
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can update featured_brands" ON featured_brands
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    )
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can delete featured_brands" ON featured_brands
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );
