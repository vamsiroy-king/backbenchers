-- Add missing columns to hero_banners table to match service payload
ALTER TABLE hero_banners 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- Ensure RLS allows these new columns (implicit in "ALL" policies, but good practice)
-- Validating policy existence from setup
-- (No extra policy needed as long as "Admins can manage banners" exists)
