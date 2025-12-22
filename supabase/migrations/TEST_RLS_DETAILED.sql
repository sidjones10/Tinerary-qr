-- ============================================================================
-- DETAILED RLS TEST - Returns actual results, not just notices
-- ============================================================================

-- Test 1: Try insert as postgres (superuser - should always work)
CREATE TEMP TABLE test_results (
  test_name TEXT,
  passed BOOLEAN,
  error_message TEXT
);

-- Test 1: Insert as postgres
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, email, username, name, created_at, updated_at)
  VALUES (test_id, 'test_postgres@example.com', 'test_postgres', 'Test Postgres', NOW(), NOW());

  INSERT INTO test_results VALUES ('Insert as postgres', true, NULL);
  DELETE FROM public.profiles WHERE id = test_id;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO test_results VALUES ('Insert as postgres', false, SQLERRM);
END $$;

-- Test 2: What policies exist?
SELECT 'Current RLS Policies:' as info;
SELECT
  policyname,
  cmd as command,
  CASE
    WHEN qual::text = 'true' THEN 'USING (true)'
    ELSE qual::text
  END as using_clause,
  CASE
    WHEN with_check::text = 'true' THEN 'WITH CHECK (true)'
    ELSE with_check::text
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles';

-- Test 3: Is RLS enabled?
SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Test 4: Check trigger function details
SELECT 'Trigger Function Details:' as info;
SELECT
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- Test 5: Check if trigger exists and is enabled
SELECT 'Trigger Status:' as info;
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'handle_auth_user_created';

-- Return test results
SELECT 'Test Results:' as info;
SELECT * FROM test_results;
