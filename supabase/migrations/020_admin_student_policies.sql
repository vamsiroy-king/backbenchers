-- =============================================
-- FIX: Allow Admins to Update Students Table
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing policy if any
DROP POLICY IF EXISTS "Admins can update students" ON students;

-- Create policy allowing admins to update any student
CREATE POLICY "Admins can update students" ON students
    FOR UPDATE
    USING (
        auth.uid() IN (SELECT user_id FROM admins)
    )
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Also allow admins to delete students
DROP POLICY IF EXISTS "Admins can delete students" ON students;
CREATE POLICY "Admins can delete students" ON students
    FOR DELETE
    USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- Ensure RLS is enabled
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Verify by selecting policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'students';
