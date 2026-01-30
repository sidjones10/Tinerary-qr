-- Comprehensive fix for the likes system
-- This script fixes the saved_itineraries table structure and permissions

\echo '';
\echo '╔════════════════════════════════════════╗';
\echo '║   Fixing Likes System                 ║';
\echo '╚════════════════════════════════════════╝';
\echo '';

-- ====================================================================================
-- STEP 1: Add type column to saved_itineraries
-- ====================================================================================

\echo '→ Step 1: Adding type column to saved_itineraries...';

-- Add the type column with default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'saved_itineraries'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE saved_itineraries ADD COLUMN type TEXT DEFAULT 'save';
    RAISE NOTICE '  ✓ Type column added';
  ELSE
    RAISE NOTICE '  ✓ Type column already exists';
  END IF;
END $$;

-- Create index on type column
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_type ON saved_itineraries(type);

-- Drop old unique constraint if it exists
DO $$
BEGIN
  ALTER TABLE saved_itineraries DROP CONSTRAINT IF EXISTS saved_itineraries_user_id_itinerary_id_key;
  RAISE NOTICE '  ✓ Old unique constraint removed';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE '  ✓ Old constraint did not exist';
END $$;

-- Add new unique constraint that includes type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'saved_itineraries_user_itinerary_type_unique'
  ) THEN
    ALTER TABLE saved_itineraries
    ADD CONSTRAINT saved_itineraries_user_itinerary_type_unique
    UNIQUE (user_id, itinerary_id, type);
    RAISE NOTICE '  ✓ New unique constraint added (allows both like and save)';
  ELSE
    RAISE NOTICE '  ✓ Unique constraint already exists';
  END IF;
END $$;

-- Add check constraint for type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'saved_itineraries_type_check'
  ) THEN
    ALTER TABLE saved_itineraries
    ADD CONSTRAINT saved_itineraries_type_check
    CHECK (type IN ('like', 'save'));
    RAISE NOTICE '  ✓ Check constraint added (type must be like or save)';
  ELSE
    RAISE NOTICE '  ✓ Check constraint already exists';
  END IF;
END $$;

-- ====================================================================================
-- STEP 2: Add RLS policies for saved_itineraries
-- ====================================================================================

\echo '';
\echo '→ Step 2: Adding RLS policies...';

-- Drop existing policies to recreate them (in case they need updating)
DROP POLICY IF EXISTS "Users can view own saved itineraries" ON saved_itineraries;
DROP POLICY IF EXISTS "Users can insert own saved itineraries" ON saved_itineraries;
DROP POLICY IF EXISTS "Users can delete own saved itineraries" ON saved_itineraries;
DROP POLICY IF EXISTS "Anyone can view save counts" ON saved_itineraries;

-- Policy: Users can view their own saved itineraries
CREATE POLICY "Users can view own saved itineraries"
ON saved_itineraries
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved itineraries
CREATE POLICY "Users can insert own saved itineraries"
ON saved_itineraries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved itineraries
CREATE POLICY "Users can delete own saved itineraries"
ON saved_itineraries
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Allow viewing public itinerary save counts
CREATE POLICY "Anyone can view save counts"
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

RAISE NOTICE '  ✓ RLS policies created';

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON saved_itineraries TO authenticated;
RAISE NOTICE '  ✓ Permissions granted';

-- ====================================================================================
-- STEP 3: Verify the setup
-- ====================================================================================

\echo '';
\echo '→ Step 3: Verifying setup...';

-- Check if type column exists
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'saved_itineraries'
      AND column_name = 'type'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '  ✓ Type column exists';
  ELSE
    RAISE WARNING '  ✗ Type column missing!';
  END IF;
END $$;

-- Check if toggle_like function exists
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'toggle_like'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE NOTICE '  ✓ toggle_like function exists';
  ELSE
    RAISE WARNING '  ✗ toggle_like function missing! Run migration 007_likes_system.sql';
  END IF;
END $$;

-- Check if user_has_liked function exists
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'user_has_liked'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE NOTICE '  ✓ user_has_liked function exists';
  ELSE
    RAISE WARNING '  ✗ user_has_liked function missing! Run migration 007_likes_system.sql';
  END IF;
END $$;

-- Count RLS policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  FROM pg_policies
  WHERE tablename = 'saved_itineraries'
  INTO policy_count;

  RAISE NOTICE '  ✓ % RLS policies configured', policy_count;

  IF policy_count < 3 THEN
    RAISE WARNING '  ⚠ Expected at least 3 policies, found %', policy_count;
  END IF;
END $$;

-- ====================================================================================
-- SUCCESS!
-- ====================================================================================

\echo '';
\echo '╔════════════════════════════════════════╗';
\echo '║   ✓ Likes System Fixed!               ║';
\echo '╚════════════════════════════════════════╝';
\echo '';
\echo 'What was fixed:';
\echo '  1. Added type column to saved_itineraries';
\echo '  2. Updated unique constraint to allow both likes and saves';
\echo '  3. Added RLS policies for user access';
\echo '  4. Granted necessary permissions';
\echo '';
\echo 'Users can now:';
\echo '  ✓ Like itineraries from detail view';
\echo '  ✓ Like itineraries from discover feed';
\echo '  ✓ View their liked itineraries in the Likes tab';
\echo '  ✓ Unlike itineraries';
\echo '';
\echo 'Next steps:';
\echo '  1. Test liking an itinerary';
\echo '  2. Check the Likes tab to see it appear';
\echo '  3. Test unliking';
\echo '';
