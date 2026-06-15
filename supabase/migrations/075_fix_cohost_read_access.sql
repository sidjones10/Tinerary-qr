-- Migration: Fix co-host READ (SELECT) access
--
-- Background:
-- Migration 072 (co-host support) granted co-hosts INSERT / UPDATE / DELETE on
-- itineraries and activities, but it never added matching SELECT policies.
--
-- The base SELECT policies only allow:
--   itineraries:          is_public = true OR user_id = auth.uid()
--   activities:           is_public(itinerary) OR itinerary.user_id = auth.uid()
--   itinerary_attendees:  is_public(itinerary) OR itinerary.user_id = auth.uid()
--
-- As a result, a co-host of a PRIVATE itinerary could be granted edit rights but
-- could not actually READ the itinerary, its activities, or its attendee list —
-- so everything appeared "private" / empty to them. This migration closes that
-- gap by letting co-hosts read the same rows they are already allowed to edit.
--
-- We reuse is_itinerary_cohost() (SECURITY DEFINER, role IN ('admin','owner'))
-- from migration 072 so these SELECT policies do not recurse back into the
-- itineraries RLS policies.

-- =====================================================================
-- Itineraries: co-hosts can view itineraries they co-host
-- =====================================================================
DROP POLICY IF EXISTS "Public itineraries are viewable by everyone" ON itineraries;
DROP POLICY IF EXISTS "Owners cohosts and public can view itineraries" ON itineraries;
CREATE POLICY "Owners cohosts and public can view itineraries"
  ON itineraries FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR is_itinerary_cohost(id, auth.uid())
  );

-- =====================================================================
-- Activities: co-hosts can view activities in itineraries they co-host
-- =====================================================================
DROP POLICY IF EXISTS "Cohosts can view activities" ON activities;
CREATE POLICY "Cohosts can view activities"
  ON activities FOR SELECT
  USING (
    is_itinerary_cohost(activities.itinerary_id, auth.uid())
  );

-- =====================================================================
-- itinerary_attendees: co-hosts can view the attendee list
-- =====================================================================
DROP POLICY IF EXISTS "Cohosts can view attendees" ON itinerary_attendees;
CREATE POLICY "Cohosts can view attendees"
  ON itinerary_attendees FOR SELECT
  USING (
    is_itinerary_cohost(itinerary_attendees.itinerary_id, auth.uid())
  );

SELECT 'Co-host read-access fix applied successfully! ✓' as status;
