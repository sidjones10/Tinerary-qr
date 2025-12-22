-- FINAL FIX for signup issue
-- This addresses RLS and permissions
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new

-- ============================================
-- STEP 1: Drop and recreate the trigger function
-- ============================================

DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- CRITICAL: This makes the function run with creator's privileges
SET search_path = public, auth
AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Generate username from email
  username_val := split_part(NEW.email, '@', 1);

  -- Insert profile (bypasses RLS because of SECURITY DEFINER)
  INSERT INTO public.profiles (
    id,
    email,
    username,
    name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'username')::TEXT, username_val),
    COALESCE((NEW.raw_user_meta_data->>'username')::TEXT, username_val)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- If username/email already exists, try with unique suffix
    BEGIN
      INSERT INTO public.profiles (id, email, username, name)
      VALUES (
        NEW.id,
        NEW.email,
        username_val || '_' || substr(NEW.id::text, 1, 8),
        username_val
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail
      RAISE WARNING 'Failed to create profile for %: %', NEW.email, SQLERRM;
    END;
    RETURN NEW;

  WHEN OTHERS THEN
    -- Don't fail user creation even if profile creation fails
    RAISE WARNING 'Profile creation error for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 2: Create the trigger
-- ============================================

CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- ============================================
-- STEP 3: Grant necessary permissions
-- ============================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_profile_for_user() TO postgres, service_role;

-- Ensure service_role can insert into profiles
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- STEP 4: Ensure RLS allows the trigger to work
-- ============================================

-- The SECURITY DEFINER should handle this, but let's make sure
-- Check current RLS policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- ============================================
-- STEP 5: Verify trigger installation
-- ============================================

SELECT
  'Trigger created: ' || trigger_name as status
FROM information_schema.triggers
WHERE trigger_name = 'create_profile_trigger'
AND event_object_table = 'users';

-- ============================================
-- STEP 6: Fix existing users without profiles
-- ============================================

INSERT INTO public.profiles (id, email, username, name)
SELECT
  u.id,
  u.email,
  COALESCE((u.raw_user_meta_data->>'username')::TEXT, split_part(u.email, '@', 1)),
  COALESCE((u.raw_user_meta_data->>'username')::TEXT, split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 7: Final verification
-- ============================================

SELECT
  'Users: ' || COUNT(*) as total_users
FROM auth.users
WHERE deleted_at IS NULL;

SELECT
  'Profiles: ' || COUNT(*) as total_profiles
FROM public.profiles;

SELECT
  'Users without profiles: ' || COUNT(*) as missing_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL;

SELECT '✅ Migration complete! Try signup now.' as result;
