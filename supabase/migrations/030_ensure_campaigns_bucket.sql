-- Ensure campaigns bucket exists and has correct settings
INSERT INTO storage.buckets (id, name, public, avif_autodetection_enabled, file_size_limit, allowed_mime_types)
VALUES ('campaigns', 'campaigns', true, true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET 
    public = true, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/*'];

-- Re-apply policies to ensure access is correct
-- 1. Public Read Access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'campaigns' );

-- 2. Authenticated Upload Access
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'campaigns' );

-- 3. Authenticated Update Access
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'campaigns' );

-- 4. Authenticated Delete Access
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'campaigns' );
