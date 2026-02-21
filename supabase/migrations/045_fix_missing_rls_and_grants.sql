-- ============================================================================
-- Migration 045: Fix missing RLS policies and GRANT statements
-- ============================================================================
-- Issues fixed:
--   1. activities table: RLS enabled but NO policies (archived migration 004
--      was never applied). All activity reads/writes fail silently.
--   2. user_interactions table: RLS enabled but NO policies. View tracking
--      and analytics inserts fail.
--   3. Missing GRANT statements on core tables (itineraries, activities,
--      packing_items, expenses, itinerary_metrics, itinerary_attendees,
--      itinerary_categories, notifications, user_interactions, drafts,
--      user_preferences).
--   4. can_access_private_content() references non-existent "status" column
--      on itinerary_attendees (should check itinerary_invitations or just
--      check attendee existence).

-- ============================================================================
-- STEP 1: GRANT permissions on all core tables
-- ============================================================================

-- Itineraries (the central table - needs all operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraries TO authenticated;
GRANT SELECT ON public.itineraries TO anon;

-- Activities
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT ON public.activities TO anon;

-- Packing items
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packing_items TO authenticated;
GRANT SELECT ON public.packing_items TO anon;

-- Expenses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT ON public.expenses TO anon;

-- Itinerary categories
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_categories TO authenticated;
GRANT SELECT ON public.itinerary_categories TO anon;

-- Itinerary metrics
GRANT SELECT, INSERT, UPDATE ON public.itinerary_metrics TO authenticated;
GRANT SELECT ON public.itinerary_metrics TO anon;

-- Itinerary attendees
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_attendees TO authenticated;
GRANT SELECT ON public.itinerary_attendees TO anon;

-- Notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- User interactions
GRANT SELECT, INSERT ON public.user_interactions TO authenticated;

-- User preferences
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- Drafts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drafts TO authenticated;

-- Itinerary invitations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itinerary_invitations TO authenticated;

-- Pending invitations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_invitations TO authenticated;

-- ============================================================================
-- STEP 2: Add missing RLS policies for activities table
-- ============================================================================
-- activities has RLS enabled (migration 001) but policies were only in
-- archived migration 004 and were never applied.

-- Anyone can view activities for public itineraries
DROP POLICY IF EXISTS "Users can view activities" ON activities;
DROP POLICY IF EXISTS "Anyone can view activities for public itineraries" ON activities;
CREATE POLICY "Anyone can view activities for public itineraries" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND (itineraries.is_public = true OR itineraries.user_id = auth.uid())
    )
  );

-- Users can create activities for their own itineraries
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can update activities for their own itineraries
DROP POLICY IF EXISTS "Users can update activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can delete activities for their own itineraries
DROP POLICY IF EXISTS "Users can delete activities" ON activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = activities.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: Add missing RLS policies for user_interactions table
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own interactions" ON user_interactions;
CREATE POLICY "Users can insert own interactions" ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Fix can_access_private_content function
-- ============================================================================
-- The original function references itinerary_attendees.status which does not
-- exist. The itinerary_attendees table has a "role" column, not "status".
-- The correct check is: does the user appear in itinerary_attendees at all?

CREATE OR REPLACE FUNCTION can_access_private_content(
  user_uuid UUID,
  itinerary_uuid UUID,
  content_type TEXT -- 'packing' or 'expenses'
)
RETURNS BOOLEAN AS $$
DECLARE
  itinerary_owner UUID;
  is_attendee BOOLEAN;
  is_content_public BOOLEAN;
BEGIN
  -- Get the itinerary owner and public status
  IF content_type = 'packing' THEN
    SELECT user_id, COALESCE(packing_list_public, FALSE)
    INTO itinerary_owner, is_content_public
    FROM itineraries
    WHERE id = itinerary_uuid;
  ELSIF content_type = 'expenses' THEN
    SELECT user_id, COALESCE(expenses_public, FALSE)
    INTO itinerary_owner, is_content_public
    FROM itineraries
    WHERE id = itinerary_uuid;
  ELSE
    RETURN FALSE;
  END IF;

  -- If itinerary doesn't exist, deny access
  IF itinerary_owner IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner always has access
  IF user_uuid = itinerary_owner THEN
    RETURN TRUE;
  END IF;

  -- If content is public, allow access
  IF is_content_public THEN
    RETURN TRUE;
  END IF;

  -- Check if user is an attendee (member of the itinerary)
  SELECT EXISTS (
    SELECT 1
    FROM itinerary_attendees
    WHERE itinerary_id = itinerary_uuid
      AND user_id = user_uuid
  ) INTO is_attendee;

  IF is_attendee THEN
    RETURN TRUE;
  END IF;

  -- Also check itinerary_invitations for accepted invitees
  RETURN EXISTS (
    SELECT 1
    FROM itinerary_invitations
    WHERE itinerary_id = itinerary_uuid
      AND invitee_id = user_uuid
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_access_private_content IS 'Check if a user can access private packing lists or expenses';

-- Ensure function is accessible
GRANT EXECUTE ON FUNCTION can_access_private_content TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_private_content TO anon;

-- ============================================================================
-- STEP 5: Add RLS policies for drafts (if missing)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own drafts" ON drafts;
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own drafts" ON drafts;
CREATE POLICY "Users can insert own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own drafts" ON drafts;
CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own drafts" ON drafts;
CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Add RLS policies for user_preferences (if missing)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
