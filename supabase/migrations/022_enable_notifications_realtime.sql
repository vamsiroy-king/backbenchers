-- =============================================
-- Enable Supabase Realtime for notifications table
-- =============================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Note: If you get an error that the table is already added, that's fine.
-- You can also enable this via Supabase Dashboard > Database > Replication
