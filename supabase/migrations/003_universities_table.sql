-- =============================================
-- Migration 003: Universities Table
-- Universities are tied to specific CITIES, not states
-- Run this in Supabase SQL Editor
-- =============================================

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- University Info
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(20), -- e.g., "AU" for Alliance University
    
    -- Location (city-specific)
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Email domain for verification (e.g., "alliance.edu.in")
    email_domain VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    total_students INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one university name per city
CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_name_city ON universities(name, city);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_state ON universities(state);
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(is_active);

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Public can read active universities
CREATE POLICY "Public read active universities" ON universities
    FOR SELECT USING (is_active = true);

-- =============================================
-- SEED DATA: Add first universities
-- =============================================

-- Alliance University - Bengaluru, Karnataka
INSERT INTO universities (name, short_name, city, state, email_domain)
VALUES ('Alliance University', 'AU', 'Bengaluru', 'Karnataka', 'alliance.edu.in')
ON CONFLICT (name, city) DO NOTHING;

-- Add more as needed:
-- Example: KLU - Vijayawada, Andhra Pradesh
-- INSERT INTO universities (name, short_name, city, state, email_domain)
-- VALUES ('KL University', 'KLU', 'Vijayawada', 'Andhra Pradesh', 'kluniversity.in')
-- ON CONFLICT (name, city) DO NOTHING;

-- =============================================
-- Update students table to reference university
-- =============================================
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

-- Create index for university lookup
CREATE INDEX IF NOT EXISTS idx_students_university_id ON students(university_id);

-- =============================================
-- Trigger to update university student count
-- =============================================
CREATE OR REPLACE FUNCTION update_university_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.university_id IS NOT NULL THEN
        UPDATE universities SET total_students = total_students + 1 
        WHERE id = NEW.university_id;
    ELSIF TG_OP = 'DELETE' AND OLD.university_id IS NOT NULL THEN
        UPDATE universities SET total_students = total_students - 1 
        WHERE id = OLD.university_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.university_id != OLD.university_id THEN
        IF OLD.university_id IS NOT NULL THEN
            UPDATE universities SET total_students = total_students - 1 
            WHERE id = OLD.university_id;
        END IF;
        IF NEW.university_id IS NOT NULL THEN
            UPDATE universities SET total_students = total_students + 1 
            WHERE id = NEW.university_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_university_count ON students;
CREATE TRIGGER students_university_count
    AFTER INSERT OR DELETE OR UPDATE OF university_id ON students
    FOR EACH ROW EXECUTE FUNCTION update_university_student_count();

-- =============================================
-- View: Get universities with student counts
-- =============================================
CREATE OR REPLACE VIEW universities_with_stats AS
SELECT 
    u.*,
    (SELECT COUNT(*) FROM students s WHERE s.university_id = u.id AND s.status = 'verified') as verified_students
FROM universities u
WHERE u.is_active = true;

-- =============================================
-- DONE! Universities table ready
-- =============================================
-- To add a new university:
-- INSERT INTO universities (name, short_name, city, state, email_domain)
-- VALUES ('University Name', 'SHORT', 'City', 'State', 'domain.edu.in');
