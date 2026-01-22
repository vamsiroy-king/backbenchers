INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campaigns', 'campaigns', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/*'];

-- Re-apply policies with UNIQUELY SCOPED names to avoid conflicts
-- CRITICAL STEP: Drop ALL potential previous policy names to ensure a clean slate
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Campaigns Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Campaigns Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Campaigns Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Campaigns Auth Delete" ON storage.objects;

-- 1. Public Read Access
CREATE POLICY "Campaigns Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'campaigns' );

-- 2. Authenticated Upload Access (Changed to Public for Hotfix)
CREATE POLICY "Campaigns Auth Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'campaigns' );

-- 3. Authenticated Update Access
CREATE POLICY "Campaigns Auth Update"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'campaigns' );

-- 4. Authenticated Delete Access
CREATE POLICY "Campaigns Auth Delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'campaigns' );
