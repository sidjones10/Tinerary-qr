-- ============================================================================
-- FIX: Add missing email and username columns, then fix trigger
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to profiles table
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraints
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_email_key,
DROP CONSTRAINT IF EXISTS profiles_username_key;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email),
ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================================================
-- STEP 2: Drop and recreate the trigger with the correct columns
-- ============================================================================

DROP TRIGGER IF EXISTS handle_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STEP 4: Verify everything
-- ============================================================================

DO $$
DECLARE
  has_email BOOLEAN;
  has_username BOOLEAN;
  has_trigger BOOLEAN;
  has_function BOOLEAN;
BEGIN
  -- Check columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) INTO has_email;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) INTO has_username;

  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'handle_auth_user_created'
  ) INTO has_trigger;

  -- Check function exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'handle_new_user'
  ) INTO has_function;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 011 - COLUMN FIX';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email column exists: %', has_email;
  RAISE NOTICE 'Username column exists: %', has_username;
  RAISE NOTICE 'Trigger exists: %', has_trigger;
  RAISE NOTICE 'Function exists: %', has_function;
  RAISE NOTICE '';

  IF NOT has_email THEN
    RAISE EXCEPTION 'EMAIL COLUMN NOT CREATED!';
  END IF;

  IF NOT has_username THEN
    RAISE EXCEPTION 'USERNAME COLUMN NOT CREATED!';
  END IF;

  IF NOT has_trigger THEN
    RAISE EXCEPTION 'TRIGGER NOT CREATED!';
  END IF;

  IF NOT has_function THEN
    RAISE EXCEPTION 'FUNCTION NOT CREATED!';
  END IF;

  RAISE NOTICE '✓ ALL CHECKS PASSED!';
  RAISE NOTICE '';
  RAISE NOTICE 'TRY SIGNUP NOW - IT SHOULD WORK!';
  RAISE NOTICE '';
END $$;
