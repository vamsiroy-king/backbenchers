-- Migration: 054_admin_fix_final.sql
-- Run this in Supabase SQL Editor to guarantee Admin Access and Dashboard Visibility

-- 1. Ensure current user is in admins table (Idempotent)
INSERT INTO public.admins (user_id, name, email, role)
SELECT auth.uid(), 'Super Admin', auth.email(), 'super_admin'
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (email) DO UPDATE 
SET role = 'super_admin'; 

-- 2. Ensure RLS is enabled on recruiters
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

-- 3. Safely recreate "View" policy
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view all recruiters" ON recruiters;
END $$;

CREATE POLICY "Admins can view all recruiters" ON recruiters
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );
    
-- 4. Safely recreate "Update" policy
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can update recruiters" ON recruiters;
END $$;

CREATE POLICY "Admins can update recruiters" ON recruiters
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 5. Ensure Storage Bucket exists (Safe Insert)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true) 
ON CONFLICT (id) DO NOTHING;

-- 6. Ensure Storage Policy exists
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
END $$;

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-logos' 
        AND auth.role() = 'authenticated'
    );
