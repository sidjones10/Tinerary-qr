-- Create comments table for itineraries
-- Supports threading with parent_comment_id

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_itinerary_id ON comments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_metrics
  SET comment_count = comment_count + 1, updated_at = NOW()
  WHERE itinerary_id = NEW.itinerary_id;

  -- Create metrics row if it doesn't exist
  INSERT INTO itinerary_metrics (itinerary_id, comment_count)
  VALUES (NEW.itinerary_id, 1)
  ON CONFLICT (itinerary_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_metrics
  SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW()
  WHERE itinerary_id = OLD.itinerary_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update comment count
CREATE TRIGGER comment_count_increment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER comment_count_decrement
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION decrement_comment_count();

-- Add comment for documentation
COMMENT ON TABLE comments IS 'Comments on itineraries with support for threading via parent_comment_id';
COMMENT ON COLUMN comments.parent_comment_id IS 'NULL for top-level comments, references parent comment for replies';
COMMENT ON COLUMN comments.is_edited IS 'True if comment has been edited after creation';
