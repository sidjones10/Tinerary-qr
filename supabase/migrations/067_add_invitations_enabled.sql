-- Add invitations_enabled flag to itineraries.
-- When false, the invite link is invalid and new RSVPs via link are blocked.
-- Existing invitations (pending, accepted, tentative, declined) are NOT removed.

ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS invitations_enabled BOOLEAN NOT NULL DEFAULT true;
