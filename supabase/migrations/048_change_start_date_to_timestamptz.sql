-- Migration: Change start_date and end_date from DATE to TIMESTAMPTZ
-- This allows storing event times (e.g. "2026-02-21T14:30:00") so that
-- countdown reminders fire at the correct time instead of midnight.

-- Itineraries table
ALTER TABLE itineraries
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ,
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ;

-- Drafts table
ALTER TABLE drafts
  ALTER COLUMN start_date TYPE TIMESTAMPTZ USING start_date::TIMESTAMPTZ,
  ALTER COLUMN end_date TYPE TIMESTAMPTZ USING end_date::TIMESTAMPTZ;
