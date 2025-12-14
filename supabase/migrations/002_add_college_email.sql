-- =============================================
-- Migration 002: Add college_email for student email linking
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- =============================================

-- Add college_email column to students table
-- This stores the verified .edu.in email linked to Google account
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS college_email VARCHAR(255) UNIQUE;

-- Create index for college_email lookup
CREATE INDEX IF NOT EXISTS idx_students_college_email ON students(college_email);

-- Update RLS to allow reading students by college_email (for duplicate check)
CREATE POLICY "Check college email exists" ON students
    FOR SELECT USING (true);

-- Comment
COMMENT ON COLUMN students.college_email IS 'Verified .edu.in email linked to Google account';
