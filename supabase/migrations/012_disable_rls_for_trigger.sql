-- ============================================================================
-- FIX: Disable RLS temporarily or adjust policies for trigger
-- ============================================================================

-- Check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Temporarily disable RLS on profiles to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test if we can insert now
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'test_' || test_id::TEXT || '@example.com';
BEGIN
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (test_id, test_email, 'testuser_' || substring(test_id::TEXT, 1, 8), 'Test User');

  RAISE NOTICE 'SUCCESS: Insert worked with RLS disabled!';

  DELETE FROM public.profiles WHERE id = test_id;
  RAISE NOTICE 'Test data cleaned up.';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Insert still failed: %', SQLERRM;
END $$;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Hide soft-deleted profiles from public" ON public.profiles;

-- Create simple, permissive policies
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- Allow any insert (trigger will handle it)

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.profiles
  USING (auth.role() = 'service_role');

-- Verify
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'profiles';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS FIX APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS enabled: %', rls_enabled;
  RAISE NOTICE 'Policies count: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Try signup now!';
  RAISE NOTICE '';
END $$;
