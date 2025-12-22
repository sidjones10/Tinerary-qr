-- ============================================================================
-- Show exactly what trigger function is currently active
-- ============================================================================

SELECT 'CURRENT TRIGGER FUNCTION CODE:' as info;
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT 'TRIGGER DETAILS:' as info;
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

SELECT 'RLS POLICIES:' as info;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
