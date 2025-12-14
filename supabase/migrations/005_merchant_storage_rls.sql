-- Fix Storage RLS for Merchant Image Uploads
-- Run this in Supabase SQL Editor

-- Create storage buckets for merchant images
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-logos', 'merchant-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-covers', 'merchant-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-stores', 'merchant-stores', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-documents', 'merchant-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-payment-qr', 'merchant-payment-qr', false) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads stores" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads payment-qr" ON storage.objects;
DROP POLICY IF EXISTS "Public read logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read covers" ON storage.objects;
DROP POLICY IF EXISTS "Public read stores" ON storage.objects;

-- Create INSERT policies for all merchant buckets (authenticated users can upload)
CREATE POLICY "Allow authenticated uploads logos" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'merchant-logos');

CREATE POLICY "Allow authenticated uploads covers" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'merchant-covers');

CREATE POLICY "Allow authenticated uploads stores" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'merchant-stores');

CREATE POLICY "Allow authenticated uploads documents" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'merchant-documents');

CREATE POLICY "Allow authenticated uploads payment-qr" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'merchant-payment-qr');

-- Create SELECT policies (public buckets are readable by anyone)
CREATE POLICY "Public read logos" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'merchant-logos');

CREATE POLICY "Public read covers" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'merchant-covers');

CREATE POLICY "Public read stores" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'merchant-stores');

-- Private buckets only readable by authenticated users
CREATE POLICY "Authenticated read documents" ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'merchant-documents');

CREATE POLICY "Authenticated read payment-qr" ON storage.objects 
FOR SELECT TO authenticated 
USING (bucket_id = 'merchant-payment-qr');

-- UPDATE policies (users can update their own uploads in their folder)
CREATE POLICY "Update own logos" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'merchant-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Update own covers" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'merchant-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Update own stores" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'merchant-stores' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DELETE policies
CREATE POLICY "Delete own logos" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'merchant-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Delete own covers" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'merchant-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Delete own stores" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'merchant-stores' AND auth.uid()::text = (storage.foldername(name))[1]);
