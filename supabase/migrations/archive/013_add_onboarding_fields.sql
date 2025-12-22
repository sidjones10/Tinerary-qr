-- Add onboarding and account management fields to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(account_deleted_at) WHERE account_deleted_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding flow';
COMMENT ON COLUMN profiles.interests IS 'User travel interests for personalized feed';
COMMENT ON COLUMN profiles.account_deleted_at IS 'Timestamp when account was soft-deleted';
COMMENT ON COLUMN profiles.deletion_scheduled_for IS 'Timestamp when account will be permanently deleted (30 days after soft delete)';
