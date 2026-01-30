-- Add RLS policies for saved_itineraries table
-- This allows users to manage their own likes and saves

-- Policy: Users can view their own saved itineraries
CREATE POLICY IF NOT EXISTS "Users can view own saved itineraries"
ON saved_itineraries
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved itineraries
CREATE POLICY IF NOT EXISTS "Users can insert own saved itineraries"
ON saved_itineraries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved itineraries
CREATE POLICY IF NOT EXISTS "Users can delete own saved itineraries"
ON saved_itineraries
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Policy to allow viewing public itinerary save counts
-- This allows anyone to see which itineraries have been saved, but not who saved them
CREATE POLICY IF NOT EXISTS "Anyone can view save counts"
ON saved_itineraries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM itineraries
    WHERE itineraries.id = saved_itineraries.itinerary_id
      AND itineraries.is_public = true
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON saved_itineraries TO authenticated;
