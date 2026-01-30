-- Migration: Create itinerary_attendees table
-- This table tracks who is part of an itinerary for expense splitting

-- Create itinerary_attendees table
CREATE TABLE IF NOT EXISTS itinerary_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_attendees_itinerary ON itinerary_attendees(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_attendees_user ON itinerary_attendees(user_id);

-- Enable RLS
ALTER TABLE itinerary_attendees ENABLE ROW LEVEL SECURITY;

-- Anyone can view attendees for public itineraries
DROP POLICY IF EXISTS "Anyone can view attendees for public itineraries" ON itinerary_attendees;
CREATE POLICY "Anyone can view attendees for public itineraries"
  ON itinerary_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.is_public = true
    )
  );

-- Users can view attendees for their own itineraries
DROP POLICY IF EXISTS "Users can view attendees for own itineraries" ON itinerary_attendees;
CREATE POLICY "Users can view attendees for own itineraries"
  ON itinerary_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Itinerary owners can add attendees
DROP POLICY IF EXISTS "Owners can add attendees" ON itinerary_attendees;
CREATE POLICY "Owners can add attendees"
  ON itinerary_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Itinerary owners can update attendees
DROP POLICY IF EXISTS "Owners can update attendees" ON itinerary_attendees;
CREATE POLICY "Owners can update attendees"
  ON itinerary_attendees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Itinerary owners can remove attendees
DROP POLICY IF EXISTS "Owners can remove attendees" ON itinerary_attendees;
CREATE POLICY "Owners can remove attendees"
  ON itinerary_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Function to auto-add owner as attendee when itinerary is created
CREATE OR REPLACE FUNCTION add_owner_as_attendee()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the itinerary owner as an attendee with 'owner' role
  INSERT INTO itinerary_attendees (itinerary_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner')
  ON CONFLICT (itinerary_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-add owner as attendee
DROP TRIGGER IF EXISTS add_owner_as_attendee_trigger ON itineraries;
CREATE TRIGGER add_owner_as_attendee_trigger
AFTER INSERT ON itineraries
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_attendee();

-- Migrate existing itineraries: add their owners as attendees
INSERT INTO itinerary_attendees (itinerary_id, user_id, role)
SELECT id, user_id, 'owner'
FROM itineraries
ON CONFLICT (itinerary_id, user_id) DO NOTHING;

-- Comments
COMMENT ON TABLE itinerary_attendees IS 'Tracks who is part of an itinerary (for invitations, expense splitting, etc)';
COMMENT ON COLUMN itinerary_attendees.role IS 'Role of the attendee: owner, admin, or member';

SELECT 'Itinerary attendees table created successfully! ✓' as status;
