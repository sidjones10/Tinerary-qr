-- SIMPLE ALL-IN-ONE DEBUG QUERY
-- Copy and paste this ENTIRE query and send me ALL the results

-- 1. Check if any expenses exist at all
SELECT
  'EXPENSES CHECK' as test_name,
  COUNT(*) as total_expenses_in_database,
  COUNT(DISTINCT itinerary_id) as itineraries_with_expenses
FROM public.expenses;

-- 2. Check if any packing items exist
SELECT
  'PACKING ITEMS CHECK' as test_name,
  COUNT(*) as total_packing_items_in_database,
  COUNT(DISTINCT itinerary_id) as itineraries_with_packing_items
FROM public.packing_items;

-- 3. Check your specific itineraries
SELECT
  'YOUR ITINERARIES' as test_name,
  i.title,
  i.id,
  (SELECT COUNT(*) FROM public.expenses WHERE itinerary_id = i.id) as expense_count,
  (SELECT COUNT(*) FROM public.packing_items WHERE itinerary_id = i.id) as packing_count,
  (SELECT COUNT(*) FROM public.activities WHERE itinerary_id = i.id) as activity_count
FROM public.itineraries i
WHERE i.created_at > NOW() - INTERVAL '1 day'
ORDER BY i.created_at DESC;

-- 4. Show actual expenses for your recent itineraries
SELECT
  'EXPENSE DETAILS' as test_name,
  e.id,
  i.title as event_title,
  e.category,
  e.amount,
  e.description,
  e.paid_by_user_id,
  e.created_at
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 day'
ORDER BY e.created_at DESC
LIMIT 20;

-- 5. Show actual packing items for your recent itineraries
SELECT
  'PACKING DETAILS' as test_name,
  p.id,
  i.title as event_title,
  p.name,
  p.is_packed,
  p.created_at
FROM public.packing_items p
JOIN public.itineraries i ON p.itinerary_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC
LIMIT 20;

-- 6. Check if required columns exist in expenses table
SELECT
  'EXPENSES COLUMNS' as test_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;
