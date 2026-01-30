-- ============================================================================
-- Fix: Likes Not Saving on Other People's Itineraries
-- ============================================================================
--
-- This script fixes the issue where users can only like their own itineraries
-- but not other people's itineraries.
--
-- TO RUN THIS SCRIPT:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to: Project > SQL Editor
-- 3. Create a new query
-- 4. Paste this entire script
-- 5. Click "Run" to execute
--
-- OR use psql command line:
-- psql $DATABASE_URL -f scripts/fix-likes-on-others-itineraries.sql
--
-- ============================================================================

\echo '';
\echo '╔════════════════════════════════════════════════════════════════════════════╗';
\echo '║  Fixing Likes System - Enabling Likes on Other People''s Itineraries       ║';
\echo '╚════════════════════════════════════════════════════════════════════════════╝';
\echo '';

-- ============================================================================
-- Recreate toggle_like function with explicit itinerary validation
-- ============================================================================

\echo '→ Updating toggle_like function...';

CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Explicitly check if itinerary exists before attempting to like
  -- This bypasses any RLS issues with FK constraint checks
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

    RETURN QUERY SELECT FALSE, current_like_count;
  ELSE
    -- Like: Insert new like
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'like');

    -- Get updated count
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, current_like_count;
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a race condition, just return current state
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;
    RETURN QUERY SELECT TRUE, current_like_count;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Update function comment
COMMENT ON FUNCTION toggle_like IS 'Toggle like status for an itinerary (works on any itinerary)';

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO anon;

\echo '✓ toggle_like function updated successfully';

-- ============================================================================
-- Verification
-- ============================================================================

\echo '';
\echo '→ Verifying configuration...';

-- Check that function is SECURITY DEFINER
DO $$
DECLARE
  func_prosecdef BOOLEAN;
BEGIN
  SELECT prosecdef INTO func_prosecdef
  FROM pg_proc
  WHERE proname = 'toggle_like';

  IF func_prosecdef THEN
    RAISE NOTICE '  ✓ toggle_like is correctly set as SECURITY DEFINER';
  ELSE
    RAISE WARNING '  ✗ WARNING: toggle_like is NOT SECURITY DEFINER!';
  END IF;
END $$;

-- Check that saved_itineraries table has type column
DO $$
DECLARE
  has_type_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'saved_itineraries'
      AND column_name = 'type'
  ) INTO has_type_column;

  IF has_type_column THEN
    RAISE NOTICE '  ✓ saved_itineraries has type column';
  ELSE
    RAISE WARNING '  ✗ WARNING: saved_itineraries missing type column! Run migration 006.5';
  END IF;
END $$;

-- Check RLS policies on saved_itineraries
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  FROM pg_policies
  WHERE tablename = 'saved_itineraries'
  INTO policy_count;

  IF policy_count >= 3 THEN
    RAISE NOTICE '  ✓ saved_itineraries has % RLS policies configured', policy_count;
  ELSE
    RAISE WARNING '  ✗ WARNING: saved_itineraries has only % policies (expected 3+)', policy_count;
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

\echo '';
\echo '╔════════════════════════════════════════════════════════════════════════════╗';
\echo '║  ✓ Fix Applied Successfully!                                               ║';
\echo '╚════════════════════════════════════════════════════════════════════════════╝';
\echo '';
\echo 'What was fixed:';
\echo '  • Enhanced toggle_like function to explicitly validate itinerary existence';
\echo '  • This bypasses RLS issues with automatic FK constraint validation';
\echo '  • Function now works for both own and other people''s itineraries';
\echo '';
\echo 'Test the fix:';
\echo '  1. Try liking someone else''s itinerary from the discover feed';
\echo '  2. Verify the heart icon fills and like count increases';
\echo '  3. Check your Likes tab to confirm it appears there';
\echo '  4. Try unliking it and verify it works';
\echo '';
\echo 'If you still experience issues:';
\echo '  1. Clear your browser cache and reload';
\echo '  2. Check browser console for any JavaScript errors';
\echo '  3. Visit /diagnostics page to run system checks';
\echo '';
