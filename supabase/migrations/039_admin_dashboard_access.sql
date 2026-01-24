-- =============================================
-- GRANT ADMINS GLOBAL READ ACCESS TO CORE TABLES
-- Fixes dashboard stats returning 0 due to RLS
-- =============================================

-- 1. STUDENTS Table
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students" ON students
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 2. MERCHANTS Table
DROP POLICY IF EXISTS "Admins can view all merchants" ON merchants;
CREATE POLICY "Admins can view all merchants" ON merchants
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 3. TRANSACTIONS Table
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 4. OFFERS Table
DROP POLICY IF EXISTS "Admins can view all offers" ON offers;
CREATE POLICY "Admins can view all offers" ON offers
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 5. ANALYTICS TABLES
-- Just to be safe, ensuring analytics tables also have access (already done in 019 but safe to reinforce)
DROP POLICY IF EXISTS "Admins can read daily_analytics" ON daily_analytics;
CREATE POLICY "Admins can read daily_analytics" ON daily_analytics
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));
