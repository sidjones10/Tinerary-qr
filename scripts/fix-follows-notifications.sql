-- ============================================================================
-- FIX: Followers, Following, and Notifications System
-- ============================================================================
-- Run this script in your Supabase SQL Editor to fix:
-- 1. Followers/Following not working
-- 2. Following count not showing
-- 3. Notifications not appearing
-- ============================================================================

-- ============================================================================
-- STEP 1: Create user_follows table if not exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Prevent self-following
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view all follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;

-- Policy: Anyone can view follows (for public profiles)
CREATE POLICY "Users can view all follows"
ON user_follows FOR SELECT
USING (true);

-- Policy: Authenticated users can follow others
CREATE POLICY "Users can follow others"
ON user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
ON user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON user_follows TO authenticated;
GRANT SELECT ON user_follows TO anon;

-- ============================================================================
-- STEP 2: Add follower/following count columns to profiles if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'following_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create triggers to update follower/following counts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for the follower
    UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    -- Increment followers_count for the person being followed
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for the follower
    UPDATE profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
    -- Decrement followers_count for the person being unfollowed
    UPDATE profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- ============================================================================
-- STEP 4: Sync existing follow counts (in case data already exists)
-- ============================================================================
UPDATE profiles p SET
  followers_count = (SELECT COUNT(*) FROM user_follows WHERE following_id = p.id),
  following_count = (SELECT COUNT(*) FROM user_follows WHERE follower_id = p.id);

-- ============================================================================
-- STEP 5: Create notifications table if not exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  image_url TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Allow inserting notifications (for system/triggers)
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;

-- ============================================================================
-- STEP 6: Enable Realtime for notifications
-- ============================================================================
DO $$
BEGIN
  -- Check if realtime publication exists and add table
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add the table, ignore if already added
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Table already in publication
    END;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Create helper function to check follow status
-- ============================================================================
CREATE OR REPLACE FUNCTION is_following(follower UUID, target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = follower AND following_id = target
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_following TO authenticated;

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================
DO $$
DECLARE
  follows_exists BOOLEAN;
  notifications_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows') INTO follows_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') INTO notifications_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification Results';
  RAISE NOTICE '========================================';

  IF follows_exists THEN
    RAISE NOTICE '✓ user_follows table exists';
  ELSE
    RAISE WARNING '✗ user_follows table NOT created!';
  END IF;

  IF notifications_exists THEN
    RAISE NOTICE '✓ notifications table exists';
  ELSE
    RAISE WARNING '✗ notifications table NOT created!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Follow system should now work:';
  RAISE NOTICE '  - Users can follow/unfollow others';
  RAISE NOTICE '  - Follower/following counts auto-update';
  RAISE NOTICE '  - Notifications appear in real-time';
  RAISE NOTICE '';
END $$;
