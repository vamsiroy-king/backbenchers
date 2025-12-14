-- =============================================
-- BACKBENCHERS DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. STUDENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bb_id VARCHAR(10) UNIQUE, -- BB-XXXXXX (assigned after verification)
    
    -- Personal Info
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    dob DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    
    -- Location
    college VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Profile Image (Supabase Storage path)
    profile_image_url TEXT,
    
    -- Status & Stats
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended')),
    total_savings DECIMAL(10,2) DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    
    -- Device-bound passcode (hashed)
    passcode_hash TEXT,
    device_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. MERCHANTS TABLE  
-- =============================================
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bbm_id VARCHAR(10) UNIQUE, -- BBM-XXXXXX (assigned after admin approval)
    
    -- Business Info
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    description TEXT,
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    -- Images (Supabase Storage paths)
    logo_url TEXT,
    cover_photo_url TEXT,
    
    -- Documents (Supabase Storage paths)
    gst_certificate_url TEXT,
    shop_license_url TEXT,
    
    -- Payment QR (merchant's UPI QR)
    payment_qr_url TEXT,
    
    -- Social/Contact
    website TEXT,
    instagram TEXT,
    
    -- Operating Hours (JSON)
    operating_hours JSONB,
    
    -- Status & Stats
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    rejected_reason TEXT,
    total_offers INTEGER DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Device-bound passcode
    passcode_hash TEXT,
    device_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. MERCHANT STORE IMAGES (Multiple per merchant)
-- =============================================
CREATE TABLE IF NOT EXISTS merchant_store_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. OFFERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Offer Details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'flat', 'bogo', 'freebie', 'custom')),
    
    -- Pricing (ALL stored for accuracy)
    original_price DECIMAL(10,2) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    
    -- Constraints
    min_order_value DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    
    -- Terms (stored as JSON array)
    terms JSONB DEFAULT '[]'::jsonb,
    
    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Status & Stats
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
    total_redemptions INTEGER DEFAULT 0,
    
    -- Free item (for BOGO)
    free_item_name VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    student_id UUID REFERENCES students(id),
    merchant_id UUID REFERENCES merchants(id),
    offer_id UUID REFERENCES offers(id),
    
    -- Snapshot data (denormalized for history)
    student_bb_id VARCHAR(10) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    merchant_bbm_id VARCHAR(10) NOT NULL,
    merchant_name VARCHAR(200) NOT NULL,
    offer_title VARCHAR(200) NOT NULL,
    
    -- Amount Details
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'online')),
    
    -- Timestamp
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. ADMINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. FEATURED BRANDS (Top brands on explore page)
-- =============================================
CREATE TABLE IF NOT EXISTS featured_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS: ID GENERATION
-- =============================================

-- Function to generate BB-ID for students
CREATE OR REPLACE FUNCTION generate_bb_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_id VARCHAR(10);
    exists_count INTEGER;
BEGIN
    LOOP
        new_id := 'BB-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_count FROM students WHERE bb_id = new_id;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate BBM-ID for merchants
CREATE OR REPLACE FUNCTION generate_bbm_id()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_id VARCHAR(10);
    exists_count INTEGER;
BEGIN
    LOOP
        new_id := 'BBM-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT COUNT(*) INTO exists_count FROM merchants WHERE bbm_id = new_id;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS: AUTO-UPDATE TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS students_updated_at ON students;
CREATE TRIGGER students_updated_at 
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS merchants_updated_at ON merchants;
CREATE TRIGGER merchants_updated_at 
    BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS offers_updated_at ON offers;
CREATE TRIGGER offers_updated_at 
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_store_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;

-- Students: Can read/update their own data
CREATE POLICY "Students read own" ON students
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students update own" ON students
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Students insert own" ON students
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Merchants: Can read/update their own data
CREATE POLICY "Merchants read own" ON merchants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants update own" ON merchants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Merchants insert own" ON merchants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can read approved merchants
CREATE POLICY "Public read approved merchants" ON merchants
    FOR SELECT USING (status = 'approved');

-- Offers: Anyone can read active offers
CREATE POLICY "Read active offers" ON offers
    FOR SELECT USING (status = 'active');

-- Merchants can manage their own offers
CREATE POLICY "Merchants manage own offers" ON offers
    FOR ALL USING (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

-- Store images: Public read for approved merchants
CREATE POLICY "Public read store images" ON merchant_store_images
    FOR SELECT USING (
        merchant_id IN (SELECT id FROM merchants WHERE status = 'approved')
    );

CREATE POLICY "Merchants manage store images" ON merchant_store_images
    FOR ALL USING (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

-- Transactions: Students read their own
CREATE POLICY "Students read own transactions" ON transactions
    FOR SELECT USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

-- Transactions: Merchants read their own
CREATE POLICY "Merchants read own transactions" ON transactions
    FOR SELECT USING (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

-- Transactions: Merchants can insert
CREATE POLICY "Merchants insert transactions" ON transactions
    FOR INSERT WITH CHECK (
        merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );

-- Featured brands: Public read
CREATE POLICY "Public read featured brands" ON featured_brands
    FOR SELECT USING (is_active = true);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_students_bb_id ON students(bb_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_city ON students(city);

CREATE INDEX IF NOT EXISTS idx_merchants_bbm_id ON merchants(bbm_id);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);
CREATE INDEX IF NOT EXISTS idx_merchants_location ON merchants(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_offers_merchant_id ON offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON offers(valid_until);

CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_redeemed_at ON transactions(redeemed_at);

-- =============================================
-- STORAGE BUCKETS (Run these separately in Storage settings)
-- =============================================
-- Bucket: student-profiles (Private)
-- Bucket: merchant-logos (Public)
-- Bucket: merchant-covers (Public)
-- Bucket: merchant-stores (Public)
-- Bucket: merchant-documents (Private)
-- Bucket: merchant-payment-qr (Private)

-- =============================================
-- DONE! Schema ready for Backbenchers
-- =============================================
