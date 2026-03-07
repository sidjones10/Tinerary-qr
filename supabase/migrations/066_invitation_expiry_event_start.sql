-- ============================================================================
-- Migration 066: Change invitation expiry to event start date
-- ============================================================================
-- Instead of a blanket 7-day TTL, invitations now expire on the event's
-- start_date.  If the invitation is created after the event has already
-- started (or the event has no start_date), fall back to 7 days from creation.

-- 1. Remove the fixed 7-day default so the application layer controls expires_at
ALTER TABLE itinerary_invitations
  ALTER COLUMN expires_at DROP DEFAULT;

-- 2. Backfill existing pending invitations: use itinerary start_date when available
UPDATE itinerary_invitations inv
  SET expires_at = CASE
    WHEN i.start_date IS NOT NULL AND i.start_date::timestamptz > inv.created_at
      THEN i.start_date::timestamptz
    ELSE inv.created_at + INTERVAL '7 days'
  END
FROM itineraries i
WHERE i.id = inv.itinerary_id
  AND inv.status = 'pending'
  AND inv.expires_at IS NOT NULL;
