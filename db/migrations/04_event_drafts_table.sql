-- Create event_drafts table for saving progress
CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  type TEXT NOT NULL DEFAULT 'event',
  is_public BOOLEAN NOT NULL DEFAULT true,
  activities JSONB DEFAULT '[]'::jsonb,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_saved TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS event_drafts_user_id_idx ON event_drafts(user_id);

-- Add RLS policies
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

-- Policy for selecting drafts (users can only see their own drafts)
CREATE POLICY select_own_drafts ON event_drafts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting drafts (users can only insert their own drafts)
CREATE POLICY insert_own_drafts ON event_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating drafts (users can only update their own drafts)
CREATE POLICY update_own_drafts ON event_drafts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting drafts (users can only delete their own drafts)
CREATE POLICY delete_own_drafts ON event_drafts
  FOR DELETE USING (auth.uid() = user_id);
