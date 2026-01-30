-- Add type column to saved_itineraries table
-- This column distinguishes between 'like' and 'save' actions

-- Step 1: Add the type column with default value
ALTER TABLE saved_itineraries
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'save';

-- Step 2: Create an index on the type column for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_type ON saved_itineraries(type);

-- Step 3: Update the unique constraint to allow users to both like AND save the same itinerary
-- First, drop the old unique constraint
ALTER TABLE saved_itineraries DROP CONSTRAINT IF EXISTS saved_itineraries_user_id_itinerary_id_key;

-- Then, add a new unique constraint that includes type
ALTER TABLE saved_itineraries
ADD CONSTRAINT saved_itineraries_user_itinerary_type_unique
UNIQUE (user_id, itinerary_id, type);

-- Step 4: Add a check constraint to ensure type is either 'like' or 'save'
ALTER TABLE saved_itineraries
ADD CONSTRAINT saved_itineraries_type_check
CHECK (type IN ('like', 'save'));

-- Step 5: Add comment for documentation
COMMENT ON COLUMN saved_itineraries.type IS 'Type of saved item: like (favorited) or save (bookmarked)';

-- Step 6: Grant necessary permissions (already covered by table-level RLS but being explicit)
-- Permissions are handled by RLS policies on the table
