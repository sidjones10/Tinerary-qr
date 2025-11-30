-- Setup Cron Job for Account Deletion
-- Runs daily to permanently delete accounts after 30-day grace period

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if it exists (to avoid duplicates)
SELECT cron.unschedule('delete-expired-accounts-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-accounts-daily'
);

-- Schedule the job to run daily at 2:00 AM UTC
SELECT cron.schedule(
  'delete-expired-accounts-daily',  -- Job name
  '0 2 * * *',                       -- Cron expression: Every day at 2:00 AM
  $$SELECT delete_expired_accounts();$$  -- SQL to execute
);

-- ============================================================================
-- VERIFICATION & DOCUMENTATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Account Deletion Cron Job Scheduled!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cron Job Details:';
  RAISE NOTICE '  Name: delete-expired-accounts-daily';
  RAISE NOTICE '  Schedule: Daily at 2:00 AM UTC';
  RAISE NOTICE '  Action: Permanently delete accounts past grace period';
  RAISE NOTICE '';
  RAISE NOTICE 'To view all cron jobs:';
  RAISE NOTICE '  SELECT * FROM cron.job;';
  RAISE NOTICE '';
  RAISE NOTICE 'To manually run the cleanup now:';
  RAISE NOTICE '  SELECT * FROM delete_expired_accounts();';
  RAISE NOTICE '';
  RAISE NOTICE 'To unschedule the job:';
  RAISE NOTICE '  SELECT cron.unschedule(''delete-expired-accounts-daily'');';
  RAISE NOTICE '';
END $$;

-- Create a view to easily monitor the cron job
CREATE OR REPLACE VIEW account_deletion_monitoring AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE account_deleted_at IS NOT NULL) AS accounts_pending_deletion,
  (SELECT COUNT(*) FROM profiles WHERE deletion_scheduled_for IS NOT NULL AND deletion_scheduled_for <= NOW()) AS accounts_ready_for_deletion,
  (SELECT MAX(deletion_scheduled_for) FROM profiles WHERE deletion_scheduled_for IS NOT NULL) AS next_deletion_date,
  (SELECT schedule FROM cron.job WHERE jobname = 'delete-expired-accounts-daily') AS cron_schedule,
  (SELECT active FROM cron.job WHERE jobname = 'delete-expired-accounts-daily') AS cron_active;

COMMENT ON VIEW account_deletion_monitoring IS 'Monitor account deletion status and cron job health';
