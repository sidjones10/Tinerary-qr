-- Migration: Add Photo Albums System
-- Allows users to upload and share photos for their events

-- Create photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_photos_itinerary ON event_photos(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_user ON event_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_created_at ON event_photos(created_at DESC);

-- Add photo count to itineraries
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

-- Function to update photo count
CREATE OR REPLACE FUNCTION update_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE itineraries
    SET photo_count = photo_count + 1
    WHERE id = NEW.itinerary_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE itineraries
    SET photo_count = GREATEST(photo_count - 1, 0)
    WHERE id = OLD.itinerary_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update photo count
DROP TRIGGER IF EXISTS update_photo_count_trigger ON event_photos;
CREATE TRIGGER update_photo_count_trigger
AFTER INSERT OR DELETE ON event_photos
FOR EACH ROW
EXECUTE FUNCTION update_photo_count();

-- RLS Policies for event_photos table
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Users can view photos for public itineraries
CREATE POLICY "Anyone can view photos for public itineraries"
  ON event_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = event_photos.itinerary_id
      AND itineraries.is_public = true
    )
  );

-- Users can view photos for their own itineraries
CREATE POLICY "Users can view photos for their own itineraries"
  ON event_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = event_photos.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can upload photos to their own itineraries
CREATE POLICY "Users can upload photos to their own itineraries"
  ON event_photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = event_photos.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON event_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own photos (caption, etc.)
CREATE POLICY "Users can update their own photos"
  ON event_photos FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage bucket for photos (run this in Supabase dashboard or via supabase CLI)
-- This is informational - you'll need to create the bucket manually
-- Bucket name: event-photos
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Comments
COMMENT ON TABLE event_photos IS 'Stores photos uploaded for events and trips';
COMMENT ON COLUMN event_photos.storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN event_photos.url IS 'Public URL for accessing the photo';
COMMENT ON COLUMN event_photos.caption IS 'Optional caption or description';

-- Done!
SELECT 'Photo albums system created successfully! ✓' as status;
