-- ============================================================================
-- Add 'tentative' RSVP status to itinerary_invitations
-- ============================================================================
-- Partiful-style RSVP: accepted / declined / tentative / pending
-- The original CHECK constraint only allowed pending, accepted, declined.
-- We need to drop and recreate it to add 'tentative'.

ALTER TABLE itinerary_invitations
  DROP CONSTRAINT IF EXISTS itinerary_invitations_status_check;

ALTER TABLE itinerary_invitations
  ADD CONSTRAINT itinerary_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'tentative'));
