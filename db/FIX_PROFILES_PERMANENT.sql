-- ONE-TIME FIX: Create missing profiles AND auto-create for future users
-- Run this ONCE in Supabase SQL Editor

-- ============================================
-- PART 1: Fix existing users without profiles
-- ============================================

-- Temporarily disable RLS to create missing profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create profiles for ALL users who don't have one
INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(u.email, '@', 1) || '_' || substring(u.id::text from 1 for 8)
  ),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: Set up automatic profile creation
-- ============================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1) || '_' || substring(NEW.id::text from 1 for 8)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to auto-create profiles for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 3: Verify everything worked
-- ============================================

-- Check that your profile exists
SELECT
  '✅ Your profile' as status,
  id,
  email,
  name,
  username,
  created_at
FROM public.profiles
WHERE id = 'a8e72152-3050-4d2e-bdcd-f377952da9fd'

UNION ALL

-- Check total profiles created
SELECT
  '✅ Total profiles' as status,
  NULL as id,
  COUNT(*)::text as email,
  NULL as name,
  NULL as username,
  NULL as created_at
FROM public.profiles

UNION ALL

-- Check that trigger exists
SELECT
  '✅ Auto-create trigger' as status,
  NULL as id,
  CASE WHEN COUNT(*) > 0 THEN 'Installed ✓' ELSE 'Missing ✗' END as email,
  NULL as name,
  NULL as username,
  NULL as created_at
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
