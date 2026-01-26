-- SIMPLE FIX: Create missing profile for current user
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily disable RLS to create the profile
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Create your missing profile (and any other users missing profiles)
INSERT INTO public.profiles (id, email, name, username, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1) || '_' || substring(u.id::text from 1 for 8)),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify profile was created
SELECT
  'Profile created successfully!' as status,
  id,
  email,
  name,
  username,
  created_at
FROM public.profiles
WHERE id = 'a8e72152-3050-4d2e-bdcd-f377952da9fd';
