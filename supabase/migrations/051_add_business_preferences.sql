-- Add business_preferences JSONB column to user_preferences table
-- Stores the professional account toggle state and selected account type

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS business_preferences JSONB DEFAULT '{}'::jsonb;
