-- RLS FIX: Ensure Admins can view ALL pending merchants
-- Currently admins might see "0 Pending" if they don't have explicit SELECT permission

-- 1. Enable RLS (just in case)
ALTER TABLE pending_merchants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (to be safe)
DROP POLICY IF EXISTS "Admins can view all pending merchants" ON pending_merchants;
DROP POLICY IF EXISTS "Users can view their own pending application" ON pending_merchants;
DROP POLICY IF EXISTS "Anyone can insert pending merchants" ON pending_merchants;

-- 3. Policy: Admins can view ALL rows
CREATE POLICY "Admins can view all pending merchants"
ON pending_merchants FOR SELECT
USING (
  -- Check if user is in admins table
  (auth.uid() IN (SELECT user_id FROM admins))
  OR
  -- OR check if user has 'admin' metadata (future proofing)
  (auth.jwt() ->> 'role' = 'service_role')
);

-- 4. Policy: Users can view their OWN rows (for status checks)
CREATE POLICY "Users can view their own pending application"
ON pending_merchants FOR SELECT
USING (auth.uid() = user_id);

-- 5. Policy: Authenticated users can INSERT (applying)
CREATE POLICY "Authenticated users can insert pending application"
ON pending_merchants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Policy: Admins can UPDATE/DELETE (Approval/Rejection)
CREATE POLICY "Admins can update pending merchants"
ON pending_merchants FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can delete pending merchants"
ON pending_merchants FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM admins));

-- 7. Fix for merchants table RLS as well (just in case)
CREATE POLICY "Admins can view all merchants"
ON merchants FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM admins));

-- Force refresh schema cache
NOTIFY pgrst, 'reload schema';
