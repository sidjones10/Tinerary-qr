-- Add JSONB settings columns to user_preferences table
-- These columns were defined in an archived migration that was never applied

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS appearance_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS privacy_preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preferences JSONB DEFAULT '{}'::jsonb;

-- Add missing consent columns to profiles table
-- These were defined in migrations 031/039 but never applied

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activity_digest_consent BOOLEAN DEFAULT true;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS browsing_emails_consent BOOLEAN DEFAULT true;

-- Fix user_preferences foreign key: currently references public.users
-- but should reference profiles (where user IDs actually exist)

ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
