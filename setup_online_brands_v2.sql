-- Update Online Brands Schema for robust features

-- 1. Ensure online_offers has location columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_offers' AND column_name = 'location_scope') THEN
        ALTER TABLE public.online_offers ADD COLUMN location_scope text DEFAULT 'PAN_INDIA';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_offers' AND column_name = 'location_values') THEN
        ALTER TABLE public.online_offers ADD COLUMN location_values text[] DEFAULT '{}';
    END IF;

    -- Add validation columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_offers' AND column_name = 'valid_from') THEN
        ALTER TABLE public.online_offers ADD COLUMN valid_from timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 2. Enhance Online Brands (optional but good for future)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_brands' AND column_name = 'is_trending') THEN
        ALTER TABLE public.online_brands ADD COLUMN is_trending boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'online_brands' AND column_name = 'tier') THEN
        ALTER TABLE public.online_brands ADD COLUMN tier integer DEFAULT 0; -- 0=Standard, 1=Premium, 2=Featured
    END IF;
END $$;

-- 3. Policy Verification (Ensure admins can write)
-- (Normally policies are set, just printing confirmation)
-- SELECT * FROM pg_policies WHERE tablename = 'online_brands';
