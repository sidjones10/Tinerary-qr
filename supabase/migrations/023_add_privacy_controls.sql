-- ============================================================================
-- Migration: Add Privacy Controls for Packing Lists and Expenses
-- ============================================================================
-- This migration adds:
-- 1. Fixes unique constraint on saved_itineraries to allow both save and like
-- 2. Privacy toggles for packing lists and expenses on itineraries
-- 3. Access control functions to check permissions

-- ============================================================================
-- STEP 1: Fix saved_itineraries unique constraint
-- ============================================================================

-- Drop the old unique constraint that doesn't include type
ALTER TABLE saved_itineraries
  DROP CONSTRAINT IF EXISTS saved_itineraries_user_id_itinerary_id_key;

-- Add new unique constraint that includes type
-- This allows a user to both save AND like the same itinerary
ALTER TABLE saved_itineraries
  ADD CONSTRAINT saved_itineraries_user_itinerary_type_unique
  UNIQUE (user_id, itinerary_id, type);

-- ============================================================================
-- STEP 2: Add privacy toggle columns to itineraries table
-- ============================================================================

-- Add columns for controlling public/private access to packing lists and expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'packing_list_public'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN packing_list_public BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'expenses_public'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN expenses_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_packing_public ON itineraries(packing_list_public);
CREATE INDEX IF NOT EXISTS idx_itineraries_expenses_public ON itineraries(expenses_public);

-- ============================================================================
-- STEP 3: Create access control function
-- ============================================================================

-- Function to check if a user can access private content (packing/expenses)
-- Returns true if:
-- 1. User is the owner of the itinerary
-- 2. User is invited as an attendee
-- 3. Content is public (for posted itineraries)
CREATE OR REPLACE FUNCTION can_access_private_content(
  user_uuid UUID,
  itinerary_uuid UUID,
  content_type TEXT -- 'packing' or 'expenses'
)
RETURNS BOOLEAN AS $$
DECLARE
  itinerary_owner UUID;
  is_attendee BOOLEAN;
  is_content_public BOOLEAN;
BEGIN
  -- Get the itinerary owner and public status
  IF content_type = 'packing' THEN
    SELECT user_id, COALESCE(packing_list_public, FALSE)
    INTO itinerary_owner, is_content_public
    FROM itineraries
    WHERE id = itinerary_uuid;
  ELSIF content_type = 'expenses' THEN
    SELECT user_id, COALESCE(expenses_public, FALSE)
    INTO itinerary_owner, is_content_public
    FROM itineraries
    WHERE id = itinerary_uuid;
  ELSE
    RETURN FALSE;
  END IF;

  -- If itinerary doesn't exist, deny access
  IF itinerary_owner IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner always has access
  IF user_uuid = itinerary_owner THEN
    RETURN TRUE;
  END IF;

  -- If content is public, allow access
  IF is_content_public THEN
    RETURN TRUE;
  END IF;

  -- Check if user is an invited attendee
  SELECT EXISTS (
    SELECT 1
    FROM itinerary_attendees
    WHERE itinerary_id = itinerary_uuid
      AND user_id = user_uuid
      AND status = 'accepted'
  ) INTO is_attendee;

  RETURN is_attendee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_access_private_content IS 'Check if a user can access private packing lists or expenses';

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_access_private_content TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_private_content TO anon;

-- ============================================================================
-- STEP 4: Add RLS policies for packing_items and expenses
-- ============================================================================

-- Update RLS policy for packing_items to check access
DROP POLICY IF EXISTS "Anyone can view packing items" ON packing_items;
CREATE POLICY "Users can view packing items with permission" ON packing_items
  FOR SELECT USING (
    can_access_private_content(auth.uid(), itinerary_id, 'packing')
  );

-- Users can only modify their own itinerary's packing items
DROP POLICY IF EXISTS "Users can insert own packing items" ON packing_items;
CREATE POLICY "Users can insert own packing items" ON packing_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own packing items" ON packing_items;
CREATE POLICY "Users can update own packing items" ON packing_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own packing items" ON packing_items;
CREATE POLICY "Users can delete own packing items" ON packing_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

-- Update RLS policy for expenses to check access
DROP POLICY IF EXISTS "Anyone can view expenses" ON expenses;
CREATE POLICY "Users can view expenses with permission" ON expenses
  FOR SELECT USING (
    can_access_private_content(auth.uid(), itinerary_id, 'expenses')
  );

-- Users can only modify their own itinerary's expenses
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE id = itinerary_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Privacy Controls Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Updates applied:';
  RAISE NOTICE '  ✓ Fixed saved_itineraries unique constraint';
  RAISE NOTICE '  ✓ Added packing_list_public column to itineraries';
  RAISE NOTICE '  ✓ Added expenses_public column to itineraries';
  RAISE NOTICE '  ✓ Created can_access_private_content() function';
  RAISE NOTICE '  ✓ Updated RLS policies for packing_items';
  RAISE NOTICE '  ✓ Updated RLS policies for expenses';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  - Set packing_list_public = TRUE to allow public access';
  RAISE NOTICE '  - Set expenses_public = TRUE to allow public access';
  RAISE NOTICE '  - Access is automatically restricted to owners and invited users';
  RAISE NOTICE '';
END $$;
