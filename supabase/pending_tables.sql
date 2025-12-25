-- PENDING TABLES FOR BACKBENCHERS
-- Run this SQL in Supabase SQL Editor

-- 1. Table for Google-only signups (students who completed Google auth but NOT college email verification)
CREATE TABLE IF NOT EXISTS google_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE google_signups ENABLE ROW LEVEL SECURITY;

-- Policies for google_signups
CREATE POLICY "Users can view their own google signup" ON google_signups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own google signup" ON google_signups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all google signups" ON google_signups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
        )
    );

-- 2. Table for Pending Merchant Applications (before admin approval)
CREATE TABLE IF NOT EXISTS pending_merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- Business Info
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    description TEXT,
    
    -- Owner Info
    owner_name TEXT,
    owner_phone TEXT,
    
    -- Contact
    phone TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_maps_link TEXT,
    google_maps_embed TEXT,
    
    -- Documents
    gst_number TEXT,
    pan_number TEXT,
    
    -- Images
    logo_url TEXT,
    cover_photo_url TEXT,
    store_images TEXT[], -- Array of image URLs
    payment_qr_url TEXT,
    
    -- Operating Hours (JSONB)
    operating_hours JSONB,
    
    -- Application Status
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES admins(id),
    rejection_reason TEXT,
    
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE pending_merchants ENABLE ROW LEVEL SECURITY;

-- Policies for pending_merchants
CREATE POLICY "Merchants can view their own application" ON pending_merchants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants can insert their own application" ON pending_merchants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all pending merchants" ON pending_merchants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
        )
    );

-- Index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_pending_merchants_status ON pending_merchants(status);
CREATE INDEX IF NOT EXISTS idx_pending_merchants_submitted ON pending_merchants(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_signups_created ON google_signups(created_at DESC);

-- Grant permissions
GRANT ALL ON google_signups TO authenticated;
GRANT ALL ON pending_merchants TO authenticated;
