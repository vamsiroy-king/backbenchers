-- Add redemption_type column to online_offers table
-- This determines how students redeem the offer:
-- 'CODE_REVEAL' - Show hidden code, reveal on click, auto-copy, then redirect
-- 'DIRECT_REDIRECT' - Click to open partner site directly (affiliate link)

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS redemption_type text DEFAULT 'CODE_REVEAL';

-- Add check constraint for valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'online_offers_redemption_type_check'
    ) THEN
        ALTER TABLE public.online_offers 
        ADD CONSTRAINT online_offers_redemption_type_check 
        CHECK (redemption_type IN ('CODE_REVEAL', 'DIRECT_REDIRECT'));
    END IF;
END $$;

-- Update existing offers to have CODE_REVEAL as default (if they have a code)
UPDATE public.online_offers 
SET redemption_type = 'CODE_REVEAL' 
WHERE redemption_type IS NULL AND code IS NOT NULL;

-- Update offers without code to DIRECT_REDIRECT
UPDATE public.online_offers 
SET redemption_type = 'DIRECT_REDIRECT' 
WHERE redemption_type IS NULL AND (code IS NULL OR code = '');
