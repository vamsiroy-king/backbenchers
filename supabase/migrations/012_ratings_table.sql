-- Ratings and Reviews Table
-- Allows students to rate merchants after successful redemptions

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One rating per transaction
    UNIQUE(transaction_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ratings_merchant ON ratings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ratings_student ON ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- Enable RLS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Students can create ratings for their own transactions
CREATE POLICY "Students can create ratings" ON ratings
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM students WHERE id = student_id)
    );

-- Students can update their own ratings (within 24 hours)
CREATE POLICY "Students can update own ratings within 24h" ON ratings
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM students WHERE id = student_id)
        AND created_at > NOW() - INTERVAL '24 hours'
    );

-- Anyone can view ratings (public)
CREATE POLICY "Ratings are public" ON ratings
    FOR SELECT USING (true);

-- Function to get merchant average rating
CREATE OR REPLACE FUNCTION get_merchant_avg_rating(p_merchant_id UUID)
RETURNS TABLE(avg_rating NUMERIC, total_reviews INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(stars)::NUMERIC, 1) as avg_rating,
        COUNT(*)::INTEGER as total_reviews
    FROM ratings
    WHERE merchant_id = p_merchant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add trigger to update merchant's cached rating (optional optimization)
-- For now we'll calculate on-the-fly
