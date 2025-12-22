-- Run this in Supabase SQL Editor to diagnose the signup issue
-- https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new

-- 1. Test the trigger function directly
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
BEGIN
  -- Simulate what the trigger does
  BEGIN
    INSERT INTO public.profiles (id, email, username, name)
    VALUES (
      test_user_id,
      test_email,
      split_part(test_email, '@', 1),
      split_part(test_email, '@', 1)
    );
    RAISE NOTICE 'SUCCESS: Profile inserted for %', test_email;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'ERROR: % - %', SQLERRM, SQLSTATE;
  END;

  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_user_id;
END $$;

-- 2. Check if trigger exists and is enabled
SELECT
    trigger_name,
    event_object_table,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'create_profile_trigger';

-- 3. Check the function exists
SELECT
    routine_name,
    routine_schema,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_name = 'create_profile_for_user';

-- 4. Check profiles table columns (including from other migrations)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check for NOT NULL constraints that might be failing
SELECT
    c.column_name,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_name = 'profiles'
AND c.table_schema = 'public'
AND c.is_nullable = 'NO'
AND c.column_default IS NULL
ORDER BY c.ordinal_position;

-- 6. Try to manually create a profile to see what fails
-- (This will fail if there's a constraint issue)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (
    test_id,
    'manual-test@example.com',
    'manual-test',
    'Manual Test'
  );
  RAISE NOTICE 'Manual insert successful';
  DELETE FROM public.profiles WHERE id = test_id;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Manual insert failed: % - %', SQLERRM, SQLSTATE;
END $$;
