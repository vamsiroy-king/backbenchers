-- FIX RLS POLICIES FOR google_signups
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own google signup" ON google_signups;
DROP POLICY IF EXISTS "Users can insert their own google signup" ON google_signups;
DROP POLICY IF EXISTS "Admins can view all google signups" ON google_signups;

-- Create new, more permissive policies

-- Allow any authenticated user to insert (the callback inserts immediately after OAuth)
CREATE POLICY "Authenticated users can insert google signup" ON google_signups
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Allow users to view their own entry
CREATE POLICY "Users can view own google signup" ON google_signups
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to update their own entry
CREATE POLICY "Users can update own google signup" ON google_signups
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow admins full access
CREATE POLICY "Admins full access google signups" ON google_signups
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
    );

-- Also ensure the students table allows checking existence by college_email
-- (This fixes the 406 error)
DROP POLICY IF EXISTS "Allow checking college email existence" ON students;
CREATE POLICY "Allow checking college email existence" ON students
    FOR SELECT
    TO authenticated
    USING (true);
