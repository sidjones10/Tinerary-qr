-- Add user_behavior table for discovery algorithm analytics
-- Run this in Supabase SQL Editor

-- Drop existing constraint if it references auth.users
ALTER TABLE IF EXISTS user_behavior DROP CONSTRAINT IF EXISTS user_behavior_user_id_fkey;

-- Create user_behavior table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  viewed_itineraries UUID[] DEFAULT '{}',
  saved_itineraries UUID[] DEFAULT '{}',
  liked_itineraries UUID[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles (profiles is more reliable than auth.users)
DO $$
BEGIN
  -- Try to add foreign key to profiles table
  BEGIN
    ALTER TABLE user_behavior
    ADD CONSTRAINT user_behavior_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint to profiles';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Foreign key constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
  END;
END $$;

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

-- Backfill for existing users (use profiles table, not auth.users)
INSERT INTO user_behavior (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_behavior WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_behavior TO authenticated;
GRANT SELECT ON user_behavior TO anon;
