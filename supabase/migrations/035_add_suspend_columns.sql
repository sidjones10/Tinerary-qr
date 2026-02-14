-- ============================================================================
-- Migration 035: Add Suspend and Admin Columns to Profiles
-- ============================================================================
-- ISSUES FIXED:
-- 1. Admin suspend/unsuspend feature doesn't work because is_suspended column
--    doesn't exist
-- 2. Admin check fails because is_admin column doesn't exist
-- ============================================================================

-- ============================================================================
-- STEP 1: Add admin columns (if they don't exist from migration 030)
-- ============================================================================

-- Add is_admin boolean to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add role column for future flexibility
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add account_type column for minor/standard accounts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'standard';

-- Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- ============================================================================
-- STEP 2: Add suspend columns
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
-- STEP 3: RLS Policies for Admin Operations
-- ============================================================================

-- Allow admins to update any profile (for suspend/unsuspend, toggle admin, etc.)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );

-- Allow admins to delete any profile (for delete user feature)
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
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
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
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
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
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
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
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
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
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
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );

-- ============================================================================
-- STEP 4: Helper function to check if current user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 035: Admin & Suspend Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns added to profiles:';
  RAISE NOTICE '  - is_admin (BOOLEAN)';
  RAISE NOTICE '  - role (TEXT)';
  RAISE NOTICE '  - account_type (TEXT)';
  RAISE NOTICE '  - is_suspended (BOOLEAN)';
  RAISE NOTICE '  - suspended_at (TIMESTAMP)';
  RAISE NOTICE '  - suspended_reason (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin RLS policies added for:';
  RAISE NOTICE '  - Updating any profile';
  RAISE NOTICE '  - Deleting any profile';
  RAISE NOTICE '  - Deleting any itinerary';
  RAISE NOTICE '  - Deleting any saved item';
  RAISE NOTICE '  - Deleting any comment';
  RAISE NOTICE '  - Deleting any notification';
  RAISE NOTICE '  - Deleting any interaction';
  RAISE NOTICE '';
  RAISE NOTICE 'To make yourself an admin, run:';
  RAISE NOTICE '  UPDATE profiles SET is_admin = true WHERE email = ''your@email.com'';';
  RAISE NOTICE '';
END $$;
