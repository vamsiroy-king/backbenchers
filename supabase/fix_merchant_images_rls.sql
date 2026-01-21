-- Allow public read access to merchant store images table
-- This is necessary for displaying store gallery images to students
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view merchant store images" ON merchant_store_images;

CREATE POLICY "Public can view merchant store images"
    ON merchant_store_images
    FOR SELECT
    USING (true);
