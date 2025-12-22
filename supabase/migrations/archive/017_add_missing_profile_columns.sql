-- Add missing columns to profiles table that are referenced in code

-- Add phone column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Add constraint to ensure phone format is valid (optional)
-- ALTER TABLE profiles ADD CONSTRAINT phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$');

COMMENT ON COLUMN profiles.phone IS 'User phone number for contact and notifications';
