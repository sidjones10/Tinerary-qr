-- ============================================================================
-- Migration: Add admin role to profiles
-- ============================================================================
-- Enables admin role checking for the admin dashboard

-- Add is_admin boolean to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add role column for more granular role management
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
    AND (is_admin = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin Role System Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'To make a user an admin, run:';
  RAISE NOTICE '  UPDATE profiles SET is_admin = true WHERE email = ''admin@example.com'';';
  RAISE NOTICE 'Or:';
  RAISE NOTICE '  UPDATE profiles SET role = ''admin'' WHERE email = ''admin@example.com'';';
  RAISE NOTICE '';
END $$;
