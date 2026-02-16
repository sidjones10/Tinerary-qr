-- Migration: Fix itinerary metrics increment/decrement functions
-- Created: 2026-02-16
-- Purpose: Make all metric increment/decrement functions SECURITY DEFINER
-- so they bypass RLS and can be called by any authenticated user.
-- Also add upsert logic so metrics rows are created if missing.

-- ============================================================================
-- 0. Drop existing RPC functions so we can recreate with SECURITY DEFINER
--    (Trigger functions don't need DROP since their signatures are unchanged)
-- ============================================================================
DROP FUNCTION IF EXISTS increment_view_count(UUID);
DROP FUNCTION IF EXISTS increment_save_count(UUID);
DROP FUNCTION IF EXISTS increment_share_count(UUID);

-- ============================================================================
-- 1. Recreate increment_view_count with SECURITY DEFINER and upsert
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_view_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  -- Create metrics row if it doesn't exist
  INSERT INTO itinerary_metrics (itinerary_id, view_count)
  VALUES ($1, 0)
  ON CONFLICT (itinerary_id) DO NOTHING;

  -- Increment view count
  UPDATE itinerary_metrics
  SET view_count = view_count + 1, updated_at = NOW()
  WHERE itinerary_metrics.itinerary_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Recreate increment_save_count with SECURITY DEFINER and upsert
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_save_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  -- Create metrics row if it doesn't exist
  INSERT INTO itinerary_metrics (itinerary_id, save_count)
  VALUES ($1, 0)
  ON CONFLICT (itinerary_id) DO NOTHING;

  -- Increment save count
  UPDATE itinerary_metrics
  SET save_count = save_count + 1, updated_at = NOW()
  WHERE itinerary_metrics.itinerary_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Fix increment_like_count (trigger function) - add SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'like' THEN
    -- Create metrics row if it doesn't exist
    INSERT INTO itinerary_metrics (itinerary_id, like_count)
    VALUES (NEW.itinerary_id, 0)
    ON CONFLICT (itinerary_id) DO NOTHING;

    -- Increment like count
    UPDATE itinerary_metrics
    SET like_count = like_count + 1, updated_at = NOW()
    WHERE itinerary_id = NEW.itinerary_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Fix decrement_like_count (trigger function) - add SECURITY DEFINER
-- ============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Recreate increment_share_count with SECURITY DEFINER and upsert
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_share_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  -- Create metrics row if it doesn't exist
  INSERT INTO itinerary_metrics (itinerary_id, share_count)
  VALUES ($1, 0)
  ON CONFLICT (itinerary_id) DO NOTHING;

  -- Increment share count
  UPDATE itinerary_metrics
  SET share_count = share_count + 1, updated_at = NOW()
  WHERE itinerary_metrics.itinerary_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Fix increment_comment_count (trigger function) - add SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Create metrics row if it doesn't exist
  INSERT INTO itinerary_metrics (itinerary_id, comment_count)
  VALUES (NEW.itinerary_id, 0)
  ON CONFLICT (itinerary_id) DO NOTHING;

  -- Increment comment count
  UPDATE itinerary_metrics
  SET comment_count = comment_count + 1, updated_at = NOW()
  WHERE itinerary_id = NEW.itinerary_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Fix decrement_comment_count (trigger function) - add SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_metrics
  SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW()
  WHERE itinerary_id = OLD.itinerary_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Backfill: Ensure all itineraries have metrics rows
-- ============================================================================
INSERT INTO itinerary_metrics (itinerary_id, view_count, save_count, share_count, like_count, comment_count)
SELECT
  i.id,
  0,
  0,
  0,
  0,
  0
FROM itineraries i
WHERE NOT EXISTS (
  SELECT 1 FROM itinerary_metrics m WHERE m.itinerary_id = i.id
)
ON CONFLICT (itinerary_id) DO NOTHING;

-- ============================================================================
-- 9. Sync like_count from actual saved_itineraries data
-- ============================================================================
UPDATE itinerary_metrics m
SET like_count = (
  SELECT COUNT(*)
  FROM saved_itineraries si
  WHERE si.itinerary_id = m.itinerary_id
    AND si.type = 'like'
);

-- ============================================================================
-- 10. Sync save_count from actual saved_itineraries data
-- ============================================================================
UPDATE itinerary_metrics m
SET save_count = (
  SELECT COUNT(*)
  FROM saved_itineraries si
  WHERE si.itinerary_id = m.itinerary_id
    AND si.type = 'save'
);

-- ============================================================================
-- 11. Sync comment_count from actual comments data
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN
    EXECUTE '
      UPDATE itinerary_metrics m
      SET comment_count = (
        SELECT COUNT(*)
        FROM comments c
        WHERE c.itinerary_id = m.itinerary_id
      )
    ';
  END IF;
END $$;

-- ============================================================================
-- 12. Grant execute permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_save_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_count(UUID) TO authenticated;
