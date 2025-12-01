-- Add Like Count Functions and Triggers
-- Automatically increment/decrement like counts in itinerary_metrics

-- ============================================================================
-- Function to increment like count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if this is a 'like' type
  IF NEW.type = 'like' THEN
    UPDATE itinerary_metrics
    SET like_count = like_count + 1, updated_at = NOW()
    WHERE itinerary_id = NEW.itinerary_id;

    -- Create metrics row if it doesn't exist
    INSERT INTO itinerary_metrics (itinerary_id, like_count)
    VALUES (NEW.itinerary_id, 1)
    ON CONFLICT (itinerary_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to decrement like count
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if this was a 'like' type
  IF OLD.type = 'like' THEN
    UPDATE itinerary_metrics
    SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
    WHERE itinerary_id = OLD.itinerary_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create triggers for like count
-- ============================================================================
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
-- Helper function to check if user has liked an itinerary
-- ============================================================================
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

COMMENT ON FUNCTION user_has_liked IS 'Check if a user has liked a specific itinerary';

-- ============================================================================
-- Function to toggle like (like/unlike)
-- ============================================================================
CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
BEGIN
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
    SELECT like_count INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT FALSE, COALESCE(current_like_count, 0);
  ELSE
    -- Like: Insert new like
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'like');

    -- Get updated count
    SELECT like_count INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, COALESCE(current_like_count, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_like IS 'Toggle like status for an itinerary and return new state + count';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION user_has_liked TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Like Count Functions Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✓ increment_like_count() - Auto-increment on like';
  RAISE NOTICE '  ✓ decrement_like_count() - Auto-decrement on unlike';
  RAISE NOTICE '  ✓ user_has_liked(user_id, itinerary_id) - Check like status';
  RAISE NOTICE '  ✓ toggle_like(user_id, itinerary_id) - Like/unlike action';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  ✓ like_count_increment - ON saved_itineraries INSERT';
  RAISE NOTICE '  ✓ like_count_decrement - ON saved_itineraries DELETE';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage in UI:';
  RAISE NOTICE '  - Call toggle_like() to like/unlike';
  RAISE NOTICE '  - Check user_has_liked() for initial state';
  RAISE NOTICE '  - Like counts auto-update in itinerary_metrics';
  RAISE NOTICE '';
END $$;
