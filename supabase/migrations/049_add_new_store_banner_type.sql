-- Migration to add 'new_store' to hero_banners banner_type check constraint
-- Original constraint: banner_type IN ('promotion', 'event', 'partner', 'announcement')

-- 1. Drop the existing check constraint
ALTER TABLE hero_banners DROP CONSTRAINT IF EXISTS hero_banners_banner_type_check;

-- 2. Add the new check constraint with 'new_store' included
ALTER TABLE hero_banners ADD CONSTRAINT hero_banners_banner_type_check 
    CHECK (banner_type IN ('promotion', 'event', 'partner', 'announcement', 'new_store'));

-- 3. Comment to confirm execution
COMMENT ON TABLE hero_banners IS 'Updated banner_type check constraint to include new_store';
