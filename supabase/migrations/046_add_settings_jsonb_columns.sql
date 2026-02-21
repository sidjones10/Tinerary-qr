-- Add JSONB settings columns to user_preferences table
-- These columns were defined in an archived migration that was never applied

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS appearance_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS privacy_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preferences JSONB DEFAULT '{}'::jsonb;
