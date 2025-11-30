-- Add avatar_path column to profiles table
-- This column stores the storage path for the avatar image
-- so we can delete old photos when uploading new ones

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_path TEXT;

COMMENT ON COLUMN profiles.avatar_path IS 'Storage path for the avatar image in Supabase Storage';
