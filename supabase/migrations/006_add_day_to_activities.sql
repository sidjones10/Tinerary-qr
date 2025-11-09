-- Add day column to activities table
-- This allows activities to be organized by day for multi-day trips

ALTER TABLE activities ADD COLUMN IF NOT EXISTS day TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_day ON activities(day);
