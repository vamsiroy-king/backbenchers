-- Allow public read access to merchant-store-images bucket
-- This is critical for displaying store gallery images in the student app

-- 1. Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('merchant-store-images', 'merchant-store-images', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view merchant store images" ON storage.objects;
DROP POLICY IF EXISTS "Merchant Public Read" ON storage.objects;

-- 3. Create explicit public read policy for this bucket
CREATE POLICY "Public Read Store Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'merchant-store-images' );

-- 4. Allow authenticated users (merchants) to upload
CREATE POLICY "Merchant Upload Store Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'merchant-store-images' );

-- 5. Allow merchants to update/delete their own images (simplified for now to allow auth users)
CREATE POLICY "Merchant Update Store Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'merchant-store-images' );

CREATE POLICY "Merchant Delete Store Images"
ON storage.objects FOR DELETE
TO authenticatedand 
USING ( bucket_id = 'merchant-store-images' );
