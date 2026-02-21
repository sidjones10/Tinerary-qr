-- Migration: Add a dedicated time column to itineraries and drafts.
-- start_date remains DATE. The time column stores the event time as
-- a TEXT value in HH:MM format (e.g. "14:30"). The reminder service
-- combines start_date + time to compute the exact event datetime.
-- When time is NULL, day-based reminders (5d, 2d, 1d) still fire
-- using midnight as the reference point.

ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS time TEXT;
