-- ============================================================================
-- COMPLETE LIKES SYSTEM FIX
-- ============================================================================
-- Run this script in your Supabase SQL Editor to completely fix likes
-- ============================================================================

-- ============================================================================
-- STEP 0: Clean up ALL duplicate like records
-- ============================================================================
-- Keep only the newest like per user/itinerary, delete all others
DELETE FROM saved_itineraries a
USING saved_itineraries b
WHERE a.user_id = b.user_id
  AND a.itinerary_id = b.itinerary_id
  AND a.type = 'like'
  AND b.type = 'like'
  AND a.ctid < b.ctid;

-- Also clean up any records where type is NULL that might be stale likes
-- (set them to 'save' if they don't already have a save record)
UPDATE saved_itineraries SET type = 'save' WHERE type IS NULL;

-- Delete any remaining duplicates after type normalization
DELETE FROM saved_itineraries a
USING saved_itineraries b
WHERE a.user_id = b.user_id
  AND a.itinerary_id = b.itinerary_id
  AND a.type = b.type
  AND a.ctid < b.ctid;

-- Report cleanup results
DO $$
DECLARE
  like_count INTEGER;
  save_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO like_count FROM saved_itineraries WHERE type = 'like';
  SELECT COUNT(*) INTO save_count FROM saved_itineraries WHERE type = 'save';
  RAISE NOTICE 'After cleanup: % likes, % saves (no duplicates)', like_count, save_count;
END $$;

-- ============================================================================
-- STEP 1: Ensure saved_itineraries table has proper structure
-- ============================================================================
-- Add type column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_itineraries' AND column_name = 'type'
  ) THEN
    ALTER TABLE saved_itineraries ADD COLUMN type TEXT DEFAULT 'save';
    RAISE NOTICE 'Added type column to saved_itineraries';
  END IF;
END $$;

-- Add unique constraint if missing (prevents duplicate likes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_itineraries_user_itinerary_type_unique'
  ) THEN
    -- First, delete any duplicates
    DELETE FROM saved_itineraries a USING saved_itineraries b
    WHERE a.ctid < b.ctid
      AND a.user_id = b.user_id
      AND a.itinerary_id = b.itinerary_id
      AND COALESCE(a.type, 'save') = COALESCE(b.type, 'save');

    ALTER TABLE saved_itineraries
    ADD CONSTRAINT saved_itineraries_user_itinerary_type_unique
    UNIQUE (user_id, itinerary_id, type);
    RAISE NOTICE 'Added unique constraint to saved_itineraries';
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL; -- Constraint already exists
END $$;

-- ============================================================================
-- STEP 2: Ensure itinerary_metrics table exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS itinerary_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE UNIQUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id ON itinerary_metrics(itinerary_id);

-- Enable RLS but allow read access
ALTER TABLE itinerary_metrics ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for metrics
DROP POLICY IF EXISTS "Anyone can view metrics" ON itinerary_metrics;
CREATE POLICY "Anyone can view metrics" ON itinerary_metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can update metrics" ON itinerary_metrics;
CREATE POLICY "System can update metrics" ON itinerary_metrics FOR ALL USING (true);

-- Grant permissions
GRANT SELECT ON itinerary_metrics TO anon;
GRANT SELECT ON itinerary_metrics TO authenticated;

-- ============================================================================
-- STEP 3: Create/Replace toggle_like function with SECURITY DEFINER
-- ============================================================================
DROP FUNCTION IF EXISTS toggle_like(UUID, UUID);

CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_count INTEGER;
  current_like_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Check if itinerary exists
  SELECT EXISTS (
    SELECT 1 FROM itineraries WHERE id = itinerary_uuid
  ) INTO itinerary_exists;

  IF NOT itinerary_exists THEN
    RAISE EXCEPTION 'Itinerary does not exist: %', itinerary_uuid;
  END IF;

  -- Ensure metrics row exists for this itinerary
  INSERT INTO itinerary_metrics (itinerary_id, like_count)
  VALUES (itinerary_uuid, 0)
  ON CONFLICT (itinerary_id) DO NOTHING;

  -- Count ALL existing likes (handles duplicates)
  SELECT COUNT(*) INTO existing_count
  FROM saved_itineraries
  WHERE user_id = user_uuid
    AND itinerary_id = itinerary_uuid
    AND type = 'like';

  IF existing_count > 0 THEN
    -- Unlike: Delete ALL matching likes (clears duplicates in one shot)
    DELETE FROM saved_itineraries
    WHERE user_id = user_uuid
      AND itinerary_id = itinerary_uuid
      AND type = 'like';

    -- Sync like_count from actual data instead of decrementing
    SELECT COUNT(*) INTO current_like_count
    FROM saved_itineraries
    WHERE itinerary_id = itinerary_uuid AND type = 'like';

    UPDATE itinerary_metrics
    SET like_count = current_like_count, updated_at = NOW()
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT FALSE, current_like_count;
  ELSE
    -- Like: Insert new like
    INSERT INTO saved_itineraries (user_id, itinerary_id, type, created_at)
    VALUES (user_uuid, itinerary_uuid, 'like', NOW())
    ON CONFLICT (user_id, itinerary_id, type) DO NOTHING;

    -- Sync like_count from actual data instead of incrementing
    SELECT COUNT(*) INTO current_like_count
    FROM saved_itineraries
    WHERE itinerary_id = itinerary_uuid AND type = 'like';

    UPDATE itinerary_metrics
    SET like_count = current_like_count, updated_at = NOW()
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, current_like_count;
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition - return current state
    SELECT COUNT(*) INTO current_like_count
    FROM saved_itineraries
    WHERE itinerary_id = itinerary_uuid AND type = 'like';
    RETURN QUERY SELECT TRUE, COALESCE(current_like_count, 0);
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in toggle_like: %', SQLERRM;
    RETURN QUERY SELECT FALSE, 0;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO anon;

-- ============================================================================
-- STEP 4: Create user_has_liked helper function
-- ============================================================================
DROP FUNCTION IF EXISTS user_has_liked(UUID, UUID);

CREATE OR REPLACE FUNCTION user_has_liked(user_uuid UUID, itinerary_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM saved_itineraries
    WHERE user_id = user_uuid
      AND itinerary_id = itinerary_uuid
      AND type = 'like'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_has_liked TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_liked TO anon;

-- ============================================================================
-- STEP 5: Sync all like counts from saved_itineraries
-- ============================================================================
-- First, ensure all itineraries have a metrics row
INSERT INTO itinerary_metrics (itinerary_id, like_count, save_count)
SELECT
  id,
  0,
  0
FROM itineraries
WHERE id NOT IN (SELECT itinerary_id FROM itinerary_metrics WHERE itinerary_id IS NOT NULL)
ON CONFLICT (itinerary_id) DO NOTHING;

-- Now sync the actual counts
UPDATE itinerary_metrics m
SET
  like_count = (
    SELECT COUNT(*)
    FROM saved_itineraries s
    WHERE s.itinerary_id = m.itinerary_id AND s.type = 'like'
  ),
  save_count = (
    SELECT COUNT(*)
    FROM saved_itineraries s
    WHERE s.itinerary_id = m.itinerary_id AND s.type = 'save'
  ),
  updated_at = NOW();

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================
DO $$
DECLARE
  func_exists BOOLEAN;
  func_is_secdef BOOLEAN;
  total_likes INTEGER;
  total_itineraries INTEGER;
BEGIN
  -- Check function exists and is SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'toggle_like'
  ) INTO func_exists;

  SELECT prosecdef INTO func_is_secdef
  FROM pg_proc WHERE proname = 'toggle_like';

  -- Count totals
  SELECT COUNT(*) INTO total_likes FROM saved_itineraries WHERE type = 'like';
  SELECT COUNT(*) INTO total_itineraries FROM itineraries;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIKES SYSTEM FIX COMPLETE';
  RAISE NOTICE '========================================';

  IF func_exists THEN
    RAISE NOTICE '✓ toggle_like function exists';
  ELSE
    RAISE WARNING '✗ toggle_like function NOT created!';
  END IF;

  IF func_is_secdef THEN
    RAISE NOTICE '✓ toggle_like is SECURITY DEFINER';
  ELSE
    RAISE WARNING '✗ toggle_like is NOT SECURITY DEFINER!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Stats:';
  RAISE NOTICE '  - Total itineraries: %', total_itineraries;
  RAISE NOTICE '  - Total likes: %', total_likes;
  RAISE NOTICE '';
  RAISE NOTICE 'The likes system should now work correctly.';
  RAISE NOTICE 'Users can like any public itinerary.';
  RAISE NOTICE '';
END $$;
