-- FIX PROFILES TABLE AND RLS POLICIES
-- This fixes the "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor FIRST, before FIX_PUBLISHING.sql

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  is_private BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index on username for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. DROP all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 5. Create NEW RLS policies that allow profile creation

-- Allow anyone to view any profile (needed for social features)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- CRITICAL: Allow users to INSERT their own profile
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to DELETE their own profile (optional)
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 6. Create or update the trigger function to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. IMPORTANT: Create profile for currently logged-in user if it doesn't exist
-- Replace YOUR_USER_ID with your actual user ID from the error logs
-- Run this to create the missing profile for user: a8e72152-3050-4d2e-bdcd-f377952da9fd

-- First, we need to temporarily disable RLS to insert the profile
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Insert profile for the current user
INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1) || '_' || substring(u.id::text from 1 for 8)),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.id = 'a8e72152-3050-4d2e-bdcd-f377952da9fd'
ON CONFLICT (id) DO NOTHING;

-- Insert profiles for ANY other users who don't have one
INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1) || '_' || substring(u.id::text from 1 for 8)),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. Verify the profile was created
SELECT
  id,
  email,
  name,
  username,
  created_at
FROM public.profiles
WHERE id = 'a8e72152-3050-4d2e-bdcd-f377952da9fd';

-- 10. Test that RLS policies work
-- This should show you can view your own profile
SELECT
  'Profile exists' as status,
  COUNT(*) as count
FROM public.profiles
WHERE id = 'a8e72152-3050-4d2e-bdcd-f377952da9fd';
