-- Migration: Add time column and activity-level reminder support.
--
-- 1. Add a time column to itineraries and drafts so the main event time
--    is stored separately from start_date (which is DATE type).
--    The reminder service combines start_date + time to compute countdowns.
--    When time is NULL, only day-based reminders (5d, 2d, 1d) fire.
--
-- 2. Add activity_id to itinerary_reminders so we can track reminders
--    sent for individual activities/stops (which already have start_time
--    as TIMESTAMPTZ in the activities table).

-- Time column for the main event
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS time TEXT;

-- Activity-level reminder tracking
ALTER TABLE itinerary_reminders ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Drop the old unique constraint and create a new one that includes activity_id
-- The old constraint was: UNIQUE(itinerary_id, user_id, reminder_type)
-- The new one allows per-activity tracking while keeping itinerary-level reminders working (activity_id = NULL)
ALTER TABLE itinerary_reminders DROP CONSTRAINT IF EXISTS itinerary_reminders_itinerary_id_user_id_reminder_type_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_itinerary_reminders_unique
  ON itinerary_reminders (itinerary_id, user_id, reminder_type, COALESCE(activity_id, '00000000-0000-0000-0000-000000000000'));

-- Index for efficient activity reminder queries
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_itinerary_reminders_activity_id ON itinerary_reminders(activity_id);
