-- Site Settings Table for Admin Content Visibility Controls
-- This enables realtime sync between admin and student apps

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can READ settings (for student app to read visibility)
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read site_settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Policy: Authenticated users can INSERT settings
DROP POLICY IF EXISTS "Authenticated can insert site_settings" ON public.site_settings;
CREATE POLICY "Authenticated can insert site_settings"
ON public.site_settings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can UPDATE settings
DROP POLICY IF EXISTS "Authenticated can update site_settings" ON public.site_settings;
CREATE POLICY "Authenticated can update site_settings"
ON public.site_settings
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert default content visibility settings
INSERT INTO public.site_settings (key, value)
VALUES (
    'content_visibility',
    '{"showTopBrands": true, "showHeroBanners": true, "showTrending": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Grant access to roles
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;

-- Enable Realtime for this table (so student app updates instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
