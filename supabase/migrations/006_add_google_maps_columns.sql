-- =============================================
-- MIGRATION: Add Google Maps columns to merchants table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- Add Google Maps Link column (for "Get Directions" button)
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add Google Maps Embed column (for embedded map iframe)
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS google_maps_embed TEXT;

-- Add comment for documentation
COMMENT ON COLUMN merchants.google_maps_link IS 'Direct Google Maps link for directions';
COMMENT ON COLUMN merchants.google_maps_embed IS 'Google Maps embed iframe URL for displaying map';

-- =============================================
-- UPDATE: Set Google Maps links from latitude/longitude
-- This generates a basic Google Maps link from existing lat/lng
-- =============================================

-- Generate Google Maps links for merchants that have coordinates
UPDATE merchants 
SET google_maps_link = 'https://www.google.com/maps/search/?api=1&query=' || latitude || ',' || longitude
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND google_maps_link IS NULL;

-- Verify the changes
SELECT id, business_name, latitude, longitude, google_maps_link 
FROM merchants 
LIMIT 5;
