-- Create a public bucket for marketing campaigns (hero banners, etc.)
INSERT INTO storage.buckets (id, name, public, avif_autodetection_enabled, file_size_limit, allowed_mime_types)
VALUES ('campaigns', 'campaigns', true, true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to campaigns bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'campaigns' );

-- Policy: Allow authenticated users (admins) to upload to campaigns bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'campaigns' );

-- Policy: Allow authenticated users to update/delete their uploads (or all if admin)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'campaigns' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'campaigns' );
