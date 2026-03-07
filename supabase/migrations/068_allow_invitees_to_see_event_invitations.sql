-- Allow any invitee of an event to see all invitations for that event.
-- This lets the Attendees tab show the full guest list to all guests,
-- not just to the event owner.

CREATE POLICY "Invitees can view all invitations for same event"
  ON itinerary_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_invitations my_inv
      WHERE my_inv.itinerary_id = itinerary_invitations.itinerary_id
      AND my_inv.invitee_id = auth.uid()
    )
  );

-- Also allow attendees (accepted users in itinerary_attendees) to see invitations
CREATE POLICY "Attendees can view invitations for their event"
  ON itinerary_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_attendees
      WHERE itinerary_attendees.itinerary_id = itinerary_invitations.itinerary_id
      AND itinerary_attendees.user_id = auth.uid()
    )
  );
