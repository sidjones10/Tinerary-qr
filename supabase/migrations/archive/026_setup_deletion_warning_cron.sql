-- Setup Cron Job for Deletion Warning Emails
-- Sends 7-day warnings to users before account deletion

-- ============================================================================
-- NOTE: Calling HTTP endpoints from PostgreSQL cron requires additional setup
-- ============================================================================
--
-- This migration provides the database foundation. To actually send emails,
-- you need to set up ONE of the following:
--
-- Option 1: Vercel Cron Jobs (Recommended for Next.js on Vercel)
--   - Add to vercel.json:
--     {
--       "crons": [{
--         "path": "/api/cron/send-deletion-warnings",
--         "schedule": "0 3 * * *"
--       }]
--     }
--
-- Option 2: Supabase Edge Function + pg_cron
--   - Create Edge Function that calls sendAccountDeletionWarningEmail
--   - Schedule with pg_cron to call Edge Function
--
-- Option 3: GitHub Actions
--   - Create workflow that runs daily
--   - Calls your API endpoint with CRON_SECRET
--
-- Option 4: External service (cron-job.org, etc.)
--   - Set up daily job to POST to your endpoint
--
-- ============================================================================

-- Drop and recreate the account_deletion_monitoring view to include warning status
DROP VIEW IF EXISTS account_deletion_monitoring;

CREATE VIEW account_deletion_monitoring AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE account_deleted_at IS NOT NULL) AS accounts_pending_deletion,
  (SELECT COUNT(*) FROM profiles WHERE deletion_scheduled_for IS NOT NULL AND deletion_scheduled_for <= NOW()) AS accounts_ready_for_deletion,
  (SELECT COUNT(*) FROM profiles WHERE deletion_scheduled_for IS NOT NULL AND deletion_scheduled_for <= NOW() + INTERVAL '7 days' AND deletion_scheduled_for > NOW() AND deletion_warning_sent_at IS NULL) AS accounts_needing_warning,
  (SELECT COUNT(*) FROM profiles WHERE deletion_warning_sent_at IS NOT NULL) AS warnings_sent,
  (SELECT MAX(deletion_scheduled_for) FROM profiles WHERE deletion_scheduled_for IS NOT NULL) AS next_deletion_date,
  (SELECT schedule FROM cron.job WHERE jobname = 'delete-expired-accounts-daily') AS deletion_cron_schedule,
  (SELECT active FROM cron.job WHERE jobname = 'delete-expired-accounts-daily') AS deletion_cron_active;

COMMENT ON VIEW account_deletion_monitoring IS 'Monitor account deletion status including warning email tracking';

-- ============================================================================
-- Manually trigger deletion warnings (for testing)
-- ============================================================================

-- Function to manually send warnings (returns SQL to run via Edge Function/API)
CREATE OR REPLACE FUNCTION trigger_deletion_warnings_manual()
RETURNS TEXT AS $$
DECLARE
  warning_info TEXT;
BEGIN
  SELECT INTO warning_info
    format(
      'Found %s accounts needing deletion warnings. Call POST /api/cron/send-deletion-warnings to send emails.',
      COUNT(*)
    )
  FROM get_accounts_needing_deletion_warning();

  RETURN warning_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_deletion_warnings_manual IS 'Returns info about accounts needing warnings - use API endpoint to actually send';

-- ============================================================================
-- SUCCESS MESSAGE & INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Deletion Warning Cron Foundation Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database functions are ready:';
  RAISE NOTICE '  ✓ get_accounts_needing_deletion_warning()';
  RAISE NOTICE '  ✓ mark_deletion_warning_sent(user_id)';
  RAISE NOTICE '  ✓ send_deletion_warning_emails()';
  RAISE NOTICE '  ✓ trigger_deletion_warnings_manual()';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated views:';
  RAISE NOTICE '  ✓ account_deletion_monitoring (now includes warning counts)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS - Choose one cron setup method:';
  RAISE NOTICE '';
  RAISE NOTICE '1. VERCEL CRON (Recommended):';
  RAISE NOTICE '   Add to vercel.json:';
  RAISE NOTICE '   {';
  RAISE NOTICE '     "crons": [{';
  RAISE NOTICE '       "path": "/api/cron/send-deletion-warnings",';
  RAISE NOTICE '       "schedule": "0 3 * * *"';
  RAISE NOTICE '     }]';
  RAISE NOTICE '   }';
  RAISE NOTICE '';
  RAISE NOTICE '2. MANUAL TESTING:';
  RAISE NOTICE '   - GET /api/cron/send-deletion-warnings (dry run)';
  RAISE NOTICE '   - POST /api/cron/send-deletion-warnings (send emails)';
  RAISE NOTICE '';
  RAISE NOTICE '3. MONITORING:';
  RAISE NOTICE '   SELECT * FROM account_deletion_monitoring;';
  RAISE NOTICE '   SELECT * FROM get_accounts_needing_deletion_warning();';
  RAISE NOTICE '';
  RAISE NOTICE 'See docs/DELETION_WARNING_EMAILS.md for full setup guide';
  RAISE NOTICE '';
END $$;
