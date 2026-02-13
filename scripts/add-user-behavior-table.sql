-- Add user_behavior table for discovery algorithm analytics
-- Run this in Supabase SQL Editor

-- Create user_behavior table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_itineraries UUID[] DEFAULT '{}',
  saved_itineraries UUID[] DEFAULT '{}',
  liked_itineraries UUID[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);

-- Enable RLS
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own behavior" ON user_behavior;
CREATE POLICY "Users can view own behavior"
  ON user_behavior FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own behavior" ON user_behavior;
CREATE POLICY "Users can insert own behavior"
  ON user_behavior FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own behavior" ON user_behavior;
CREATE POLICY "Users can update own behavior"
  ON user_behavior FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-create user_behavior record when a new user is created
CREATE OR REPLACE FUNCTION create_user_behavior_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_behavior (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create behavior record on new profile
DROP TRIGGER IF EXISTS on_profile_created_behavior ON profiles;
CREATE TRIGGER on_profile_created_behavior
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_behavior_on_signup();

-- Backfill for existing users
INSERT INTO user_behavior (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_behavior)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_behavior TO authenticated;
GRANT SELECT ON user_behavior TO anon;
