-- Migration: Add co-host support for itineraries
-- Co-hosts (role = 'admin' in itinerary_attendees) can do everything an owner can,
-- EXCEPT delete the itinerary. Only the original creator (itineraries.user_id) can delete.

-- =====================================================================
-- Helper function: is a user a co-host of a given itinerary?
-- =====================================================================
CREATE OR REPLACE FUNCTION is_itinerary_cohost(p_itinerary_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM itinerary_attendees
    WHERE itinerary_id = p_itinerary_id
      AND user_id = p_user_id
      AND role IN ('admin', 'owner')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_itinerary_cohost(UUID, UUID) TO authenticated;

-- =====================================================================
-- Itineraries: allow co-hosts to UPDATE, but NOT DELETE
-- =====================================================================

-- Drop existing update policies so we can replace with one that includes co-hosts
DROP POLICY IF EXISTS "Users can update their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Owners and cohosts can update itineraries" ON itineraries;

CREATE POLICY "Owners and cohosts can update itineraries"
  ON itineraries FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_itinerary_cohost(id, auth.uid())
  )
  WITH CHECK (
    -- The user_id (original creator) field cannot be changed by a cohost.
    -- We can't easily inspect OLD here; rely on app-layer guard.
    auth.uid() = user_id
    OR is_itinerary_cohost(id, auth.uid())
  );

-- DELETE remains owner-only (do not modify existing delete policy if present,
-- but ensure a strict owner-only policy exists).
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Only owner can delete itinerary" ON itineraries;

CREATE POLICY "Only owner can delete itinerary"
  ON itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- Activities: allow co-hosts to INSERT / UPDATE / DELETE activities
-- =====================================================================

DROP POLICY IF EXISTS "Users can insert activities in their itineraries" ON activities;
DROP POLICY IF EXISTS "Owners and cohosts can insert activities" ON activities;
CREATE POLICY "Owners and cohosts can insert activities"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = activities.itinerary_id
        AND (i.user_id = auth.uid() OR is_itinerary_cohost(i.id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update activities in their itineraries" ON activities;
DROP POLICY IF EXISTS "Owners and cohosts can update activities" ON activities;
CREATE POLICY "Owners and cohosts can update activities"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = activities.itinerary_id
        AND (i.user_id = auth.uid() OR is_itinerary_cohost(i.id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete activities in their itineraries" ON activities;
DROP POLICY IF EXISTS "Owners and cohosts can delete activities" ON activities;
CREATE POLICY "Owners and cohosts can delete activities"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = activities.itinerary_id
        AND (i.user_id = auth.uid() OR is_itinerary_cohost(i.id, auth.uid()))
    )
  );

-- =====================================================================
-- itinerary_attendees: owner can manage co-hosts; co-hosts can also add
-- new members (but cannot promote / demote owner, cannot remove owner)
-- =====================================================================

DROP POLICY IF EXISTS "Owners can add attendees" ON itinerary_attendees;
CREATE POLICY "Owners and cohosts can add attendees"
  ON itinerary_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = itinerary_attendees.itinerary_id
        AND (i.user_id = auth.uid() OR is_itinerary_cohost(i.id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Owners can update attendees" ON itinerary_attendees;
CREATE POLICY "Owners can update attendees roles"
  ON itinerary_attendees FOR UPDATE
  USING (
    -- Only the original itinerary owner can change roles (promote/demote co-hosts)
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = itinerary_attendees.itinerary_id
        AND i.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can remove attendees" ON itinerary_attendees;
CREATE POLICY "Owners can remove attendees"
  ON itinerary_attendees FOR DELETE
  USING (
    -- Only the original itinerary owner can remove co-hosts/members.
    -- Members may remove themselves (their own row).
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = itinerary_attendees.itinerary_id
        AND i.user_id = auth.uid()
    )
    OR itinerary_attendees.user_id = auth.uid()
  );

COMMENT ON FUNCTION is_itinerary_cohost(UUID, UUID) IS
  'Returns true if the user is an admin/co-host (or owner) of the given itinerary';

SELECT 'Co-host support migration applied successfully! ✓' as status;
