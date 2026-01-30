-- Add RLS policies for saved_itineraries table
-- This allows users to manage their own likes and saves

\echo '';
\echo '========================================';
\echo 'Adding RLS policies to saved_itineraries';
\echo '========================================';
\echo '';

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

\echo '';
\echo '✓ RLS policies created successfully';
\echo '';
\echo 'Policies created:';
\echo '  ✓ Users can view own saved itineraries';
\echo '  ✓ Users can insert own saved itineraries';
\echo '  ✓ Users can delete own saved itineraries';
\echo '  ✓ Anyone can view save counts for public itineraries';
\echo '';
\echo 'Users can now:';
\echo '  - Like/unlike itineraries';
\echo '  - Save/unsave itineraries';
\echo '  - View their own likes and saves';
\echo '';
