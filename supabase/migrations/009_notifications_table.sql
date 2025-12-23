-- =============================================
-- NOTIFICATIONS TABLE - Real-time notifications for all user types
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who receives the notification
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'merchant', 'admin')),
    
    -- Notification content
    type VARCHAR(50) NOT NULL, -- 'offer_expiring', 'new_deal', 'redemption', 'approval', etc.
    title VARCHAR(200) NOT NULL,
    body TEXT,
    
    -- Additional data (offer_id, merchant_id, etc.)
    data JSONB DEFAULT '{}',
    
    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Index for unread count
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can insert notifications for anyone
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    );

-- System can create notifications (for triggers)
CREATE POLICY "Service role can manage all notifications" ON notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Function to create notification (for server-side use)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_user_type VARCHAR(20),
    p_type VARCHAR(50),
    p_title VARCHAR(200),
    p_body TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (user_id, user_type, type, title, body, data)
    VALUES (p_user_id, p_user_type, p_type, p_title, p_body, p_data)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
