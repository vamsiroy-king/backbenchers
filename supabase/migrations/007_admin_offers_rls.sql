-- =============================================
-- NUCLEAR FIX: DISABLE RLS ON OFFERS TABLE
-- Run this in Supabase SQL Editor
-- =============================================

-- Option 1: Completely disable RLS on offers table
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;

-- =============================================
-- DONE! RLS is now disabled on offers table
-- Admin can create/edit/delete any offer
-- =============================================

-- NOTE: To re-enable RLS later with proper policies, run:
-- ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
