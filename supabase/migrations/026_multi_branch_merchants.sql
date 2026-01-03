-- =============================================
-- MULTI-BRANCH MERCHANT SYSTEM
-- Migration 026: Add Brands and Outlets Structure
-- =============================================

-- =============================================
-- 1. BRANDS TABLE (Parent Company / Business)
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    
    -- Classification
    brand_type VARCHAR(50) NOT NULL DEFAULT 'local',
    -- Options: 'national_chain', 'regional_chain', 'local', 'franchise'
    
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    
    -- Corporate Contact (for chains)
    corporate_email VARCHAR(255),
    corporate_phone VARCHAR(20),
    website VARCHAR(255),
    instagram VARCHAR(255),
    
    -- Verification
    verification_status VARCHAR(50) DEFAULT 'pending',
    -- Options: 'pending', 'email_verified', 'document_verified', 'admin_verified', 'rejected'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    -- Owner (for local/regional brands - links to merchants table user)
    owner_user_id UUID REFERENCES auth.users(id),
    
    -- Settings
    allow_outlet_offers BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    total_outlets INTEGER DEFAULT 0,
    total_offers INTEGER DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. OUTLETS TABLE (Individual Stores/Branches)
-- =============================================
CREATE TABLE IF NOT EXISTS outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,  -- e.g., "Domino's - Koramangala"
    outlet_code VARCHAR(50),     -- Internal reference like "KOR-001"
    
    -- Location
    address TEXT NOT NULL,
    area VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Google Maps (optional)
    google_maps_url TEXT,
    google_place_id VARCHAR(255),
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    whatsapp VARCHAR(20),
    
    -- Manager (for outlet-level access)
    manager_name VARCHAR(255),
    manager_phone VARCHAR(20),
    manager_user_id UUID REFERENCES auth.users(id),
    
    -- Images
    cover_image_url TEXT,
    
    -- Operating Hours (JSON for flexibility)
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "22:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "22:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "22:00", "closed": false},
        "thursday": {"open": "09:00", "close": "22:00", "closed": false},
        "friday": {"open": "09:00", "close": "22:00", "closed": false},
        "saturday": {"open": "09:00", "close": "22:00", "closed": false},
        "sunday": {"open": "09:00", "close": "22:00", "closed": false}
    }'::jsonb,
    
    -- Stats
    total_redemptions INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. OUTLET IMAGES (Multiple per outlet)
-- =============================================
CREATE TABLE IF NOT EXISTS outlet_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. BRAND VERIFICATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS brand_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Verification Method
    method VARCHAR(50) NOT NULL,
    -- Options: 'email_domain', 'gstin', 'document', 'manual_admin'
    
    -- For email domain verification
    corporate_domain VARCHAR(255),
    verification_email VARCHAR(255),
    email_otp_hash TEXT,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- For GSTIN verification
    gstin VARCHAR(20),
    gstin_verified BOOLEAN DEFAULT false,
    gstin_business_name VARCHAR(255),
    
    -- For document verification
    document_type VARCHAR(50),  -- 'trademark', 'incorporation_cert', 'gst_certificate'
    document_url TEXT,
    document_verified BOOLEAN DEFAULT false,
    document_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Admin notes
    admin_notes TEXT,
    verified_by_admin UUID REFERENCES auth.users(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- Options: 'pending', 'verified', 'rejected'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. UPDATE OFFERS TABLE (Add brand & outlet support)
-- =============================================
ALTER TABLE offers ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_scope VARCHAR(20) DEFAULT 'merchant_specific';
-- Options: 'brand_wide', 'outlet_specific', 'merchant_specific' (legacy)

-- =============================================
-- 6. UPDATE TRANSACTIONS TABLE (Add outlet reference)
-- =============================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS outlet_name VARCHAR(255);

-- =============================================
-- 7. LINK EXISTING MERCHANTS TO BRANDS
-- =============================================
-- Add brand_id to merchants table for linking
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_single_outlet BOOLEAN DEFAULT true;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate slug from brand name
CREATE OR REPLACE FUNCTION generate_brand_slug(brand_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    final_slug VARCHAR;
    counter INTEGER := 0;
BEGIN
    base_slug := LOWER(REGEXP_REPLACE(brand_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM brands WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to update outlet count on brand
CREATE OR REPLACE FUNCTION update_brand_outlet_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE brands SET total_outlets = total_outlets + 1 WHERE id = NEW.brand_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE brands SET total_outlets = total_outlets - 1 WHERE id = OLD.brand_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for outlet count
DROP TRIGGER IF EXISTS update_brand_outlet_count_trigger ON outlets;
CREATE TRIGGER update_brand_outlet_count_trigger
    AFTER INSERT OR DELETE ON outlets
    FOR EACH ROW EXECUTE FUNCTION update_brand_outlet_count();

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps
DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at 
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS outlets_updated_at ON outlets;
CREATE TRIGGER outlets_updated_at 
    BEFORE UPDATE ON outlets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlet_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_verifications ENABLE ROW LEVEL SECURITY;

-- Brands: Public can read verified/active brands
CREATE POLICY "Public read active brands" ON brands
    FOR SELECT USING (is_active = true AND verification_status IN ('email_verified', 'document_verified', 'admin_verified'));

-- Brands: Owners can manage their own brands
CREATE POLICY "Owners manage own brands" ON brands
    FOR ALL USING (auth.uid() = owner_user_id);

-- Outlets: Public can read active outlets of verified brands
CREATE POLICY "Public read active outlets" ON outlets
    FOR SELECT USING (
        is_active = true AND
        brand_id IN (SELECT id FROM brands WHERE is_active = true AND verification_status IN ('email_verified', 'document_verified', 'admin_verified'))
    );

-- Outlets: Brand owners can manage outlets
CREATE POLICY "Brand owners manage outlets" ON outlets
    FOR ALL USING (
        brand_id IN (SELECT id FROM brands WHERE owner_user_id = auth.uid())
    );

-- Outlets: Outlet managers can read/update their outlet
CREATE POLICY "Outlet managers manage own outlet" ON outlets
    FOR ALL USING (manager_user_id = auth.uid());

-- Outlet images: Public read
CREATE POLICY "Public read outlet images" ON outlet_images
    FOR SELECT USING (
        outlet_id IN (SELECT id FROM outlets WHERE is_active = true)
    );

-- Outlet images: Brand owners can manage
CREATE POLICY "Brand owners manage outlet images" ON outlet_images
    FOR ALL USING (
        outlet_id IN (
            SELECT o.id FROM outlets o 
            JOIN brands b ON o.brand_id = b.id 
            WHERE b.owner_user_id = auth.uid()
        )
    );

-- Brand verifications: Only brand owners can view
CREATE POLICY "Brand owners view verifications" ON brand_verifications
    FOR SELECT USING (
        brand_id IN (SELECT id FROM brands WHERE owner_user_id = auth.uid())
    );

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands(brand_type);
CREATE INDEX IF NOT EXISTS idx_brands_verification ON brands(verification_status);
CREATE INDEX IF NOT EXISTS idx_brands_owner ON brands(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_outlets_brand ON outlets(brand_id);
CREATE INDEX IF NOT EXISTS idx_outlets_city ON outlets(city);
CREATE INDEX IF NOT EXISTS idx_outlets_location ON outlets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_outlets_manager ON outlets(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_outlets_active ON outlets(is_active);

CREATE INDEX IF NOT EXISTS idx_offers_brand ON offers(brand_id);
CREATE INDEX IF NOT EXISTS idx_offers_outlet ON offers(outlet_id);
CREATE INDEX IF NOT EXISTS idx_offers_scope ON offers(offer_scope);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert a sample national brand
INSERT INTO brands (name, slug, brand_type, category, description, verification_status, is_active)
VALUES 
('Domino''s Pizza', 'dominos-pizza', 'national_chain', 'Food', 'World''s largest pizza chain', 'admin_verified', true),
('Cafe Coffee Day', 'cafe-coffee-day', 'national_chain', 'Food', 'India''s favorite coffee chain', 'admin_verified', true);

-- Insert sample outlets for Domino's
INSERT INTO outlets (brand_id, name, address, city, state, phone, latitude, longitude)
SELECT 
    id,
    'Domino''s - Koramangala',
    '80 Feet Road, Koramangala 4th Block',
    'Bangalore',
    'Karnataka',
    '9876543210',
    12.9352,
    77.6245
FROM brands WHERE slug = 'dominos-pizza';

INSERT INTO outlets (brand_id, name, address, city, state, phone, latitude, longitude)
SELECT 
    id,
    'Domino''s - Indiranagar',
    '100 Feet Road, Indiranagar',
    'Bangalore',
    'Karnataka',
    '9876543211',
    12.9716,
    77.6412
FROM brands WHERE slug = 'dominos-pizza';

-- Insert sample outlets for CCD
INSERT INTO outlets (brand_id, name, address, city, state, phone, latitude, longitude)
SELECT 
    id,
    'CCD - MG Road',
    'MG Road, Near Metro Station',
    'Bangalore',
    'Karnataka',
    '9876543212',
    12.9756,
    77.6051
FROM brands WHERE slug = 'cafe-coffee-day';

-- =============================================
-- DONE! Multi-branch system ready
-- =============================================