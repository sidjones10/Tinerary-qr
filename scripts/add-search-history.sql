-- ============================================================================
-- User Search History for Marketing Emails
-- ============================================================================
-- This script creates the infrastructure to track user location searches
-- and send them personalized marketing emails about itineraries in those locations
-- ============================================================================

-- ============================================================================
-- STEP 1: Create user_search_history table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'location', 'user'
  location_extracted TEXT, -- Extracted location from the search (if applicable)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_search_history_user ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_location ON user_search_history(location_extracted) WHERE location_extracted IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_history_created ON user_search_history(created_at DESC);

-- Enable RLS
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own search history" ON user_search_history;
DROP POLICY IF EXISTS "Users can insert own searches" ON user_search_history;
DROP POLICY IF EXISTS "System can read all searches" ON user_search_history;

-- Policy: Users can view their own search history
CREATE POLICY "Users can view own search history"
ON user_search_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own searches
CREATE POLICY "Users can insert own searches"
ON user_search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON user_search_history TO authenticated;

-- ============================================================================
-- STEP 2: Create marketing_email_queue table
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketing_email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'location_itineraries', 'weekly_digest', 'new_followers', etc.
  email_data JSONB NOT NULL, -- Stores location, itinerary IDs, etc.
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON marketing_email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON marketing_email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON marketing_email_queue(status);

-- Enable RLS
ALTER TABLE marketing_email_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "System can manage email queue" ON marketing_email_queue;

-- Policy: Allow system to manage email queue
CREATE POLICY "System can manage email queue"
ON marketing_email_queue FOR ALL
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON marketing_email_queue TO authenticated;

-- ============================================================================
-- STEP 3: Add email preferences to profiles (if not exists)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketing_emails_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_emails_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_marketing_email_sent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_marketing_email_sent TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create function to get popular itineraries by location
-- ============================================================================
DROP FUNCTION IF EXISTS get_popular_itineraries_by_location(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_popular_itineraries_by_location(
  p_location TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  image_url TEXT,
  start_date DATE,
  like_count BIGINT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.description,
    i.location,
    i.image_url,
    i.start_date,
    COALESCE(m.like_count, 0) as like_count,
    COALESCE(m.view_count, 0) as view_count
  FROM itineraries i
  LEFT JOIN itinerary_metrics m ON i.id = m.itinerary_id
  WHERE i.is_public = true
    AND (
      LOWER(i.location) LIKE '%' || LOWER(p_location) || '%'
      OR i.location ILIKE '%' || p_location || '%'
    )
  ORDER BY COALESCE(m.like_count, 0) DESC, COALESCE(m.view_count, 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_popular_itineraries_by_location TO authenticated;

-- ============================================================================
-- STEP 5: Create function to queue location-based marketing emails
-- ============================================================================
DROP FUNCTION IF EXISTS queue_location_marketing_email(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION queue_location_marketing_email(
  p_user_id UUID,
  p_location TEXT,
  p_search_query TEXT
)
RETURNS UUID AS $$
DECLARE
  v_email_id UUID;
  v_user_email TEXT;
  v_marketing_enabled BOOLEAN;
  v_last_email TIMESTAMPTZ;
BEGIN
  -- Check if user has marketing emails enabled and hasn't received one recently
  SELECT email, marketing_emails_enabled, last_marketing_email_sent
  INTO v_user_email, v_marketing_enabled, v_last_email
  FROM profiles
  WHERE id = p_user_id;

  -- Don't queue if marketing is disabled
  IF NOT COALESCE(v_marketing_enabled, TRUE) THEN
    RETURN NULL;
  END IF;

  -- Don't queue if we sent an email in the last 24 hours
  IF v_last_email IS NOT NULL AND v_last_email > NOW() - INTERVAL '24 hours' THEN
    RETURN NULL;
  END IF;

  -- Check if there are itineraries for this location
  IF NOT EXISTS (
    SELECT 1 FROM itineraries
    WHERE is_public = true
      AND LOWER(location) LIKE '%' || LOWER(p_location) || '%'
    LIMIT 1
  ) THEN
    RETURN NULL;
  END IF;

  -- Queue the email for 2 hours from now (give user time to browse first)
  INSERT INTO marketing_email_queue (
    user_id,
    email_type,
    email_data,
    scheduled_for
  ) VALUES (
    p_user_id,
    'location_itineraries',
    jsonb_build_object(
      'location', p_location,
      'search_query', p_search_query,
      'user_email', v_user_email
    ),
    NOW() + INTERVAL '2 hours'
  )
  RETURNING id INTO v_email_id;

  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION queue_location_marketing_email TO authenticated;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================
DO $$
DECLARE
  search_history_exists BOOLEAN;
  email_queue_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_search_history') INTO search_history_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_email_queue') INTO email_queue_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Search History & Marketing Email Setup';
  RAISE NOTICE '========================================';

  IF search_history_exists THEN
    RAISE NOTICE '✓ user_search_history table exists';
  ELSE
    RAISE WARNING '✗ user_search_history table NOT created!';
  END IF;

  IF email_queue_exists THEN
    RAISE NOTICE '✓ marketing_email_queue table exists';
  ELSE
    RAISE WARNING '✗ marketing_email_queue table NOT created!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Marketing email system ready:';
  RAISE NOTICE '  - User searches are tracked';
  RAISE NOTICE '  - Location-based emails can be queued';
  RAISE NOTICE '  - Users can opt out via marketing_emails_enabled';
  RAISE NOTICE '';
END $$;
