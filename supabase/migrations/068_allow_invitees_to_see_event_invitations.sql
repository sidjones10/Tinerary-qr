-- Allow attendees of an event to see all invitations for that event.
-- This lets the Attendees tab show the full guest list to all guests,
-- not just to the event owner.
--
-- NOTE: The original version of this migration used a self-referencing
-- subquery on itinerary_invitations which caused infinite recursion in
-- PostgREST / Supabase. Fixed to only use itinerary_attendees.

-- Drop the broken self-referencing policy if it exists
DROP POLICY IF EXISTS "Invitees can view all invitations for same event" ON itinerary_invitations;

-- Allow attendees (accepted users in itinerary_attendees) to see invitations
DROP POLICY IF EXISTS "Attendees can view invitations for their event" ON itinerary_invitations;
CREATE POLICY "Attendees can view invitations for their event"
  ON itinerary_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_attendees
      WHERE itinerary_attendees.itinerary_id = itinerary_invitations.itinerary_id
      AND itinerary_attendees.user_id = auth.uid()
    )
  );
