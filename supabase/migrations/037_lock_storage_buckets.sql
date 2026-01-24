-- 🔒 SECURE STORAGE BUCKETS (Granular & Safe)
-- This approach secures specific buckets WITHOUT breaking client-side uploads.

-- ==============================================================================
-- 1. CAMPAIGNS BUCKET (Admin Only)
-- ==============================================================================
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) VALUES ('campaigns', 'campaigns', true) ON CONFLICT (id) DO NOTHING;

-- Drop insecure policies
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects; -- Drop global catch-all if exists
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Campaigns" ON storage.objects;
DROP POLICY IF EXISTS "Admins Write Campaigns" ON storage.objects;

-- Allow Public Read
CREATE POLICY "Public Read Campaigns" ON storage.objects FOR SELECT USING (bucket_id = 'campaigns');

-- Allow Admin Write (Client-Side)
CREATE POLICY "Admins Write Campaigns" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'campaigns' AND public.is_admin());

CREATE POLICY "Admins Update Campaigns" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'campaigns' AND public.is_admin());

CREATE POLICY "Admins Delete Campaigns" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'campaigns' AND public.is_admin());


-- ==============================================================================
-- 2. STUDENT PROFILES BUCKET (Owner Only)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('student-profiles', 'student-profiles', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Student Profiles Read" ON storage.objects;
DROP POLICY IF EXISTS "Student Profiles Write" ON storage.objects;

-- Read: Public (so profiles can be shown) or Authenticated? Usually public for avatar URLs.
CREATE POLICY "Student Profiles Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'student-profiles');

-- Write: Owner ONLY (Folder must match User ID)
-- Path convention: {user_id}/filename.ext
CREATE POLICY "Student Profiles Owner Write" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'student-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Student Profiles Owner Update" ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'student-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Student Profiles Owner Delete" ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'student-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ==============================================================================
-- 3. MERCHANT STORES BUCKET (Owner Only)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-stores', 'merchant-stores', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Merchant Stores Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Merchant Stores Owner Write" ON storage.objects;

CREATE POLICY "Merchant Stores Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'merchant-stores');

CREATE POLICY "Merchant Stores Owner Write" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'merchant-stores' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Merchant Stores Owner Update" ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'merchant-stores' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Merchant Stores Owner Delete" ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'merchant-stores' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- REPEAT FOR OTHER MERCHANT BUCKETS (logos, covers)
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-logos', 'merchant-logos', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Merchant Logos Read" ON storage.objects FOR SELECT USING (bucket_id = 'merchant-logos');
CREATE POLICY "Merchant Logos Write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'merchant-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Merchant Logos Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'merchant-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Merchant Logos Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'merchant-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-covers', 'merchant-covers', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Merchant Covers Read" ON storage.objects FOR SELECT USING (bucket_id = 'merchant-covers');
CREATE POLICY "Merchant Covers Write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'merchant-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Merchant Covers Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'merchant-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Merchant Covers Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'merchant-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
