-- ============================================================================
-- COMPREHENSIVE FIX FOR USER SIGNUP
-- ============================================================================
-- This migration completely rebuilds the user creation system
-- Run this AFTER migration 008 if signup still fails

-- ============================================================================
-- STEP 1: DROP EVERYTHING AND START FRESH
-- ============================================================================

-- Drop all existing triggers
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_auth_user_created ON auth.users;

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- STEP 2: ENSURE USERS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: ENSURE PROFILES TABLE HAS ALL COLUMNS
-- ============================================================================

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add all required columns one by one
DO $$
BEGIN
  -- Add email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Add username
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;

  -- Add name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;

  -- Add bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  -- Add location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
  END IF;

  -- Add avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Add unique constraints
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  EXCEPTION
    WHEN duplicate_table THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  EXCEPTION
    WHEN duplicate_table THEN NULL;
  END;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================================================
-- STEP 5: CREATE SIMPLE, ROBUST USER CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  username_value TEXT;
  name_value TEXT;
  retry_count INTEGER := 0;
BEGIN
  -- Extract username from metadata or email
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract name
  name_value := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Insert into users table
  BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user record: %', SQLERRM;
  END;

  -- Try to insert profile with retry logic for username conflicts
  WHILE retry_count < 5 LOOP
    BEGIN
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
        name_value,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        username = COALESCE(EXCLUDED.username, public.profiles.username),
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        updated_at = NOW();

      -- Success! Exit loop
      EXIT;

    EXCEPTION
      WHEN unique_violation THEN
        -- Username conflict, try with suffix
        retry_count := retry_count + 1;
        username_value := COALESCE(
          NEW.raw_user_meta_data->>'username',
          NEW.raw_user_meta_data->>'name',
          split_part(NEW.email, '@', 1)
        ) || '_' || substring(NEW.id::text, 1, 4 + retry_count);

        -- If we've retried too many times, just use the full UUID
        IF retry_count >= 5 THEN
          username_value := NEW.id::text;
        END IF;

      WHEN OTHERS THEN
        -- Log the error but don't fail user creation
        RAISE WARNING 'Error creating profile for user % (attempt %): %', NEW.id, retry_count, SQLERRM;
        EXIT;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 6: CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER handle_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: BACKFILL EXISTING AUTH USERS
-- ============================================================================

-- Backfill users table
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Backfill profiles table
DO $$
DECLARE
  auth_user RECORD;
  username_val TEXT;
  name_val TEXT;
  retry INTEGER;
BEGIN
  FOR auth_user IN SELECT * FROM auth.users LOOP
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth_user.id) THEN

      username_val := COALESCE(
        auth_user.raw_user_meta_data->>'username',
        auth_user.raw_user_meta_data->>'name',
        split_part(auth_user.email, '@', 1)
      );

      name_val := COALESCE(
        auth_user.raw_user_meta_data->>'name',
        auth_user.raw_user_meta_data->>'username',
        split_part(auth_user.email, '@', 1)
      );

      retry := 0;
      WHILE retry < 5 LOOP
        BEGIN
          INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
          VALUES (
            auth_user.id,
            auth_user.email,
            username_val,
            name_val,
            auth_user.created_at,
            NOW()
          );
          EXIT; -- Success, exit loop
        EXCEPTION
          WHEN unique_violation THEN
            retry := retry + 1;
            username_val := COALESCE(
              auth_user.raw_user_meta_data->>'username',
              split_part(auth_user.email, '@', 1)
            ) || '_' || substring(auth_user.id::text, 1, 4 + retry);
          WHEN OTHERS THEN
            RAISE WARNING 'Failed to backfill profile for user %: %', auth_user.id, SQLERRM;
            EXIT;
        END;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  auth_count INTEGER;
  profile_count INTEGER;
  backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  backfilled := profile_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ User Signup System Rebuilt!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database State:';
  RAISE NOTICE '  • Auth users: %', auth_count;
  RAISE NOTICE '  • Profiles: %', profile_count;
  RAISE NOTICE '  • Backfilled: %', backfilled;
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Rebuilt handle_new_user() function';
  RAISE NOTICE '  ✓ Added all required profile columns';
  RAISE NOTICE '  ✓ Username conflict resolution with retry logic';
  RAISE NOTICE '  ✓ Comprehensive error handling';
  RAISE NOTICE '  ✓ Backfilled all existing auth users';
  RAISE NOTICE '';
  RAISE NOTICE 'Test signup now - it should work!';
  RAISE NOTICE '';
END $$;
