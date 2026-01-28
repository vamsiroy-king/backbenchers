-- =============================================
-- Update Categories with Combinational Names + Add New Categories
-- Run this after 048_create_categories_table.sql
-- =============================================

-- First, update existing categories with combinational names
UPDATE categories SET 
    name = 'Food & Dining', 
    tagline = 'Dine for less',
    updated_at = NOW()
WHERE name = 'Food';

UPDATE categories SET 
    name = 'Fashion & Apparel', 
    tagline = 'Style on budget',
    updated_at = NOW()
WHERE name = 'Fashion';

UPDATE categories SET 
    name = 'Fitness & Wellness', 
    tagline = 'Train smarter',
    updated_at = NOW()
WHERE name = 'Fitness';

UPDATE categories SET 
    name = 'Beauty & Skincare', 
    tagline = 'Glow up for less',
    updated_at = NOW()
WHERE name = 'Beauty';

-- Now insert new categories
INSERT INTO categories (name, tagline, image_url, gradient_from, gradient_to, icon, display_order, is_active)
VALUES 
    ('Groceries & Essentials', 'Save on daily needs', '/assets/categories/groceries_ultra.png', 'green-100', 'green-200', '🛒', 5, true),
    ('Electronics & Gadgets', 'Tech deals for students', '/assets/categories/electronics_ultra.png', 'indigo-100', 'indigo-200', '📱', 6, true),
    ('Entertainment & Events', 'Fun for less', '/assets/categories/entertainment_ultra.png', 'yellow-100', 'yellow-200', '🎬', 7, true),
    ('Travel & Transport', 'Explore on budget', '/assets/categories/travel_ultra.png', 'cyan-100', 'cyan-200', '✈️', 8, true),
    ('Education & Books', 'Learn for less', '/assets/categories/education_ultra.png', 'lime-100', 'lime-200', '📚', 9, true),
    ('Health & Pharmacy', 'Wellness savings', '/assets/categories/health_ultra.png', 'red-100', 'red-200', '💊', 10, true)
ON CONFLICT (name) DO UPDATE SET
    tagline = EXCLUDED.tagline,
    gradient_from = EXCLUDED.gradient_from,
    gradient_to = EXCLUDED.gradient_to,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Force schema reload
NOTIFY pgrst, 'reload schema';