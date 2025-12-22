-- ============================================================================
-- DEBUG: Try to manually insert a profile and see what fails
-- ============================================================================

-- Test 1: Can we insert as anonymous?
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  SET LOCAL ROLE anon;

  INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
  VALUES (
    test_id,
    'test@example.com',
    'testuser',
    'Test User',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'SUCCESS as anon: Insert worked!';
  DELETE FROM public.profiles WHERE id = test_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FAILED as anon: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- Test 2: Can we insert as authenticated?
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  SET LOCAL ROLE authenticated;

  INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
  VALUES (
    test_id,
    'test@example.com',
    'testuser',
    'Test User',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'SUCCESS as authenticated: Insert worked!';
  DELETE FROM public.profiles WHERE id = test_id;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FAILED as authenticated: %', SQLERRM;
  RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- Test 3: What role does the trigger run as?
SELECT
  'Trigger function security:' as info,
  prosecdef as is_security_definer,
  proowner::regrole as owner
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Test 4: What are the current RLS policies?
SELECT
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test 5: Check if there are any unique constraints that might conflict
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles' AND table_schema = 'public';
