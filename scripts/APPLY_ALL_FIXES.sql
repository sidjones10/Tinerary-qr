-- ============================================================================
-- MASTER FIX SCRIPT - Apply all missing tables and fixes
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor to fix all issues at once
-- This adds: comments, verification_codes, and fixes notifications/metrics
-- ============================================================================

-- ============================================================================
-- 1. CREATE COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_itinerary_id ON comments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CREATE VERIFICATION_CODES TABLE (for phone auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage verification codes" ON verification_codes
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 3. FIX NOTIFICATIONS TABLE (add missing columns)
-- ============================================================================
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add INSERT policy for notifications
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. FIX SAVED_ITINERARIES (add type column for likes)
-- ============================================================================
ALTER TABLE saved_itineraries
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'save';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_itineraries_type_check'
  ) THEN
    ALTER TABLE saved_itineraries
      ADD CONSTRAINT saved_itineraries_type_check
      CHECK (type IN ('save', 'like'));
  END IF;
END $$;

-- ============================================================================
-- 5. FIX ITINERARY_METRICS RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert itinerary metrics" ON itinerary_metrics;
CREATE POLICY "Users can insert itinerary metrics" ON itinerary_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view all itinerary metrics" ON itinerary_metrics;
CREATE POLICY "Users can view all itinerary metrics" ON itinerary_metrics
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own itinerary metrics" ON itinerary_metrics;
CREATE POLICY "Users can update own itinerary metrics" ON itinerary_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. CREATE COMMENT COUNT FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_metrics
  SET comment_count = comment_count + 1, updated_at = NOW()
  WHERE itinerary_id = NEW.itinerary_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_metrics
  SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW()
  WHERE itinerary_id = OLD.itinerary_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE LIKE COUNT FUNCTIONS (if not already exist)
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'like' THEN
    UPDATE itinerary_metrics
    SET like_count = like_count + 1, updated_at = NOW()
    WHERE itinerary_id = NEW.itinerary_id;

    INSERT INTO itinerary_metrics (itinerary_id, like_count)
    VALUES (NEW.itinerary_id, 1)
    ON CONFLICT (itinerary_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'like' THEN
    UPDATE itinerary_metrics
    SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
    WHERE itinerary_id = OLD.itinerary_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. CREATE TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS comment_count_increment ON comments;
CREATE TRIGGER comment_count_increment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS comment_count_decrement ON comments;
CREATE TRIGGER comment_count_decrement
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comment_count();

DROP TRIGGER IF EXISTS like_count_increment ON saved_itineraries;
CREATE TRIGGER like_count_increment
  AFTER INSERT ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION increment_like_count();

DROP TRIGGER IF EXISTS like_count_decrement ON saved_itineraries;
CREATE TRIGGER like_count_decrement
  AFTER DELETE ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION decrement_like_count();

-- ============================================================================
-- 9. CREATE HELPER FUNCTIONS FOR LIKES
-- ============================================================================
CREATE OR REPLACE FUNCTION user_has_liked(user_uuid UUID, itinerary_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM saved_itineraries
    WHERE user_id = user_uuid
      AND itinerary_id = itinerary_uuid
      AND type = 'like'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
BEGIN
  SELECT id INTO existing_like_id
  FROM saved_itineraries
  WHERE user_id = user_uuid
    AND itinerary_id = itinerary_uuid
    AND type = 'like';

  IF existing_like_id IS NOT NULL THEN
    DELETE FROM saved_itineraries WHERE id = existing_like_id;
    SELECT like_count INTO current_like_count
    FROM itinerary_metrics WHERE itinerary_id = itinerary_uuid;
    RETURN QUERY SELECT FALSE, COALESCE(current_like_count, 0);
  ELSE
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'like');
    SELECT like_count INTO current_like_count
    FROM itinerary_metrics WHERE itinerary_id = itinerary_uuid;
    RETURN QUERY SELECT TRUE, COALESCE(current_like_count, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION user_has_liked TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;

-- ============================================================================
-- 10. ADD PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id ON itinerary_metrics(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_type ON saved_itineraries(type);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✅ comments (with RLS and triggers)';
  RAISE NOTICE '  ✅ verification_codes (for phone auth)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  ✅ notifications (added image_url, metadata)';
  RAISE NOTICE '  ✅ saved_itineraries (added type column)';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies added:';
  RAISE NOTICE '  ✅ notifications INSERT policy';
  RAISE NOTICE '  ✅ itinerary_metrics INSERT/SELECT/UPDATE policies';
  RAISE NOTICE '  ✅ comments SELECT/INSERT/UPDATE/DELETE policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✅ increment/decrement comment_count';
  RAISE NOTICE '  ✅ increment/decrement like_count';
  RAISE NOTICE '  ✅ user_has_liked()';
  RAISE NOTICE '  ✅ toggle_like()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Test publishing an itinerary (should work!)';
  RAISE NOTICE '  2. Test commenting on itineraries';
  RAISE NOTICE '  3. Test liking/unliking itineraries';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
