-- ============================================
-- MIGRATION 027: HERO BANNER AUTOMATION
-- ============================================

-- 1. Add fields to hero_banners to support merchant linkage
ALTER TABLE hero_banners 
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- 2. Function to automatically create banner when merchant is approved
CREATE OR REPLACE FUNCTION auto_create_new_merchant_banner()
RETURNS TRIGGER AS $$
DECLARE
    banner_title TEXT;
    banner_subtitle TEXT;
    banner_cta TEXT;
    banner_bg VARCHAR;
BEGIN
    -- Only proceed if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Default text logic
        banner_title := 'New Partner Alert'; 
        banner_subtitle := NEW.business_name || ' is now live on Backbenchers!';
        banner_cta := 'View Offers';
        
        -- Default premium gradient
        banner_bg := 'from-[#1a1a1a] via-[#222] to-black';

        -- Insert the banner
        INSERT INTO hero_banners (
            title,
            subtitle,
            cta_text,
            cta_link,
            image_url,
            logo_url,
            background_gradient,
            banner_type,
            coverage_type,
            city_ids,
            merchant_id,
            is_auto_generated,
            position,
            is_active
        ) VALUES (
            banner_title,
            banner_subtitle,
            banner_cta,
            '/store/' || NEW.id,
            NEW.cover_photo_url,
            NEW.logo_url,
            banner_bg,
            'new_store',
            'city_specific',
            ARRAY[NEW.city], -- Target only the merchant's city
            NEW.id,
            TRUE,
            1, -- High priority
            TRUE
        );
        
    END IF;
    return NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_merchant_approval ON merchants;
CREATE TRIGGER on_merchant_approval
    AFTER UPDATE ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_new_merchant_banner();

-- 4. Create RLS policy for Admin to update these banners (Already covered by "Admins can manage banners" in 015, but ensuring)
-- (No action needed if policy exists)
