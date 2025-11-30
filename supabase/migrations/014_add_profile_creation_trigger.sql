-- Add trigger to automatically create profile when user signs up
-- This ensures profiles are created automatically by the database

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Generate a unique username from email
  username_value := split_part(NEW.email, '@', 1);

  -- Try to insert the profile
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', username_value),
    COALESCE(NEW.raw_user_meta_data->>'username', username_value)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    name = COALESCE(EXCLUDED.name, profiles.name);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a unique constraint violation on email or username, still return NEW
    -- This prevents the user creation from failing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

-- Update existing auth users that don't have profiles
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
