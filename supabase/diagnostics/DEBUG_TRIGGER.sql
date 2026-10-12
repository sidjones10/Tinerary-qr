-- ============================================================================
-- DEBUG: Manually test what happens when we try to create a user
-- ============================================================================

-- First, let's see if trigger and function exist
SELECT 'Function exists:' as check_type, COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
UNION ALL
SELECT 'Trigger exists:' as check_type, COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name = 'handle_auth_user_created'
UNION ALL
SELECT 'Profiles table exists:' as check_type, COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check RLS on profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as command
FROM pg_policies
WHERE tablename = 'profiles';

-- Check if profiles table has the right structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Try to manually insert a test profile to see what happens
-- This simulates what the trigger should do
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
  VALUES (
    test_id,
    'test@example.com',
    'testuser',
    'Test User',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'SUCCESS: Manual insert worked! The trigger should work too.';

  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Manual insert failed with: %', SQLERRM;
  RAISE NOTICE 'DETAIL: %', SQLSTATE;
END $$;
