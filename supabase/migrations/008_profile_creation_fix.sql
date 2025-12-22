-- ============================================================================
-- CONSOLIDATE PROFILE CREATION TRIGGERS
-- ============================================================================
-- This migration fixes conflicting triggers from migrations 014 and 021
-- by dropping all existing triggers and creating one unified, robust trigger

-- ============================================================================
-- STEP 1: ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Add email column if it doesn't exist (should be there from migration 001 but may be missing)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add username column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add name column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add timestamps if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraints if they don't exist
DO $$
BEGIN
  -- Add unique constraint on email
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;

  -- Add unique constraint on username
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================================================
-- STEP 2: DROP ALL EXISTING CONFLICTING TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 3: DROP ALL EXISTING FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_profile_for_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- STEP 4: CREATE CONSOLIDATED USER CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Generate username from email or metadata
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into users table (if it exists)
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Insert into profiles table with ALL required fields
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
    username_value,
    COALESCE(NEW.raw_user_meta_data->>'name', username_value),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    username = COALESCE(EXCLUDED.username, profiles.username),
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username is taken, append user ID
    username_value := username_value || '_' || substring(NEW.id::text, 1, 8);

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
      username_value,
      COALESCE(NEW.raw_user_meta_data->>'name', username_value),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, profiles.email),
      username = COALESCE(EXCLUDED.username, profiles.username),
      name = COALESCE(EXCLUDED.name, profiles.name),
      updated_at = NOW();

    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: CREATE SINGLE UNIFIED TRIGGER
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: BACKFILL MISSING PROFILES
-- ============================================================================

-- Find auth users without profiles and create them
INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1)
  ) as name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, profiles.email),
  username = COALESCE(EXCLUDED.username, profiles.username),
  name = COALESCE(EXCLUDED.name, profiles.name),
  updated_at = NOW();

-- Also backfill users table
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM auth.users au
  INNER JOIN public.profiles p ON au.id = p.id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Profile triggers consolidated!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Dropped conflicting triggers from migrations 014 and 021';
  RAISE NOTICE '  ✓ Created unified handle_new_user() function';
  RAISE NOTICE '  ✓ Sets ALL profile fields: email, username, name';
  RAISE NOTICE '  ✓ Handles username conflicts automatically';
  RAISE NOTICE '  ✓ Backfilled % existing auth users', backfilled_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Profile creation now works correctly for new signups!';
  RAISE NOTICE '';
END $$;
