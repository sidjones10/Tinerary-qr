# Trip & Event Countdown Reminders

## Overview

Users receive countdown reminder notifications as their event approaches. Reminders are sent as both in-app notifications and emails (for major milestones).

## Reminder Intervals

| Type | Before event | Email? |
|------|-------------|--------|
| `5_days` | 5 days | Yes |
| `2_days` | 2 days | Yes |
| `1_day` | 1 day | Yes |
| `15_hours` | 15 hours | No |
| `10_hours` | 10 hours | No |
| `5_hours` | 5 hours | No |
| `2_hours` | 2 hours | Yes |
| `45_minutes` | 45 minutes | No |
| `20_minutes` | 20 minutes | No |
| `10_minutes` | 10 minutes | No |
| `5_minutes` | 5 minutes | No |
| `started` | Event time | Yes |
| `post_event_cover` | 1 day after | No |

Activity-level reminders use the short-range subset: 45m, 20m, 10m, 5m, started.

If an itinerary has no specific **time** set, only day-based reminders (5d, 2d, 1d) are sent.

## Architecture

```
pg_cron (every minute)
  -> pg_net HTTP POST
    -> /api/reminders/send (Vercel function)
      -> reminder-service.ts
        -> in-app notification (INSERT into notifications)
        -> email via Resend (major milestones only)
        -> record in itinerary_reminders (deduplication)
```

### Why pg_cron instead of Vercel Cron?

Vercel limits cron jobs by plan (Hobby: 2 jobs, daily minimum; Pro: quota-based). The reminder system needs to run every minute, which exceeds those limits. Supabase pg_cron has no frequency restrictions and runs inside your existing database.

## Database Tables

### `itinerary_reminders`
Tracks which reminders have been sent to prevent duplicates.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `itinerary_id` | UUID | FK to itineraries |
| `user_id` | UUID | FK to profiles |
| `activity_id` | UUID | FK to activities (nullable) |
| `reminder_type` | TEXT | e.g. `5_days`, `started` |
| `sent_at` | TIMESTAMPTZ | When the reminder was sent |

**Unique constraint:** `(itinerary_id, user_id, reminder_type)` — prevents sending the same reminder twice.

### Itinerary columns

- `countdown_reminders_enabled` (BOOLEAN, default true) — user toggle
- `last_reminder_sent` (TIMESTAMPTZ) — tracks last send time
- `cover_update_prompted` (BOOLEAN) — post-event cover photo prompt

## Setup

### 1. Run migrations

Ensure migrations 029 and 049 have been applied:

- **029** creates the `itinerary_reminders` table and adds columns
- **049** sets up pg_cron + pg_net scheduling

### 2. Configure Supabase Vault secrets

In the Supabase SQL Editor, run:

```sql
-- Your production app URL
SELECT vault.create_secret(
  'https://your-app.vercel.app',
  'app_url',
  'Production app URL for pg_cron callbacks'
);

-- Your CRON_SECRET env variable value
SELECT vault.create_secret(
  'your-cron-secret-value',
  'cron_secret',
  'Auth token for cron endpoint'
);
```

### 3. Verify the cron job

```sql
-- Check it's scheduled
SELECT * FROM cron.job WHERE jobname = 'send-reminder-notifications';

-- Check recent runs
SELECT * FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-reminder-notifications')
  ORDER BY start_time DESC LIMIT 10;
```

### Pausing / resuming

```sql
-- Pause
SELECT cron.unschedule('send-reminder-notifications');

-- Resume
SELECT cron.schedule(
  'send-reminder-notifications',
  '* * * * *',
  $$SELECT invoke_reminder_endpoint()$$
);
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/reminder-utils.ts` | Pure utility functions (intervals, formatting) — client-safe |
| `lib/reminder-service.ts` | Server-side logic (DB queries, notification sends) |
| `app/api/reminders/send/route.ts` | API endpoint called by pg_cron |
| `supabase/migrations/029_add_countdown_reminders.sql` | Schema migration |
| `supabase/migrations/049_move_reminders_to_pg_cron.sql` | pg_cron setup |

## User Controls

Users can toggle reminders per itinerary via the `countdown_reminders_enabled` field. The global `tripReminders` preference in `user_preferences.notification_preferences` controls whether any reminders are delivered at all.
