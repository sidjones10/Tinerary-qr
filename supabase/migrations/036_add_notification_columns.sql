-- ============================================================================
-- Migration 036: Add Missing Notification Columns
-- ============================================================================
-- ISSUE: Like notifications fail with "column link_url does not exist"
-- The notifications table is missing some columns used by the notification service.
-- ============================================================================

-- Add link_url column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add image_url column for notification avatars/images
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add metadata column for additional notification data (JSON)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index on user_id and is_read for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read)
WHERE is_read = false;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 036: Notification Columns Added!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns added:';
  RAISE NOTICE '  - link_url (TEXT)';
  RAISE NOTICE '  - image_url (TEXT)';
  RAISE NOTICE '  - metadata (JSONB)';
  RAISE NOTICE '';
  RAISE NOTICE 'Likes should now work correctly!';
  RAISE NOTICE '';
END $$;
