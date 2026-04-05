-- Restrict comments to itinerary owner and accepted attendees only
-- Previously comments were viewable/creatable by everyone

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

-- New SELECT policy: only owner and accepted attendees can view comments
CREATE POLICY "Comments viewable by owner and attendees" ON comments
  FOR SELECT USING (
    -- User is the itinerary owner
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = comments.itinerary_id
        AND i.user_id = auth.uid()
    )
    OR
    -- User is an accepted attendee (via invitations)
    EXISTS (
      SELECT 1 FROM itinerary_invitations inv
      WHERE inv.itinerary_id = comments.itinerary_id
        AND inv.invitee_id = auth.uid()
        AND inv.status = 'accepted'
    )
  );

-- New INSERT policy: only owner and accepted attendees can create comments
CREATE POLICY "Owner and attendees can create comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      -- User is the itinerary owner
      EXISTS (
        SELECT 1 FROM itineraries i
        WHERE i.id = comments.itinerary_id
          AND i.user_id = auth.uid()
      )
      OR
      -- User is an accepted attendee (via invitations)
      EXISTS (
        SELECT 1 FROM itinerary_invitations inv
        WHERE inv.itinerary_id = comments.itinerary_id
          AND inv.invitee_id = auth.uid()
          AND inv.status = 'accepted'
      )
    )
  );
