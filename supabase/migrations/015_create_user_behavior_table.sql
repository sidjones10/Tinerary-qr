-- Create user_behavior table for tracking user interactions
-- This table is referenced in auth-service.ts but was missing from the schema

CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  viewed_itineraries UUID[] DEFAULT '{}',
  saved_itineraries UUID[] DEFAULT '{}',
  liked_itineraries UUID[] DEFAULT '{}',
  search_history TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX idx_user_behavior_last_active ON user_behavior(last_active_at);

-- Enable RLS
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own behavior data
CREATE POLICY "Users can view own behavior" ON user_behavior
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behavior" ON user_behavior
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own behavior" ON user_behavior
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own behavior" ON user_behavior
  FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically create user_behavior when a profile is created
CREATE OR REPLACE FUNCTION create_user_behavior_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_behavior (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_user_behavior_trigger ON profiles;

CREATE TRIGGER create_user_behavior_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_behavior_for_profile();

-- Backfill user_behavior for existing profiles
INSERT INTO user_behavior (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_behavior WHERE user_behavior.user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_behavior IS 'Tracks user behavior for personalization and recommendations';
