-- ============================================================================
-- Migration 049: Move reminder cron from Vercel to Supabase pg_cron
-- ============================================================================
--
-- Problem: Vercel limits cron jobs (Hobby: 2 jobs, daily minimum; Pro: quota).
-- The reminders endpoint was running every minute via Vercel cron — too
-- aggressive for those limits.
--
-- Solution: Use Supabase's built-in pg_cron + pg_net to call the existing
-- /api/reminders/send endpoint every minute. All reminder logic (in-app
-- notifications, emails, deduplication) stays unchanged in the Next.js app.
--
-- SETUP REQUIRED after running this migration:
--
--   1. Store your app URL in Supabase Vault:
--
--        SELECT vault.create_secret(
--          'https://your-app.vercel.app',
--          'app_url',
--          'Production app URL for pg_cron callbacks'
--        );
--
--   2. Store your cron secret in Supabase Vault:
--
--        SELECT vault.create_secret(
--          'your-cron-secret-value',
--          'cron_secret',
--          'Auth token for cron endpoint'
--        );
--
--   3. Remove the reminders cron entry from vercel.json (already done in
--      this commit — just keep the deletion-warnings cron if needed).
--
-- To verify the cron is running:
--
--   SELECT * FROM cron.job WHERE jobname = 'send-reminder-notifications';
--   SELECT * FROM cron.job_run_details
--     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-reminder-notifications')
--     ORDER BY start_time DESC LIMIT 10;
--
-- To pause/resume:
--
--   SELECT cron.unschedule('send-reminder-notifications');        -- pause
--   SELECT cron.schedule('send-reminder-notifications',           -- resume
--     '* * * * *', $$SELECT invoke_reminder_endpoint()$$);
--
-- ============================================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Function that calls the reminder endpoint via pg_net
CREATE OR REPLACE FUNCTION invoke_reminder_endpoint()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _app_url TEXT;
  _cron_secret TEXT;
BEGIN
  -- Read secrets from Vault
  SELECT decrypted_secret INTO _app_url
    FROM vault.decrypted_secrets WHERE name = 'app_url';

  SELECT decrypted_secret INTO _cron_secret
    FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  -- Validate config — skip silently if not configured yet
  IF _app_url IS NULL THEN
    RAISE WARNING '[reminder-cron] app_url not found in vault. Run: SELECT vault.create_secret(''https://your-app.vercel.app'', ''app_url'');';
    RETURN;
  END IF;

  -- Fire-and-forget POST to the reminder endpoint
  PERFORM net.http_post(
    url    := _app_url || '/api/reminders/send',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(_cron_secret, '')
    ),
    body   := '{}'::jsonb
  );
END;
$$;

-- 3. Schedule: run every minute
SELECT cron.schedule(
  'send-reminder-notifications',
  '* * * * *',
  $$SELECT invoke_reminder_endpoint()$$
);

-- 4. Success notice
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Reminder cron migrated to pg_cron';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Add secrets to Supabase Vault (see migration header)';
  RAISE NOTICE '  2. Remove the reminders cron from vercel.json';
  RAISE NOTICE '  3. Verify: SELECT * FROM cron.job;';
  RAISE NOTICE '';
END $$;
