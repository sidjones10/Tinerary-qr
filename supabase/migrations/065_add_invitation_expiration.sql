-- ============================================================================
-- Migration 065: Add invitation expiration
-- ============================================================================
-- Adds an expires_at column to itinerary_invitations so pending invitations
-- automatically expire after a configurable window (default 7 days).
-- Also adds an 'expired' status option.

-- 1. Allow 'expired' and 'tentative' as valid statuses
ALTER TABLE itinerary_invitations
  DROP CONSTRAINT IF EXISTS itinerary_invitations_status_check;

ALTER TABLE itinerary_invitations
  ADD CONSTRAINT itinerary_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'tentative', 'expired'));

-- 2. Add expires_at column with default of 7 days from now
ALTER TABLE itinerary_invitations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Set default for new rows: 7 days from creation
ALTER TABLE itinerary_invitations
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');

-- 3. Backfill existing pending invitations with an expiration 7 days from created_at
UPDATE itinerary_invitations
  SET expires_at = created_at + INTERVAL '7 days'
  WHERE expires_at IS NULL AND status = 'pending';

-- For already-responded invitations, set expires_at to NULL (they don't expire)
-- (no action needed — they'll stay NULL which means "no expiration")

-- 4. Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at
  ON itinerary_invitations (expires_at)
  WHERE status = 'pending';

-- 5. Function to expire stale invitations (can be called via cron)
CREATE OR REPLACE FUNCTION expire_stale_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE itinerary_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;
