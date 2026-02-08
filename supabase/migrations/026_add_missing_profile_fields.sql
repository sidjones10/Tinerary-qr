-- ============================================================================
-- Add missing profile columns: avatar_path, website, phone
-- These columns are referenced in profile-settings.tsx but were only in archived migrations
-- ============================================================================

-- Add avatar_path column to store storage path for avatar deletion
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- Add website column for user's website URL
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add phone column for user's contact number
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookups (sparse index only for non-null values)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.avatar_path IS 'Storage path for the avatar image in Supabase Storage for cleanup';
COMMENT ON COLUMN profiles.website IS 'User website URL for their profile';
COMMENT ON COLUMN profiles.phone IS 'User phone number for contact and notifications';
