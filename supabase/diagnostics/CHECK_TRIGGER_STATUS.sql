-- ============================================================================
-- DIAGNOSTIC: Check if trigger and function exist
-- ============================================================================

-- 1. Check if the function exists
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 2. Check if the trigger exists
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'handle_auth_user_created';

-- 3. Check what columns exist in profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check auth users vs profiles
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.profiles) as profile_records,
  (SELECT COUNT(*) FROM auth.users au
   LEFT JOIN public.profiles p ON au.id = p.id
   WHERE p.id IS NULL) as missing_profiles;
