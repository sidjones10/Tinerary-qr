-- ============================================================================
-- FINAL STATUS CHECK - What's actually in the database right now?
-- ============================================================================

-- 1. What columns does profiles have?
SELECT '=== PROFILES TABLE COLUMNS ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Does the trigger exist?
SELECT '=== TRIGGERS ON AUTH.USERS ===' as info;
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 3. Does the function exist?
SELECT '=== FUNCTIONS ===' as info;
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 4. What RLS policies exist?
SELECT '=== RLS POLICIES ON PROFILES ===' as info;
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Is RLS enabled?
SELECT '=== RLS STATUS ===' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';
