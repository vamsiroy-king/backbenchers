-- =============================================
-- 1. Create Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    tagline VARCHAR(100),
    image_url TEXT,
    gradient_from VARCHAR(50), -- Tailwind color (e.g. 'orange-100')
    gradient_to VARCHAR(50),   -- Tailwind color (e.g. 'orange-200')
    icon VARCHAR(10), -- Emoji or Icon name
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for sorting
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- =============================================
-- 2. Enable RLS
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active categories
CREATE POLICY "Public can read active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM admins)
    );

-- =============================================
-- 3. Storage Bucket for Category Images
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public Read
CREATE POLICY "Public Access Category Images" ON storage.objects
    FOR SELECT USING (bucket_id = 'category-images');

-- Storage Policy: Admin Upload/Delete
CREATE POLICY "Admins Manage Category Images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'category-images' 
        AND auth.uid() IN (SELECT user_id FROM admins)
    );

-- =============================================
-- 4. Seed Initial Data (Matches Hardcoded)
-- =============================================
INSERT INTO categories (name, tagline, image_url, gradient_from, gradient_to, icon, display_order)
VALUES 
('Food', 'Dine for less', '/assets/categories/food_ultra.png', 'orange-100', 'orange-200', '🍕', 1),
('Fashion', 'Style on budget', '/assets/categories/fashion_ultra.png', 'pink-100', 'pink-200', '👗', 2),
('Fitness', 'Train smarter', '/assets/categories/fitness_ultra.png', 'blue-100', 'blue-200', '💪', 3),
('Beauty', 'Glow up', '/assets/categories/beauty_ultra.png', 'purple-100', 'purple-200', '✨', 4)
ON CONFLICT (name) DO UPDATE SET
    tagline = EXCLUDED.tagline,
    display_order = EXCLUDED.display_order;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
