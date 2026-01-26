-- ============================================================================
-- TEST EXPENSE CREATION AFTER MIGRATION
-- Run this to verify the title column exists and test creating a new expense
-- ============================================================================

-- Step 1: Verify all required columns exist
SELECT
  '1. Column Verification' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND column_name IN ('id', 'itinerary_id', 'user_id', 'title', 'description', 'category', 'amount', 'paid_by_user_id', 'split_type', 'date', 'currency')
ORDER BY column_name;

-- Step 2: Check your most recent itinerary
WITH recent_itinerary AS (
  SELECT id, title, created_at
  FROM public.itineraries
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  '2. Your Most Recent Itinerary' as step,
  id,
  title,
  created_at
FROM recent_itinerary;

-- Step 3: Try to create a test expense
WITH recent_itinerary AS (
  SELECT id
  FROM public.itineraries
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1
)
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
)
SELECT
  id,
  auth.uid(),
  'Test Expense from SQL',
  'Testing if expense creation works after migration',
  'Testing',
  10.50,
  auth.uid(),
  'equal',
  CURRENT_DATE,
  'USD'
FROM recent_itinerary
WHERE id IS NOT NULL
RETURNING
  id,
  title,
  amount,
  category,
  created_at;

-- Step 4: Query all expenses for your itineraries
SELECT
  '4. All Your Expenses' as step,
  e.id,
  e.title,
  e.category,
  e.amount,
  e.date,
  i.title as itinerary_title,
  e.created_at
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.user_id = auth.uid()
ORDER BY e.created_at DESC;

-- Step 5: Count total expenses per itinerary
SELECT
  '5. Expense Count by Itinerary' as step,
  i.title as itinerary_title,
  COUNT(e.id) as expense_count,
  SUM(e.amount) as total_amount
FROM public.itineraries i
LEFT JOIN public.expenses e ON i.id = e.itinerary_id
WHERE i.user_id = auth.uid()
GROUP BY i.id, i.title
ORDER BY i.created_at DESC;

SELECT '=== TEST COMPLETE ===' as status;
