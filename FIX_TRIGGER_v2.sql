-- Enhanced trigger with better error handling and logging
-- Run this in Supabase SQL Editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- Recreate function with detailed logging
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER
SECURITY DEFINER -- This is critical - runs with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Log the attempt (will appear in Supabase logs)
  RAISE LOG 'Creating profile for user: % (%)', NEW.email, NEW.id;

  -- Generate username from email
  username_value := split_part(NEW.email, '@', 1);

  -- Insert with minimal required fields
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      username,
      name
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', username_value),
      COALESCE(NEW.raw_user_meta_data->>'username', username_value)
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = COALESCE(EXCLUDED.username, profiles.username),
      name = COALESCE(EXCLUDED.name, profiles.name),
      updated_at = NOW();

    RAISE LOG 'Successfully created profile for: %', NEW.email;

  EXCEPTION
    WHEN unique_violation THEN
      -- Handle duplicate username/email
      RAISE LOG 'Unique violation for %, trying with suffix', NEW.email;

      -- Try again with a unique suffix
      INSERT INTO public.profiles (
        id,
        email,
        username,
        name
      )
      VALUES (
        NEW.id,
        NEW.email,
        username_value || '_' || substring(NEW.id::text from 1 for 8),
        username_value
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    WHEN OTHERS THEN
      -- Log any other error but don't fail the user creation
      RAISE LOG 'Error creating profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
      -- Still return NEW so user creation succeeds
  END;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Test the trigger by checking if it exists
SELECT
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_name = 'create_profile_trigger';

-- Clean up any orphaned users without profiles
INSERT INTO public.profiles (id, email, username, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT 'Migration completed successfully!' as status;
