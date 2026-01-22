-- Migration: Add Following System
-- Allows users to follow each other for social features

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent users from following themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),

  -- Prevent duplicate follows
  UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Add follower/following counts to profiles (optional, for caching)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;

    -- Increment followers count for following
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;

    -- Decrement followers count for following
    UPDATE profiles
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.following_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON follows;
CREATE TRIGGER update_follower_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- RLS Policies for follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can see all follows (for public profiles)
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Helper function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(
  p_follower_id UUID,
  p_following_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_follower_id
    AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get mutual followers
CREATE OR REPLACE FUNCTION get_mutual_followers(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.username,
    p.avatar_url
  FROM profiles p
  INNER JOIN follows f1 ON f1.following_id = p.id
  INNER JOIN follows f2 ON f2.following_id = p.id
  WHERE f1.follower_id = p_user_id
  AND f2.follower_id = p_other_user_id
  AND p.id != p_user_id
  AND p.id != p_other_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get followers list
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ,
  is_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    f.created_at as followed_at,
    is_following(auth.uid(), p.id) as is_following
  FROM follows f
  INNER JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following list
CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  followed_at TIMESTAMPTZ,
  is_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    f.created_at as followed_at,
    is_following(auth.uid(), p.id) as is_following
  FROM follows f
  INNER JOIN profiles p ON p.id = f.following_id
  WHERE f.follower_id = p_user_id
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_following(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_followers(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_followers(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following(UUID, INT, INT) TO authenticated;

-- Comments
COMMENT ON TABLE follows IS 'Stores user following relationships';
COMMENT ON FUNCTION is_following IS 'Check if a user is following another user';
COMMENT ON FUNCTION get_mutual_followers IS 'Get users followed by both users';
COMMENT ON FUNCTION get_followers IS 'Get list of users following a specific user';
COMMENT ON FUNCTION get_following IS 'Get list of users a specific user is following';

-- Done!
SELECT 'Following system created successfully! ✓' as status;
