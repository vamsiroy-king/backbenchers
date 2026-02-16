-- Migration: 052_add_business_details.sql

-- Add address and pan_number columns to recruiters table
ALTER TABLE recruiters 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);

-- Make GST optional (it already is nullable, but let's confirm logic elsewhere)
-- We don't need to change anything for GST as it's defined as gst_number VARCHAR(20) nullable in 051.

-- Force schema reload
NOTIFY pgrst, 'reload schema';
