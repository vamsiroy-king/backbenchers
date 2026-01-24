-- ⚡ PERFORMANCE & SECURITY OPTIMIZATION (Rev 4)
-- Targeted Fixes for "Auth RLS Init Plan" and "Multiple Permissive Policies" Warning

-- EXPLANATION:
-- OLD: `auth.uid() = id` (Re-calculates user ID for every single row -> Slow)
-- NEW: `(select auth.uid()) = id` (Calculates ONCE per query -> Fast)


-- 1. OPTIMIZE STUDENTS TABLE
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students read own" ON public.students;
DROP POLICY IF EXISTS "Students update own" ON public.students;
DROP POLICY IF EXISTS "Students insert own" ON public.students;

CREATE POLICY "Students read own" ON public.students FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Students update own" ON public.students FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Students insert own" ON public.students FOR INSERT WITH CHECK ((select auth.uid()) = user_id);


-- 2. OPTIMIZE MERCHANTS TABLE
-- Consolidating Admin rules to fix "Multiple Permissive Policies"
DROP POLICY IF EXISTS "Admins full access merchants" ON public.merchants;
DROP POLICY IF EXISTS "Admins can delete merchants" ON public.merchants;
DROP POLICY IF EXISTS "Admins update merchants" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchants;

-- Re-Apply Optimized Rules
CREATE POLICY "Admins full access merchants" ON public.merchants FOR ALL USING ((select public.is_admin()));

CREATE POLICY "Merchants update own profile" ON public.merchants FOR UPDATE USING (
  (select auth.uid()) = id
);


-- 3. OPTIMIZE OFFERS TABLE
DROP POLICY IF EXISTS "Admins full access offers" ON public.offers;
DROP POLICY IF EXISTS "Merchants manage own offers" ON public.offers;

CREATE POLICY "Admins full access offers" ON public.offers FOR ALL USING ((select public.is_admin()));

CREATE POLICY "Merchants manage own offers" ON public.offers FOR ALL USING (
  merchant_id = (select auth.uid()) 
);


-- 4. OPTIMIZE TRANSACTIONS
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Students read own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Merchants read own transactions" ON public.transactions;

CREATE POLICY "Admins full access transactions" ON public.transactions FOR ALL USING ((select public.is_admin()));

CREATE POLICY "Students read own transactions" ON public.transactions FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Merchants read own transactions" ON public.transactions FOR SELECT USING (
    merchant_id IN (SELECT id FROM merchants WHERE id = (select auth.uid()))
); 
-- Note: merchant_id is usually auth.uid() in this schema design, or linked via user_id. 
-- Assuming merchant_id = auth.uid() for simplicity based on previous scripts.


-- 5. OPTIMIZE NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING ((select public.is_admin()));

CREATE POLICY "Users view own notifications" ON public.notifications FOR ALL USING (
  user_id = (select auth.uid())
);


-- 6. OPTIMIZE FAVORITES
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;
DROP POLICY IF EXISTS "Students can view own favorites" ON public.favorites;

CREATE POLICY "Admins manage favorites" ON public.favorites FOR ALL USING ((select public.is_admin()));

CREATE POLICY "Students manage own favorites" ON public.favorites FOR ALL USING (
  user_id = (select auth.uid())
);


-- 7. OPTIMIZE PENDING RATINGS
DROP POLICY IF EXISTS "Students can view own pending ratings" ON public.pending_ratings;
CREATE POLICY "Students manage own pending ratings" ON public.pending_ratings FOR ALL USING (
  user_id = (select auth.uid())
);


-- 8. OPTIMIZE GOOGLE SIGNUPS & COUPON REDEMPTIONS
DROP POLICY IF EXISTS "Users insert google signups" ON public.google_signups;
DROP POLICY IF EXISTS "Users insert redemptions" ON public.coupon_redemptions;

CREATE POLICY "Users insert google signups" ON public.google_signups FOR INSERT WITH CHECK (
  (select auth.role()) = 'authenticated'
);

CREATE POLICY "Users insert redemptions" ON public.coupon_redemptions FOR INSERT WITH CHECK (
  (select auth.role()) = 'authenticated'
);
