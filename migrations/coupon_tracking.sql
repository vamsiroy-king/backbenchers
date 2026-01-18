-- ================================================================
-- COUPON TRACKING SYSTEM - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Create coupon_redemptions table for tracking reveals and redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    offer_id uuid REFERENCES public.online_offers(id) ON DELETE CASCADE,
    brand_id uuid REFERENCES public.online_brands(id) ON DELETE SET NULL,
    code_used text NOT NULL,
    
    -- Tracking timestamps
    revealed_at timestamp with time zone DEFAULT now() NOT NULL,
    copied_at timestamp with time zone,
    clicked_through_at timestamp with time zone,
    redeemed_at timestamp with time zone,
    
    -- Status: REVEALED -> COPIED -> CLICKED -> REDEEMED
    status text DEFAULT 'REVEALED' CHECK (status IN ('REVEALED', 'COPIED', 'CLICKED', 'REDEEMED', 'EXPIRED')),
    
    -- Additional tracking
    source text DEFAULT 'APP', -- APP, WEBSITE
    device_type text, -- MOBILE, DESKTOP
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Prevent duplicate reveals per student per offer (one entry per student-offer combo)
    UNIQUE(student_id, offer_id)
);

-- 2. Add tracking columns to online_offers
ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS reveal_count integer DEFAULT 0;

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS redemption_count integer DEFAULT 0;

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS terms_conditions text;

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS min_order_value integer;

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS max_discount integer;

ALTER TABLE public.online_offers 
ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT 1;

-- 3. Enable RLS on coupon_redemptions
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for coupon_redemptions

-- Students can view their own redemptions
DROP POLICY IF EXISTS "Students view own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Students view own redemptions" 
ON public.coupon_redemptions FOR SELECT 
USING (auth.uid() = student_id);

-- Authenticated users can insert (tracking reveals)
DROP POLICY IF EXISTS "Authenticated insert redemptions" ON public.coupon_redemptions;
CREATE POLICY "Authenticated insert redemptions" 
ON public.coupon_redemptions FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Authenticated users can update their own (status updates)
DROP POLICY IF EXISTS "Update own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Update own redemptions" 
ON public.coupon_redemptions FOR UPDATE 
TO authenticated
USING (auth.uid() = student_id);

-- Admin can read all (for dashboard)
DROP POLICY IF EXISTS "Admin read all redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admin read all redemptions" 
ON public.coupon_redemptions FOR SELECT 
TO authenticated
USING (true);

-- 5. Grants
GRANT ALL ON public.coupon_redemptions TO authenticated;
GRANT SELECT ON public.coupon_redemptions TO anon;

-- 6. Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_redemptions_student ON public.coupon_redemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer ON public.coupon_redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_brand ON public.coupon_redemptions(brand_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.coupon_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_revealed_at ON public.coupon_redemptions(revealed_at DESC);

-- 7. Create function to increment reveal count (called on reveal)
CREATE OR REPLACE FUNCTION increment_reveal_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.online_offers 
    SET reveal_count = COALESCE(reveal_count, 0) + 1 
    WHERE id = NEW.offer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_reveal_increment ON public.coupon_redemptions;
CREATE TRIGGER on_reveal_increment
    AFTER INSERT ON public.coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION increment_reveal_count();

-- 9. Create function to increment redemption count
CREATE OR REPLACE FUNCTION increment_redemption_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'REDEEMED' AND (OLD.status IS NULL OR OLD.status != 'REDEEMED') THEN
        UPDATE public.online_offers 
        SET redemption_count = COALESCE(redemption_count, 0) + 1 
        WHERE id = NEW.offer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for redemption
DROP TRIGGER IF EXISTS on_redemption_increment ON public.coupon_redemptions;
CREATE TRIGGER on_redemption_increment
    AFTER UPDATE ON public.coupon_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION increment_redemption_count();

-- ================================================================
-- VERIFICATION: Check tables exist
-- ================================================================
-- SELECT * FROM public.coupon_redemptions LIMIT 5;
-- SELECT reveal_count, redemption_count FROM public.online_offers LIMIT 5;
