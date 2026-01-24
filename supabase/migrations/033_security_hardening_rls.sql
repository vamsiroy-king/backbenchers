-- 🔒 FINAL SECURITY LOCKDOWN SCRIPT (Fixed & Verified)

-- 1. Enable RLS (The "Lock") on ALL tables
-- We use IF EXISTS to avoid errors if a table name is slightly different
DO $$ 
BEGIN 
    EXECUTE 'ALTER TABLE IF EXISTS public.merchants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.pending_merchants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.hero_banners ENABLE ROW LEVEL SECURITY';
END $$;

-- 2. Define "Admins" Check
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Strict Access Policies (Corrected Column Names)

-- MERCHANTS: Everyone can view 'approved' merchants (Schema uses 'approved', not 'verified')
DROP POLICY IF EXISTS "Public can view verified merchants" ON public.merchants;
CREATE POLICY "Public can view approved merchants" ON public.merchants FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchants;
CREATE POLICY "Merchants can update own profile" ON public.merchants FOR UPDATE USING (auth.uid() = id);

-- OFFERS: Everyone can view 'active' offers (Schema uses 'status', not 'is_active')
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Merchants manage own offers" ON public.offers;
CREATE POLICY "Merchants manage own offers" ON public.offers FOR ALL USING (merchant_id = auth.uid());

-- ADMINS: Full Control
DROP POLICY IF EXISTS "Admins full access merchants" ON public.merchants;
CREATE POLICY "Admins full access merchants" ON public.merchants FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access offers" ON public.offers;
CREATE POLICY "Admins full access offers" ON public.offers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view admins" ON public.admins;
CREATE POLICY "Admins view admins" ON public.admins FOR SELECT USING (public.is_admin());

-- SITE SETTINGS
DROP POLICY IF EXISTS "Admins update settings" ON public.site_settings;
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE USING (public.is_admin());
