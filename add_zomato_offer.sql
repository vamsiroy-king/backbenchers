-- =====================================================
-- ADD PAN_INDIA OFFERS TO ZOMATO BRAND
-- Run this in Supabase SQL Editor (DEV Database)
-- =====================================================

-- First, let's see what brands exist
SELECT id, name, category FROM online_brands;

-- Check what offers exist and their location_scope
SELECT o.id, o.title, o.location_scope, o.location_values, b.name as brand_name
FROM online_offers o
JOIN online_brands b ON o.brand_id = b.id;

-- Update any offers that don't have location_scope to default to PAN_INDIA
UPDATE online_offers 
SET location_scope = 'PAN_INDIA', location_values = '[]'::jsonb
WHERE location_scope IS NULL;

-- Add an offer for Zomato if it doesn't have one
-- First get Zomato's ID
DO $$
DECLARE
    zomato_id uuid;
BEGIN
    SELECT id INTO zomato_id FROM online_brands WHERE name ILIKE '%zomato%' LIMIT 1;
    
    IF zomato_id IS NOT NULL THEN
        -- Check if Zomato has any offers
        IF NOT EXISTS (SELECT 1 FROM online_offers WHERE brand_id = zomato_id) THEN
            -- Add a PAN_INDIA offer for Zomato
            INSERT INTO online_offers (
                brand_id, 
                title, 
                description, 
                code, 
                link, 
                location_scope, 
                location_values, 
                is_active
            ) VALUES (
                zomato_id,
                'Students Get 50% OFF',
                'Use this code for 50% off your first 3 orders. Valid for verified students only.',
                'STUDENT50',
                'https://www.zomato.com',
                'PAN_INDIA',
                '[]'::jsonb,
                true
            );
            RAISE NOTICE 'Added PAN_INDIA offer for Zomato';
        ELSE
            -- Update existing offers to be PAN_INDIA
            UPDATE online_offers 
            SET location_scope = 'PAN_INDIA', location_values = '[]'::jsonb
            WHERE brand_id = zomato_id AND (location_scope IS NULL OR location_scope != 'PAN_INDIA');
            RAISE NOTICE 'Updated Zomato offers to PAN_INDIA';
        END IF;
    ELSE
        RAISE NOTICE 'Zomato brand not found';
    END IF;
END $$;

-- Verify the changes
SELECT o.id, o.title, o.location_scope, o.location_values, b.name as brand_name, o.is_active
FROM online_offers o
JOIN online_brands b ON o.brand_id = b.id
ORDER BY b.name;
