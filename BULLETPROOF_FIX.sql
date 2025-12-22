-- BULLETPROOF FIX for signup issue
-- This version CANNOT fail user creation under any circumstances
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new

-- ============================================
-- CRITICAL: Make sure trigger cannot crash user creation
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- Create a bulletproof function that catches ALL errors
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public, auth
AS $$
DECLARE
  username_val TEXT;
  attempt_count INTEGER := 0;
BEGIN
  -- Always return NEW to ensure user creation succeeds
  -- Profile creation is "best effort" and won't block signup

  BEGIN
    -- Generate username from email
    username_val := split_part(NEW.email, '@', 1);

    -- Try to insert profile with username from metadata or email
    INSERT INTO public.profiles (
      id,
      email,
      username,
      name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'username')::TEXT, username_val),
      COALESCE((NEW.raw_user_meta_data->>'username')::TEXT, username_val),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

  EXCEPTION
    WHEN unique_violation THEN
      -- Username or email already exists, try with unique suffix
      BEGIN
        INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          username_val || '_' || substr(NEW.id::text, 1, 8),
          username_val,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Even this failed, but don't crash user creation
        RAISE WARNING 'Profile creation failed for % (attempt 2): %', NEW.email, SQLERRM;
      END;

    WHEN OTHERS THEN
      -- Catch absolutely everything else
      RAISE WARNING 'Profile creation failed for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
  END;

  -- ALWAYS return NEW so user creation succeeds
  RETURN NEW;
END;
$$;

-- ============================================
-- Create the trigger
-- ============================================

CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- ============================================
-- Grant necessary permissions
-- ============================================

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_profile_for_user() TO postgres, service_role, anon, authenticated;

-- Ensure service_role can insert into profiles
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- Check if RLS is causing issues
-- ============================================

-- Temporarily check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Show all RLS policies on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ============================================
-- Fix existing users without profiles
-- ============================================

-- Create profiles for any auth users that don't have them
-- Use DO block to handle multiple unique constraint conflicts
DO $$
DECLARE
  user_record RECORD;
  username_to_use TEXT;
  conflict_count INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT
      u.id,
      u.email,
      COALESCE(
        (u.raw_user_meta_data->>'username')::TEXT,
        split_part(u.email, '@', 1)
      ) as base_username,
      u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
      AND u.deleted_at IS NULL
      AND u.email IS NOT NULL
  LOOP
    username_to_use := user_record.base_username;
    conflict_count := 0;

    -- Try to insert with base username, add suffix if conflict
    LOOP
      BEGIN
        INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
        VALUES (
          user_record.id,
          user_record.email,
          username_to_use,
          user_record.base_username,
          user_record.created_at,
          NOW()
        );
        EXIT; -- Success, exit loop
      EXCEPTION
        WHEN unique_violation THEN
          conflict_count := conflict_count + 1;
          IF conflict_count > 10 THEN
            -- Too many conflicts, give up and log
            RAISE WARNING 'Could not create profile for user % after 10 attempts', user_record.email;
            EXIT;
          END IF;
          -- Try with a unique suffix
          username_to_use := user_record.base_username || '_' || substr(user_record.id::text, 1, 4) || conflict_count::text;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Verify installation
-- ============================================

SELECT '✅ Checking trigger...' as status;

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Trigger is installed'
    ELSE '❌ Trigger is NOT installed'
  END as trigger_status
FROM information_schema.triggers
WHERE trigger_name = 'create_profile_trigger'
AND event_object_table = 'users';

SELECT '✅ Checking function...' as status;

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Function exists'
    ELSE '❌ Function does NOT exist'
  END as function_status
FROM information_schema.routines
WHERE routine_name = 'create_profile_for_user';

SELECT '✅ Counting users and profiles...' as status;

SELECT
  (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL AND u.deleted_at IS NULL) as users_without_profiles;

SELECT '✅✅✅ Installation complete! Try signing up now.' as final_message;
