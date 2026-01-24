-- 🛡️ ADVANCED SECURITY CLEANUP & HARDENING
-- This script fixes the specific "Security Advisor" warnings and removes dangerous old policies.

-- ==========================================
-- 1. FIX FUNCTION SEARCH PATHS (Prevents Hijacking)
-- ==========================================
-- We enforce that these functions only look in the 'public' schema
ALTER FUNCTION public.increment_reveal_count SET search_path = public;
ALTER FUNCTION public.create_notification SET search_path = public;
ALTER FUNCTION public.increment_redemption_count SET search_path = public;
ALTER FUNCTION public.is_admin SET search_path = public;
ALTER FUNCTION public.calculate_trending_scores SET search_path = public;
ALTER FUNCTION public.update_merchant_rating_stats SET search_path = public;
ALTER FUNCTION public.update_single_merchant_trending_score SET search_path = public;
ALTER FUNCTION public.increment_merchant_redemptions SET search_path = public;
ALTER FUNCTION public.sync_merchant_user_id SET search_path = public;
ALTER FUNCTION public.can_student_redeem_offer SET search_path = public;
ALTER FUNCTION public.get_merchant_rating_breakdown SET search_path = public;
ALTER FUNCTION public.can_redeem_offer SET search_path = public;
ALTER FUNCTION public.increment_offer_usage SET search_path = public;
ALTER FUNCTION public.calculate_trending_offers SET search_path = public;
ALTER FUNCTION public.get_new_merchants SET search_path = public;
ALTER FUNCTION public.auto_create_new_merchant_banner SET search_path = public;
ALTER FUNCTION public.notify_merchant_suspended SET search_path = public;
ALTER FUNCTION public.notify_student_suspended SET search_path = public;
ALTER FUNCTION public.get_admin_dashboard_stats SET search_path = public;
ALTER FUNCTION public.get_revenue_by_date_range SET search_path = public;
ALTER FUNCTION public.get_top_merchants SET search_path = public;
ALTER FUNCTION public.get_city_distribution SET search_path = public;
ALTER FUNCTION public.get_category_performance SET search_path = public;
ALTER FUNCTION public.notify_new_offer SET search_path = public;
ALTER FUNCTION public.notify_student_welcome SET search_path = public;
ALTER FUNCTION public.notify_redemption SET search_path = public;
ALTER FUNCTION public.notify_merchant_approved SET search_path = public;
ALTER FUNCTION public.update_updated_at SET search_path = public;
ALTER FUNCTION public.generate_bb_id SET search_path = public;
ALTER FUNCTION public.generate_bbm_id SET search_path = public;
ALTER FUNCTION public.update_university_student_count SET search_path = public;

-- ==========================================
-- 2. FIX VIEW SECURITY
-- ==========================================
-- Force the view to run with the permissions of the USER (Invoker), not the Creator (Definer)
ALTER VIEW public.universities_with_stats SET (security_invoker = true);

-- ==========================================
-- 3. PURGE DANGEROUS PERMISSIVE POLICIES
-- ==========================================
-- These policies were flagged as "Always True" (allowing anyone to delete/edit).
-- We rely on the STRICT policies created in the previous step.

-- Merchants Table Cleanup
DROP POLICY IF EXISTS "Allow delete merchants" ON public.merchants;
DROP POLICY IF EXISTS "Allow updates on merchants" ON public.merchants;

-- Offers Table Cleanup
DROP POLICY IF EXISTS "Allow delete offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated users insert offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated users update offers" ON public.offers;

-- Online Brands Cleanup (Locking these down to Admin only)
DROP POLICY IF EXISTS "Authenticated can delete online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Authenticated can insert online_brands" ON public.online_brands;
DROP POLICY IF EXISTS "Authenticated can update online_brands" ON public.online_brands;
-- Re-add Strict Admin Control for Online Brands
ALTER TABLE IF EXISTS public.online_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view online brands" ON public.online_brands FOR SELECT USING (true);
CREATE POLICY "Admins manage online brands" ON public.online_brands FOR ALL USING (public.is_admin());

-- Online Offers Cleanup
DROP POLICY IF EXISTS "Authenticated can delete online_offers" ON public.online_offers;
DROP POLICY IF EXISTS "Authenticated can insert online_offers" ON public.online_offers;
DROP POLICY IF EXISTS "Authenticated can update online_offers" ON public.online_offers;
ALTER TABLE IF EXISTS public.online_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view online offers" ON public.online_offers FOR SELECT USING (true);
CREATE POLICY "Admins manage online offers" ON public.online_offers FOR ALL USING (public.is_admin());

-- Hero Banners Cleanup
DROP POLICY IF EXISTS "Admins can manage banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Hero banners full access" ON public.hero_banners;
-- Re-assert correct policy
CREATE POLICY "Admins manage hero banners" ON public.hero_banners FOR ALL USING (public.is_admin());
CREATE POLICY "Public view hero banners" ON public.hero_banners FOR SELECT USING (true);


-- Site Settings Cleanup
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.site_settings;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.site_settings;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.site_settings;

-- Transactions Cleanup (Sensitive Money Data)
DROP POLICY IF EXISTS "Allow delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow update transactions" ON public.transactions;

-- Top Brands & Trending Offers Cleanup
DROP POLICY IF EXISTS "Allow all top_brands" ON public.top_brands;
DROP POLICY IF EXISTS "Admin manage top_brands" ON public.top_brands;
DROP POLICY IF EXISTS "Allow all trending_offers" ON public.trending_offers;
DROP POLICY IF EXISTS "Admin manage trending_offers" ON public.trending_offers;
-- Strict Admin Control
ALTER TABLE IF EXISTS public.top_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trending_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage top_brands" ON public.top_brands FOR ALL USING (public.is_admin());
CREATE POLICY "Public view top_brands" ON public.top_brands FOR SELECT USING (true);
CREATE POLICY "Admins manage trending_offers" ON public.trending_offers FOR ALL USING (public.is_admin());
CREATE POLICY "Public view trending_offers" ON public.trending_offers FOR SELECT USING (true);

-- Waitlist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Public insert waitlist" ON public.waitlist FOR INSERT WITH CHECK (true); -- This one is actually okay for waitlists
