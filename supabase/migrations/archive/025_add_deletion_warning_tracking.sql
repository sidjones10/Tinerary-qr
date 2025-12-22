-- Add field to track deletion warning email
-- Prevents sending multiple warning emails to the same user

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deletion_warning_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_warning
ON profiles(deletion_warning_sent_at)
WHERE deletion_warning_sent_at IS NOT NULL;

-- Comment
COMMENT ON COLUMN profiles.deletion_warning_sent_at IS 'Timestamp when 7-day deletion warning email was sent to user';

-- ============================================================================
-- FUNCTION: Get accounts needing deletion warning (7 days before deletion)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_accounts_needing_deletion_warning()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  username TEXT,
  deletion_scheduled_for TIMESTAMP WITH TIME ZONE,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.email,
    p.name,
    p.username,
    p.deletion_scheduled_for,
    EXTRACT(DAY FROM (p.deletion_scheduled_for - NOW()))::INTEGER AS days_until_deletion
  FROM profiles p
  WHERE p.account_deleted_at IS NOT NULL
    AND p.deletion_scheduled_for IS NOT NULL
    -- 7 days or less until deletion
    AND p.deletion_scheduled_for <= NOW() + INTERVAL '7 days'
    AND p.deletion_scheduled_for > NOW()
    -- Haven't sent warning yet
    AND p.deletion_warning_sent_at IS NULL
  ORDER BY p.deletion_scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_accounts_needing_deletion_warning IS 'Returns accounts that need 7-day deletion warning email (not yet sent)';

-- ============================================================================
-- FUNCTION: Mark deletion warning as sent
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_deletion_warning_sent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET deletion_warning_sent_at = NOW()
  WHERE id = user_id
    AND account_deleted_at IS NOT NULL
    AND deletion_warning_sent_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_deletion_warning_sent IS 'Marks that deletion warning email has been sent to prevent duplicates';

-- ============================================================================
-- FUNCTION: Send deletion warning emails (to be called by Edge Function)
-- ============================================================================

CREATE OR REPLACE FUNCTION send_deletion_warning_emails()
RETURNS TABLE (
  total_warnings_sent INTEGER,
  user_emails TEXT[]
) AS $$
DECLARE
  warning_count INTEGER;
  emails_sent TEXT[];
BEGIN
  -- This function will be called by an Edge Function that handles actual email sending
  -- It just returns the list of users who need warnings

  SELECT ARRAY_AGG(email) INTO emails_sent
  FROM get_accounts_needing_deletion_warning();

  warning_count := COALESCE(array_length(emails_sent, 1), 0);

  RETURN QUERY SELECT warning_count, emails_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION send_deletion_warning_emails IS 'Returns list of users needing deletion warnings for Edge Function processing';

-- ============================================================================
-- UPDATE: Reset warning when deletion is cancelled
-- ============================================================================

-- Modify the cancel_account_deletion function to also reset the warning flag
CREATE OR REPLACE FUNCTION cancel_account_deletion(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Clear deletion timestamps AND warning flag
  UPDATE profiles
  SET
    account_deleted_at = NULL,
    deletion_scheduled_for = NULL,
    deletion_warning_sent_at = NULL
  WHERE id = user_id
    AND account_deleted_at IS NOT NULL;

  -- Return true if we updated a row
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Deletion Warning System Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New column added:';
  RAISE NOTICE '  ✓ profiles.deletion_warning_sent_at';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✓ get_accounts_needing_deletion_warning()';
  RAISE NOTICE '  ✓ mark_deletion_warning_sent(user_id)';
  RAISE NOTICE '  ✓ send_deletion_warning_emails()';
  RAISE NOTICE '  ✓ cancel_account_deletion() - UPDATED';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create Edge Function to send emails';
  RAISE NOTICE '  2. Set up daily cron job';
  RAISE NOTICE '  3. Configure email template';
  RAISE NOTICE '';
  RAISE NOTICE 'To see who needs warnings:';
  RAISE NOTICE '  SELECT * FROM get_accounts_needing_deletion_warning();';
  RAISE NOTICE '';
END $$;
