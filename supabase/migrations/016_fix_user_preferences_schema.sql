-- Fix user_preferences table schema mismatches
-- Code expects preferred_destinations and preferred_activities columns

-- Add missing columns
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS preferred_destinations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_activities TEXT[] DEFAULT '{}';

-- Migrate data from preferred_locations to preferred_destinations if needed
UPDATE user_preferences
SET preferred_destinations = preferred_locations
WHERE preferred_destinations = '{}' AND preferred_locations IS NOT NULL AND preferred_locations != '{}';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON COLUMN user_preferences.preferred_destinations IS 'User preferred travel destinations';
COMMENT ON COLUMN user_preferences.preferred_activities IS 'User preferred activity types';
