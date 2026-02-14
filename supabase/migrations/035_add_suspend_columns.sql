-- ============================================================================
-- Migration 035: Add Suspend Columns to Profiles
-- ============================================================================
-- ISSUE: Admin suspend/unsuspend feature doesn't work because the columns
-- is_suspended and suspended_at don't exist in the profiles table.
-- ============================================================================

-- Add is_suspended column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Add suspended_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- Add suspended_reason column for admin notes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Add index for quickly finding suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended) WHERE is_suspended = true;

-- ============================================================================
-- RLS Policies for Admin Operations
-- ============================================================================

-- Allow admins to update any profile (for suspend/unsuspend, toggle admin, etc.)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any profile (for delete user feature)
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any itinerary
DROP POLICY IF EXISTS "Admins can delete any itinerary" ON itineraries;
CREATE POLICY "Admins can delete any itinerary" ON itineraries
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any saved_itinerary entry
DROP POLICY IF EXISTS "Admins can delete any saved item" ON saved_itineraries;
CREATE POLICY "Admins can delete any saved item" ON saved_itineraries
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any comment
DROP POLICY IF EXISTS "Admins can delete any comment" ON comments;
CREATE POLICY "Admins can delete any comment" ON comments
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any notification
DROP POLICY IF EXISTS "Admins can delete any notification" ON notifications;
CREATE POLICY "Admins can delete any notification" ON notifications
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to delete any user interaction
DROP POLICY IF EXISTS "Admins can delete any interaction" ON user_interactions;
CREATE POLICY "Admins can delete any interaction" ON user_interactions
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 035: Suspend Columns Added!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns:';
  RAISE NOTICE '  - profiles.is_suspended (BOOLEAN)';
  RAISE NOTICE '  - profiles.suspended_at (TIMESTAMP)';
  RAISE NOTICE '  - profiles.suspended_reason (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin policies added for:';
  RAISE NOTICE '  - Updating any profile';
  RAISE NOTICE '  - Deleting any profile';
  RAISE NOTICE '  - Deleting any itinerary';
  RAISE NOTICE '  - Deleting any saved item';
  RAISE NOTICE '  - Deleting any comment';
  RAISE NOTICE '  - Deleting any notification';
  RAISE NOTICE '  - Deleting any interaction';
  RAISE NOTICE '';
END $$;
