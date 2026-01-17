-- Fix missing city data for Fashion offers
-- This script finds online offers for 'Fashion' brands that have scope 'CITY' or 'CITIES' but NO location values
-- and updates them to have 'Mysuru' as the location.

UPDATE online_offers
SET 
    location_values = ARRAY['Mysuru'],
    location_scope = 'CITIES' -- Standardize to CITIES
FROM online_brands
WHERE online_offers.brand_id = online_brands.id
  AND online_brands.category ILIKE '%Fashion%'
  AND (online_offers.location_scope ILIKE 'CIT%' OR online_offers.location_scope IS NULL)
  AND (online_offers.location_values IS NULL OR online_offers.location_values = '{}');

-- Verification
SELECT 
    b.name as brand, 
    b.category, 
    o.title as offer, 
    o.location_scope, 
    o.location_values 
FROM online_offers o
JOIN online_brands b ON o.brand_id = b.id
WHERE b.category ILIKE '%Fashion%' AND o.location_scope = 'CITIES';
