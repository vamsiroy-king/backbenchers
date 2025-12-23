-- =============================================
-- FAVORITES TABLE - Students save their favorite offers
-- =============================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate favorites
    UNIQUE(student_id, offer_id)
);

-- Index for fast lookup by student
CREATE INDEX IF NOT EXISTS idx_favorites_student ON favorites(student_id);

-- Index for counting favorites per offer
CREATE INDEX IF NOT EXISTS idx_favorites_offer ON favorites(offer_id);

-- RLS Policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Students can read their own favorites
CREATE POLICY "Students can view own favorites" ON favorites
    FOR SELECT USING (student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    ));

-- Students can insert their own favorites
CREATE POLICY "Students can add favorites" ON favorites
    FOR INSERT WITH CHECK (student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    ));

-- Students can delete their own favorites
CREATE POLICY "Students can remove favorites" ON favorites
    FOR DELETE USING (student_id IN (
        SELECT id FROM students WHERE user_id = auth.uid()
    ));

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites" ON favorites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );
