-- =============================================
-- PHASE 1: CRITICAL RLS SECURITY FIXES
-- Run ALL of this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. FIX: pending_ratings TABLE
-- =============================================

-- Enable RLS
ALTER TABLE pending_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own pending ratings" ON pending_ratings;
DROP POLICY IF EXISTS "Students can delete own pending ratings" ON pending_ratings;
DROP POLICY IF EXISTS "Students can update own pending ratings" ON pending_ratings;
DROP POLICY IF EXISTS "Anyone can insert pending ratings" ON pending_ratings;

-- Students can view their own pending ratings
CREATE POLICY "Students can view own pending ratings" ON pending_ratings
    FOR SELECT
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Students can delete their own pending ratings (after submitting)
CREATE POLICY "Students can delete own pending ratings" ON pending_ratings
    FOR DELETE
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Students can update their own pending ratings
CREATE POLICY "Students can update own pending ratings" ON pending_ratings
    FOR UPDATE
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Any authenticated user can insert (merchants create for students)
CREATE POLICY "Anyone can insert pending ratings" ON pending_ratings
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 2. FIX: notifications TABLE
-- =============================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Students can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Users can view their own notifications (user_id matches auth.uid)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can do everything with notifications
CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admins));

-- =============================================
-- 3. FIX: merchants TABLE - Admin policies
-- =============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can update merchants" ON merchants;
DROP POLICY IF EXISTS "Admins can delete merchants" ON merchants;

-- Admins can update any merchant
CREATE POLICY "Admins can update merchants" ON merchants
    FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM admins))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));

-- Admins can delete any merchant
CREATE POLICY "Admins can delete merchants" ON merchants
    FOR DELETE
    USING (auth.uid() IN (SELECT user_id FROM admins));

-- =============================================
-- 4. FIX: offers TABLE - Admin policies
-- =============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage offers" ON offers;

-- Admins can do everything with offers
CREATE POLICY "Admins can manage offers" ON offers
    FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admins));

-- =============================================
-- 5. FIX: transactions TABLE - Admin policies
-- =============================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM admins));

-- =============================================
-- VERIFY: List all policies
-- =============================================

SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
