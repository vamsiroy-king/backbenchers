-- =============================================
-- HUSTLE SECTION — Student Earning Opportunities
-- Migration: 051_hustle_schema.sql
-- Creates: recruiters, opportunity_categories, opportunities,
--          hustle_profiles, opportunity_applications, recruiter_payments
-- =============================================

-- =============================================
-- 1. RECRUITERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bbr_id VARCHAR(12) UNIQUE,  -- BBR-XXXXXX

    -- Company Info
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('startup', 'agency', 'corporate', 'freelancer', 'ngo')),
    industry VARCHAR(100) NOT NULL,
    website TEXT,
    linkedin TEXT,
    logo_url TEXT,
    description TEXT,

    -- Location
    city VARCHAR(100),
    state VARCHAR(100),

    -- Verification
    gst_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
    rejected_reason TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Plan & Billing
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    total_postings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generate BBR-ID
CREATE OR REPLACE FUNCTION generate_bbr_id()
RETURNS VARCHAR(12) AS $$
DECLARE
    new_id VARCHAR(12);
    exists_count INTEGER;
BEGIN
    LOOP
        new_id := 'BBR-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_count FROM recruiters WHERE bbr_id = new_id;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-assign BBR-ID on insert
CREATE OR REPLACE FUNCTION assign_bbr_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bbr_id IS NULL THEN
        NEW.bbr_id := generate_bbr_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recruiters_assign_bbr_id ON recruiters;
CREATE TRIGGER recruiters_assign_bbr_id
    BEFORE INSERT ON recruiters
    FOR EACH ROW EXECUTE FUNCTION assign_bbr_id();

-- Trigger: Auto-update timestamps
DROP TRIGGER IF EXISTS recruiters_updated_at ON recruiters;
CREATE TRIGGER recruiters_updated_at
    BEFORE UPDATE ON recruiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- 2. OPPORTUNITY CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS opportunity_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    description VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_categories_order ON opportunity_categories(display_order);


-- =============================================
-- 3. OPPORTUNITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,
    category_id UUID REFERENCES opportunity_categories(id),

    -- Job Details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('freelance', 'internship', 'part_time', 'full_time', 'contract')),
    work_mode VARCHAR(20) NOT NULL CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
    experience_level VARCHAR(20) DEFAULT 'any' CHECK (experience_level IN ('beginner', 'intermediate', 'expert', 'any')),

    -- Compensation
    compensation VARCHAR(100),
    compensation_type VARCHAR(20) DEFAULT 'paid' CHECK (compensation_type IN ('paid', 'unpaid', 'stipend', 'commission')),

    -- Requirements
    skills_required JSONB DEFAULT '[]'::jsonb,
    vacancies INTEGER DEFAULT 1,
    duration VARCHAR(100),

    -- Location
    city VARCHAR(100),
    is_pan_india BOOLEAN DEFAULT false,

    -- Terms & Apply
    terms TEXT,
    apply_method VARCHAR(20) DEFAULT 'in_app' CHECK (apply_method IN ('in_app', 'whatsapp', 'email', 'external')),
    apply_link TEXT,

    -- Status & Moderation
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'paused', 'expired', 'rejected', 'filled')),
    rejected_reason TEXT,
    total_applications INTEGER DEFAULT 0,

    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_recruiter ON opportunities(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_city ON opportunities(city);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_work_mode ON opportunities(work_mode);

-- Trigger: Auto-update timestamps
DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
CREATE TRIGGER opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- 4. HUSTLE PROFILES TABLE (Student side)
-- =============================================
CREATE TABLE IF NOT EXISTS hustle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,

    -- Profile
    headline VARCHAR(150),
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),

    -- Portfolio
    portfolio_links JSONB DEFAULT '[]'::jsonb,  -- [{title, url, type}]
    resume_url TEXT,

    -- Preferences
    is_available BOOLEAN DEFAULT true,
    preferred_work_mode VARCHAR(20) DEFAULT 'remote' CHECK (preferred_work_mode IN ('remote', 'onsite', 'hybrid', 'any')),
    preferred_types JSONB DEFAULT '[]'::jsonb,  -- ["freelance", "internship"]

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hustle_profiles_student ON hustle_profiles(student_id);

-- Trigger: Auto-update timestamps
DROP TRIGGER IF EXISTS hustle_profiles_updated_at ON hustle_profiles;
CREATE TRIGGER hustle_profiles_updated_at
    BEFORE UPDATE ON hustle_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- 5. OPPORTUNITY APPLICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS opportunity_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    hustle_profile_id UUID REFERENCES hustle_profiles(id),

    -- Application
    cover_note TEXT,
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'hired', 'rejected')),
    recruiter_notes TEXT,

    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate applications
    UNIQUE(opportunity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON opportunity_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON opportunity_applications(status);

-- Trigger: Auto-update timestamps
DROP TRIGGER IF EXISTS applications_updated_at ON opportunity_applications;
CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON opportunity_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Auto-increment total_applications on opportunities
CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE opportunities SET total_applications = total_applications + 1
    WHERE id = NEW.opportunity_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_increment_count ON opportunity_applications;
CREATE TRIGGER applications_increment_count
    AFTER INSERT ON opportunity_applications
    FOR EACH ROW EXECUTE FUNCTION increment_application_count();


-- =============================================
-- 6. RECRUITER PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recruiter_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,

    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    plan VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'manual' CHECK (payment_method IN ('razorpay', 'upi', 'manual')),
    payment_id TEXT,  -- External payment reference
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_payments_recruiter ON recruiter_payments(recruiter_id);


-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hustle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_payments ENABLE ROW LEVEL SECURITY;

-- RECRUITERS: Read/update own data
CREATE POLICY "Recruiters read own" ON recruiters
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recruiters update own" ON recruiters
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Recruiters insert own" ON recruiters
    FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Public can read verified recruiters (for student-facing display)
CREATE POLICY "Public read verified recruiters" ON recruiters
    FOR SELECT USING (status = 'verified');

-- OPPORTUNITY CATEGORIES: Public read
CREATE POLICY "Public read opportunity categories" ON opportunity_categories
    FOR SELECT USING (is_active = true);
-- Admins manage categories
CREATE POLICY "Admins manage opportunity categories" ON opportunity_categories
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));

-- OPPORTUNITIES: Public read active ones
CREATE POLICY "Public read active opportunities" ON opportunities
    FOR SELECT USING (status = 'active');
-- Recruiters manage their own
CREATE POLICY "Recruiters manage own opportunities" ON opportunities
    FOR ALL USING (recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid()));

-- HUSTLE PROFILES: Students manage their own
CREATE POLICY "Students manage own hustle profile" ON hustle_profiles
    FOR ALL USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
-- Recruiters can read profiles (for viewing applicants)
CREATE POLICY "Recruiters read hustle profiles" ON hustle_profiles
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM recruiters WHERE status = 'verified')
    );

-- APPLICATIONS: Students manage their own
CREATE POLICY "Students manage own applications" ON opportunity_applications
    FOR ALL USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
-- Recruiters can read applications for their opportunities
CREATE POLICY "Recruiters read applications" ON opportunity_applications
    FOR SELECT USING (
        opportunity_id IN (SELECT id FROM opportunities WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid()))
    );
-- Recruiters can update application status
CREATE POLICY "Recruiters update applications" ON opportunity_applications
    FOR UPDATE USING (
        opportunity_id IN (SELECT id FROM opportunities WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid()))
    );

-- PAYMENTS: Recruiters read their own
CREATE POLICY "Recruiters read own payments" ON recruiter_payments
    FOR SELECT USING (recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid()));


-- =============================================
-- STORAGE BUCKET for Recruiter Logos & Resumes
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruiter-logos', 'recruiter-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('hustle-resumes', 'hustle-resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for recruiter logos
CREATE POLICY "Public read recruiter logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'recruiter-logos');

-- Students can upload/read their own resumes
CREATE POLICY "Students manage own resumes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'hustle-resumes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );


-- =============================================
-- SEED: Opportunity Categories
-- =============================================
INSERT INTO opportunity_categories (name, icon, description, display_order) VALUES
    ('Videography', '🎥', 'iPhone/camera videography for agencies & brands', 1),
    ('Video Editing', '🎬', 'Premiere Pro, Final Cut, DaVinci Resolve', 2),
    ('Graphic Design', '🎨', 'Photoshop, Figma, Canva, branding', 3),
    ('Web Development', '💻', 'React, Next.js, WordPress, full-stack', 4),
    ('App Development', '📱', 'iOS, Android, Flutter, React Native', 5),
    ('Content Writing', '✍️', 'Blogs, copywriting, SEO content', 6),
    ('Social Media', '📢', 'Instagram, YouTube, content management', 7),
    ('Photography', '📸', 'Product, event, portrait photography', 8),
    ('Tutoring', '📚', 'Academic tutoring, test prep, mentoring', 9),
    ('Data Entry', '📊', 'Data processing, research, admin tasks', 10),
    ('Marketing', '📣', 'Digital marketing, SEO, paid ads', 11),
    ('Sales', '🤝', 'Field sales, tele-calling, lead generation', 12),
    ('Customer Support', '🎧', 'Chat support, call center, helpdesk', 13),
    ('Event Management', '🎪', 'College fests, corporate events, coordination', 14),
    ('Others', '💼', 'Other opportunities', 15)
ON CONFLICT (name) DO UPDATE SET
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;


-- =============================================
-- SEED: Demo Opportunities (for localhost testing)
-- =============================================
-- These require a recruiter to exist, so we'll create demo data via the app.
-- The seed below creates placeholder opportunities if a recruiter already exists.


-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE recruiters;

-- Force schema reload
NOTIFY pgrst, 'reload schema';

-- =============================================
-- DONE! Hustle schema ready.
-- =============================================
