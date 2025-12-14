-- RLS Policy Update: Allow users to check if their email exists (for login flow)
-- Run this in Supabase SQL Editor

-- Allow users to read student records by email match (for checking existing accounts)
CREATE POLICY "Students read by email" ON students
    FOR SELECT USING (auth.email() = email);

-- Also allow check by college_email
CREATE POLICY "Students read by college email" ON students
    FOR SELECT USING (auth.email() = college_email);
