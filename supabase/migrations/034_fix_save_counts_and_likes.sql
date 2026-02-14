-- ============================================================================
-- Migration 034: Fix Save Count Triggers and Like Function
-- ============================================================================
-- ISSUES FIXED:
-- 1. save_count never updates because there are no triggers for it
-- 2. toggle_like may not work on other users' itineraries due to RLS
--
-- This migration adds proper save count triggers and ensures toggle_like
-- works with SECURITY DEFINER to bypass RLS.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create trigger functions for save count
-- ============================================================================

-- Function to increment save count (trigger version)
CREATE OR REPLACE FUNCTION increment_save_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if this is a 'save' type
  IF NEW.type = 'save' THEN
    -- Update existing metrics row
    UPDATE itinerary_metrics
    SET save_count = save_count + 1, updated_at = NOW()
    WHERE itinerary_id = NEW.itinerary_id;

    -- Create metrics row if it doesn't exist
    INSERT INTO itinerary_metrics (itinerary_id, save_count)
    VALUES (NEW.itinerary_id, 1)
    ON CONFLICT (itinerary_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement save count (trigger version)
CREATE OR REPLACE FUNCTION decrement_save_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if this was a 'save' type
  IF OLD.type = 'save' THEN
    UPDATE itinerary_metrics
    SET save_count = GREATEST(save_count - 1, 0), updated_at = NOW()
    WHERE itinerary_id = OLD.itinerary_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Create triggers for save count
-- ============================================================================

DROP TRIGGER IF EXISTS save_count_increment ON saved_itineraries;
CREATE TRIGGER save_count_increment
  AFTER INSERT ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION increment_save_count_trigger();

DROP TRIGGER IF EXISTS save_count_decrement ON saved_itineraries;
CREATE TRIGGER save_count_decrement
  AFTER DELETE ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION decrement_save_count_trigger();

-- ============================================================================
-- STEP 3: Recreate toggle_like with proper SECURITY DEFINER settings
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Explicitly check if itinerary exists (bypasses RLS due to SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 FROM itineraries WHERE id = itinerary_uuid
  ) INTO itinerary_exists;

  IF NOT itinerary_exists THEN
    RAISE EXCEPTION 'Itinerary does not exist: %', itinerary_uuid;
  END IF;

  -- Check if like already exists
  SELECT id INTO existing_like_id
  FROM saved_itineraries
  WHERE user_id = user_uuid
    AND itinerary_id = itinerary_uuid
    AND type = 'like';

  IF existing_like_id IS NOT NULL THEN
    -- Unlike: Delete the existing like
    DELETE FROM saved_itineraries WHERE id = existing_like_id;

    -- Get updated count
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT FALSE, COALESCE(current_like_count, 0);
  ELSE
    -- Like: Insert new like
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'like');

    -- Get updated count
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, COALESCE(current_like_count, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO anon;

-- ============================================================================
-- STEP 4: Create toggle_save function (similar to toggle_like)
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_save(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_saved BOOLEAN, new_save_count INTEGER) AS $$
DECLARE
  existing_save_id UUID;
  current_save_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Explicitly check if itinerary exists
  SELECT EXISTS (
    SELECT 1 FROM itineraries WHERE id = itinerary_uuid
  ) INTO itinerary_exists;

  IF NOT itinerary_exists THEN
    RAISE EXCEPTION 'Itinerary does not exist: %', itinerary_uuid;
  END IF;

  -- Check if save already exists
  SELECT id INTO existing_save_id
  FROM saved_itineraries
  WHERE user_id = user_uuid
    AND itinerary_id = itinerary_uuid
    AND type = 'save';

  IF existing_save_id IS NOT NULL THEN
    -- Unsave: Delete the existing save
    DELETE FROM saved_itineraries WHERE id = existing_save_id;

    -- Get updated count
    SELECT COALESCE(save_count, 0) INTO current_save_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT FALSE, COALESCE(current_save_count, 0);
  ELSE
    -- Save: Insert new save
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'save');

    -- Get updated count
    SELECT COALESCE(save_count, 0) INTO current_save_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, COALESCE(current_save_count, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION toggle_save TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_save TO anon;

-- ============================================================================
-- STEP 5: Recalculate all save and like counts from actual data
-- ============================================================================

-- Update like counts based on actual saved_itineraries data
UPDATE itinerary_metrics im
SET like_count = (
  SELECT COUNT(*)
  FROM saved_itineraries si
  WHERE si.itinerary_id = im.itinerary_id
    AND si.type = 'like'
);

-- Update save counts based on actual saved_itineraries data
UPDATE itinerary_metrics im
SET save_count = (
  SELECT COUNT(*)
  FROM saved_itineraries si
  WHERE si.itinerary_id = im.itinerary_id
    AND si.type = 'save'
);

-- ============================================================================
-- STEP 6: Ensure all itineraries have metrics rows
-- ============================================================================

INSERT INTO itinerary_metrics (itinerary_id, like_count, save_count, view_count, share_count, comment_count)
SELECT
  i.id,
  COALESCE((SELECT COUNT(*) FROM saved_itineraries si WHERE si.itinerary_id = i.id AND si.type = 'like'), 0),
  COALESCE((SELECT COUNT(*) FROM saved_itineraries si WHERE si.itinerary_id = i.id AND si.type = 'save'), 0),
  0,
  0,
  COALESCE((SELECT COUNT(*) FROM comments c WHERE c.itinerary_id = i.id), 0)
FROM itineraries i
WHERE NOT EXISTS (
  SELECT 1 FROM itinerary_metrics im WHERE im.itinerary_id = i.id
)
ON CONFLICT (itinerary_id) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 034: Save/Like Fixes Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '  - Added save_count_increment trigger';
  RAISE NOTICE '  - Added save_count_decrement trigger';
  RAISE NOTICE '  - Recreated toggle_like with SECURITY DEFINER';
  RAISE NOTICE '  - Created toggle_save function';
  RAISE NOTICE '  - Recalculated all like/save counts from data';
  RAISE NOTICE '  - Ensured all itineraries have metrics rows';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Like ANY itinerary (not just their own)';
  RAISE NOTICE '  - Save ANY itinerary';
  RAISE NOTICE '  - See accurate like/save counts';
  RAISE NOTICE '';
END $$;
