-- Pending Ratings Table
-- Stores rating requests that need to be shown to students when they open the app
-- This is stored in the database so it works across devices

CREATE TABLE IF NOT EXISTS pending_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    merchant_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '48 hours') NOT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE,
    UNIQUE(transaction_id)  -- Only one pending rating per transaction
);

-- Index for fast lookups by student
CREATE INDEX IF NOT EXISTS idx_pending_ratings_student ON pending_ratings(student_id, is_dismissed);

-- Auto-cleanup expired pending ratings (optional, can use cron)
CREATE INDEX IF NOT EXISTS idx_pending_ratings_expires ON pending_ratings(expires_at);

-- RLS Policies
ALTER TABLE pending_ratings ENABLE ROW LEVEL SECURITY;

-- Students can read their own pending ratings
CREATE POLICY "Students can read own pending ratings"
ON pending_ratings FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Students can update (dismiss) their own pending ratings  
CREATE POLICY "Students can update own pending ratings"
ON pending_ratings FOR UPDATE
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Students can delete their own pending ratings
CREATE POLICY "Students can delete own pending ratings"
ON pending_ratings FOR DELETE
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Service role can insert (from merchant scanner)
CREATE POLICY "Service role can insert pending ratings"
ON pending_ratings FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON pending_ratings TO authenticated;
GRANT INSERT ON pending_ratings TO authenticated, service_role;
