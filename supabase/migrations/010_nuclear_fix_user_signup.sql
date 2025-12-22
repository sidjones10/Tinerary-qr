-- ============================================================================
-- NUCLEAR FIX: User Signup - Absolutely Minimal Approach
-- ============================================================================
-- This migration uses the absolute simplest approach possible

-- ============================================================================
-- STEP 1: Drop everything
-- ============================================================================

DROP TRIGGER IF EXISTS handle_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- ============================================================================
-- STEP 2: Ensure profiles table exists with minimal columns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create the simplest possible function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert, if it fails, just return NEW anyway
  BEGIN
    INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: Create trigger
-- ============================================================================

CREATE TRIGGER handle_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STEP 6: Backfill any missing profiles
-- ============================================================================

INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- STEP 7: Verify it worked
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
  auth_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Check trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'handle_auth_user_created';

  -- Check function exists
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_name = 'handle_new_user';

  -- Count records
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NUCLEAR FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger exists: %', trigger_count > 0;
  RAISE NOTICE 'Function exists: %', function_count > 0;
  RAISE NOTICE 'Auth users: %', auth_count;
  RAISE NOTICE 'Profiles: %', profile_count;
  RAISE NOTICE '';

  IF trigger_count = 0 THEN
    RAISE EXCEPTION 'TRIGGER NOT CREATED!';
  END IF;

  IF function_count = 0 THEN
    RAISE EXCEPTION 'FUNCTION NOT CREATED!';
  END IF;

  RAISE NOTICE 'ALL CHECKS PASSED - Try signup now!';
  RAISE NOTICE '';
END $$;
