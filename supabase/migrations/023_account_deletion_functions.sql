-- Account Deletion Management Functions
-- Handles permanent deletion of soft-deleted accounts after grace period

-- ============================================================================
-- 0. ENSURE REQUIRED COLUMNS EXIST (from migration 013)
-- ============================================================================

-- Add columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(account_deleted_at) WHERE account_deleted_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN profiles.account_deleted_at IS 'Timestamp when account was soft-deleted';
COMMENT ON COLUMN profiles.deletion_scheduled_for IS 'Timestamp when account will be permanently deleted (30 days after soft delete)';

-- ============================================================================
-- 1. FUNCTION: Permanently delete expired accounts
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_expired_accounts()
RETURNS TABLE (
  deleted_count INTEGER,
  account_ids UUID[]
) AS $$
DECLARE
  deleted_ids UUID[];
  deleted_total INTEGER;
BEGIN
  -- Find accounts where deletion_scheduled_for date has passed
  SELECT ARRAY_AGG(id) INTO deleted_ids
  FROM profiles
  WHERE deletion_scheduled_for IS NOT NULL
    AND deletion_scheduled_for <= NOW()
    AND account_deleted_at IS NOT NULL;

  -- Count how many we'll delete
  deleted_total := COALESCE(array_length(deleted_ids, 1), 0);

  -- If there are accounts to delete
  IF deleted_total > 0 THEN
    -- Delete from auth.users (this will cascade to profiles and all related data)
    DELETE FROM auth.users
    WHERE id = ANY(deleted_ids);

    RAISE NOTICE 'Permanently deleted % expired accounts', deleted_total;
  ELSE
    RAISE NOTICE 'No expired accounts to delete';
  END IF;

  -- Return results
  RETURN QUERY SELECT deleted_total, deleted_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION delete_expired_accounts IS 'Permanently deletes accounts that have passed their 30-day grace period. Run this daily via cron job.';

-- ============================================================================
-- 2. FUNCTION: Cancel account deletion (restore account)
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_account_deletion(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Clear deletion timestamps
  UPDATE profiles
  SET
    account_deleted_at = NULL,
    deletion_scheduled_for = NULL
  WHERE id = user_id
    AND account_deleted_at IS NOT NULL;

  -- Return true if we updated a row
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancels a scheduled account deletion by clearing deletion timestamps';

-- ============================================================================
-- 3. FUNCTION: Get accounts scheduled for deletion
-- ============================================================================

CREATE OR REPLACE FUNCTION get_accounts_scheduled_for_deletion()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.email,
    p.username,
    p.account_deleted_at AS deleted_at,
    p.deletion_scheduled_for AS scheduled_for,
    EXTRACT(DAY FROM (p.deletion_scheduled_for - NOW()))::INTEGER AS days_until_deletion
  FROM profiles p
  WHERE p.account_deleted_at IS NOT NULL
    AND p.deletion_scheduled_for IS NOT NULL
  ORDER BY p.deletion_scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION get_accounts_scheduled_for_deletion IS 'Returns all accounts scheduled for deletion with days remaining';

-- ============================================================================
-- 4. TRIGGER: Auto-cancel deletion on user login
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_cancel_deletion_on_login()
RETURNS TRIGGER AS $$
BEGIN
  -- If user logs in and has a scheduled deletion, cancel it
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.user_id
      AND account_deleted_at IS NOT NULL
      AND deletion_scheduled_for IS NOT NULL
      AND deletion_scheduled_for > NOW()
  ) THEN
    -- Cancel the deletion
    UPDATE profiles
    SET
      account_deleted_at = NULL,
      deletion_scheduled_for = NULL
    WHERE id = NEW.user_id;

    RAISE NOTICE 'Account deletion cancelled for user %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth sessions (when user logs in)
DROP TRIGGER IF EXISTS trigger_auto_cancel_deletion ON auth.sessions;
CREATE TRIGGER trigger_auto_cancel_deletion
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_cancel_deletion_on_login();

-- Comment
COMMENT ON FUNCTION auto_cancel_deletion_on_login IS 'Automatically cancels account deletion if user logs in during grace period';

-- ============================================================================
-- 5. RLS POLICY: Hide soft-deleted accounts from public view
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Hide soft-deleted profiles from public" ON profiles;

-- Create policy to hide soft-deleted accounts
CREATE POLICY "Hide soft-deleted profiles from public" ON profiles
  FOR SELECT
  USING (
    account_deleted_at IS NULL
    OR auth.uid() = id  -- Users can still see their own deleted profile
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Account Deletion Functions Created!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✓ delete_expired_accounts() - Permanently delete expired accounts';
  RAISE NOTICE '  ✓ cancel_account_deletion(user_id) - Restore an account';
  RAISE NOTICE '  ✓ get_accounts_scheduled_for_deletion() - View pending deletions';
  RAISE NOTICE '  ✓ auto_cancel_deletion_on_login() - Auto-restore on login';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Set up a cron job to run delete_expired_accounts() daily';
  RAISE NOTICE '  2. Test the deletion flow in the UI';
  RAISE NOTICE '';
  RAISE NOTICE 'To manually run cleanup:';
  RAISE NOTICE '  SELECT * FROM delete_expired_accounts();';
  RAISE NOTICE '';
  RAISE NOTICE 'To view pending deletions:';
  RAISE NOTICE '  SELECT * FROM get_accounts_scheduled_for_deletion();';
  RAISE NOTICE '';
END $$;
