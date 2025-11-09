-- Add settings columns to user_preferences table
-- This migration adds JSONB columns for storing user settings preferences

-- Add notification preferences column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;

-- Add appearance preferences column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS appearance_preferences JSONB DEFAULT '{}'::jsonb;

-- Add privacy preferences column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS privacy_preferences JSONB DEFAULT '{}'::jsonb;

-- Add language preferences column
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preferences JSONB DEFAULT '{}'::jsonb;

-- Add comments explaining the structure
COMMENT ON COLUMN user_preferences.notification_preferences IS 'Stores notification settings like push, email, SMS, and category preferences';
COMMENT ON COLUMN user_preferences.appearance_preferences IS 'Stores appearance settings like theme, color scheme, font size, and layout';
COMMENT ON COLUMN user_preferences.privacy_preferences IS 'Stores privacy settings like location sharing, activity status, and data collection preferences';
COMMENT ON COLUMN user_preferences.language_preferences IS 'Stores language and region settings like language, timezone, date format, and currency';
