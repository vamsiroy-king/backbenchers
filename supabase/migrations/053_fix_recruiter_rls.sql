-- Migration: 053_fix_recruiter_rls.sql

-- 1. Enable RLS on recruiters table
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Recruiters can view own profile" ON recruiters;
DROP POLICY IF EXISTS "Recruiters can update own profile" ON recruiters;
DROP POLICY IF EXISTS "Recruiters can insert own profile" ON recruiters;
DROP POLICY IF EXISTS "Admins can view all recruiters" ON recruiters;
DROP POLICY IF EXISTS "Admins can update recruiters" ON recruiters;

-- 3. Recruiter Policies (Owner Access)
CREATE POLICY "Recruiters can view own profile" ON recruiters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own profile" ON recruiters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can insert own profile" ON recruiters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Admin Policies (Full Access)
CREATE POLICY "Admins can view all recruiters" ON recruiters
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

CREATE POLICY "Admins can update recruiters" ON recruiters
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- 5. Create Storage Bucket for Company Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true) 
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies for company-logos
DROP POLICY IF EXISTS "Public Access to Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;

-- Public Read
CREATE POLICY "Public Access to Logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-logos');

-- Authenticated Upload (Anyone signed in can upload a logo)
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-logos' 
        AND auth.role() = 'authenticated'
    );

-- Update/Delete (Owners only - roughly approximating by path or auth)
-- For simplicity, allowing detailed update if needed, but usually insert is enough for upload.
-- We'll allow update for now based on auth.
CREATE POLICY "Users can update own logos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'company-logos' 
        AND auth.uid() = owner
    );

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
