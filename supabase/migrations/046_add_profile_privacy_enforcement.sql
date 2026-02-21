-- ============================================================================
-- Migration: Enforce Profile Privacy at the Database Level
-- ============================================================================
-- This migration:
-- 1. Creates a can_view_profile() helper function
-- 2. Updates get_followers() and get_following() RPC functions to check privacy
-- 3. Adds an itineraries SELECT policy that respects profile privacy

-- ============================================================================
-- STEP 1: Create helper function to check profile viewability
-- ============================================================================

CREATE OR REPLACE FUNCTION can_view_profile(viewer_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  privacy_level TEXT;
  viewer_follows BOOLEAN;
BEGIN
  -- Owner can always view their own profile
  IF viewer_id IS NOT NULL AND viewer_id = target_id THEN
    RETURN TRUE;
  END IF;

  -- Get privacy preference
  SELECT COALESCE(
    (privacy_preferences->>'profilePrivacy'),
    'public'
  ) INTO privacy_level
  FROM user_preferences
  WHERE user_id = target_id;

  -- If no preferences found, default to public
  IF privacy_level IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Public profiles are always viewable
  IF privacy_level = 'public' THEN
    RETURN TRUE;
  END IF;

  -- Private profiles are never viewable by others
  IF privacy_level = 'private' THEN
    RETURN FALSE;
  END IF;

  -- Followers-only: check if viewer follows target
  IF privacy_level = 'followers' THEN
    IF viewer_id IS NULL THEN
      RETURN FALSE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = viewer_id AND following_id = target_id
    ) INTO viewer_follows;
    RETURN viewer_follows;
  END IF;

  -- Default: allow (treat unknown values as public)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_view_profile IS 'Check if a viewer can access a target user''s profile content based on privacy settings';

GRANT EXECUTE ON FUNCTION can_view_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_profile(UUID, UUID) TO anon;

-- ============================================================================
-- STEP 1b: Create function to retrieve a user's profile privacy level
-- ============================================================================
-- The user_preferences table is locked down by RLS so only the owner can
-- SELECT their own row.  The client-side profile page needs to know the
-- *privacy level* of any user it is viewing so it can show/hide content.
-- This SECURITY DEFINER function safely exposes just the privacy level
-- without opening up the whole user_preferences table.

CREATE OR REPLACE FUNCTION get_profile_privacy(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  privacy_level TEXT;
BEGIN
  SELECT COALESCE(
    (privacy_preferences->>'profilePrivacy'),
    'public'
  ) INTO privacy_level
  FROM user_preferences
  WHERE user_id = target_user_id;

  RETURN COALESCE(privacy_level, 'public');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_profile_privacy IS 'Return the profilePrivacy level for a user (public/followers/private). Safe to call for any user.';

GRANT EXECUTE ON FUNCTION get_profile_privacy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_privacy(UUID) TO anon;

-- ============================================================================
-- STEP 2: Update get_followers() to check profile privacy
-- ============================================================================

CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ,
  is_following BOOLEAN
) AS $$
BEGIN
  -- Check if the caller can view this profile's content
  IF NOT can_view_profile(auth.uid(), p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    f.created_at as followed_at,
    is_following(auth.uid(), p.id) as is_following
  FROM user_follows f
  INNER JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Update get_following() to check profile privacy
-- ============================================================================

CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ,
  is_following BOOLEAN
) AS $$
BEGIN
  -- Check if the caller can view this profile's content
  IF NOT can_view_profile(auth.uid(), p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    f.created_at as followed_at,
    is_following(auth.uid(), p.id) as is_following
  FROM user_follows f
  INNER JOIN profiles p ON p.id = f.following_id
  WHERE f.follower_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Add itineraries SELECT policy that respects profile privacy
-- ============================================================================

-- Use a RESTRICTIVE policy so it is AND'd with the existing permissive
-- policy ("Public itineraries are viewable by everyone").
-- This ensures itineraries from private/followers-only profiles are hidden
-- even when is_public = true.
DROP POLICY IF EXISTS "Itineraries respect profile privacy" ON itineraries;
CREATE POLICY "Itineraries respect profile privacy" ON itineraries
  AS RESTRICTIVE
  FOR SELECT USING (
    user_id = auth.uid()
    OR can_view_profile(auth.uid(), user_id)
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profile Privacy Enforcement Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Updates applied:';
  RAISE NOTICE '  - Created can_view_profile() helper function';
  RAISE NOTICE '  - Updated get_followers() to check privacy';
  RAISE NOTICE '  - Updated get_following() to check privacy';
  RAISE NOTICE '  - Added itineraries SELECT policy for profile privacy';
  RAISE NOTICE '';
END $$;
