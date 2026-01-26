-- ============================================================================
-- COMPREHENSIVE EXPENSES DEBUG SCRIPT
-- Run this entire script to diagnose expense issues
-- ============================================================================

-- 1. Check if title column exists
SELECT
  'Column Check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND column_name = 'title';

-- 2. Check total count of ALL expenses in the database
SELECT
  'Total Expenses Count' as check_type,
  COUNT(*) as total_expenses
FROM public.expenses;

-- 3. Check your most recent itineraries
SELECT
  'Your Recent Itineraries' as check_type,
  id as itinerary_id,
  title,
  created_at
FROM public.itineraries
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check ALL expenses for your itineraries (past 30 days)
SELECT
  'Your Expenses (Last 30 Days)' as check_type,
  e.id,
  e.itinerary_id,
  i.title as itinerary_title,
  e.title as expense_title,
  e.category,
  e.amount,
  e.user_id,
  e.created_at
FROM public.expenses e
LEFT JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '30 days'
ORDER BY e.created_at DESC;

-- 5. Check RLS policies on expenses table
SELECT
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'expenses';

-- 6. Try to manually insert a test expense (this will help identify permission issues)
-- Note: This will fail if there are no itineraries, but will show the error
DO $$
DECLARE
  test_itinerary_id UUID;
  test_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO test_user_id;

  -- Get most recent itinerary for current user
  SELECT id INTO test_itinerary_id
  FROM public.itineraries
  WHERE user_id = test_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF test_itinerary_id IS NOT NULL THEN
    -- Try to insert a test expense
    INSERT INTO public.expenses (
      itinerary_id,
      user_id,
      title,
      description,
      category,
      amount,
      paid_by_user_id,
      split_type,
      date,
      currency
    ) VALUES (
      test_itinerary_id,
      test_user_id,
      'TEST EXPENSE - Please Delete',
      'This is a test expense created by diagnostic script',
      'Testing',
      1.00,
      test_user_id,
      'equal',
      CURRENT_DATE,
      'USD'
    );

    RAISE NOTICE 'Test expense created successfully for itinerary %', test_itinerary_id;
  ELSE
    RAISE NOTICE 'No itinerary found for current user';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test expense: %', SQLERRM;
END $$;

-- 7. Check if the test expense was created
SELECT
  'Test Expense Check' as check_type,
  id,
  title,
  category,
  amount,
  created_at
FROM public.expenses
WHERE title LIKE 'TEST EXPENSE%'
ORDER BY created_at DESC
LIMIT 1;

-- Done
SELECT '=== DIAGNOSTIC COMPLETE ===' as status;
