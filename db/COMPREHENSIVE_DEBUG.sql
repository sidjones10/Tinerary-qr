-- COMPREHENSIVE EXPENSE & PACKING DEBUG SCRIPT
-- Run this entire script in Supabase SQL Editor and send ALL results

-- ==============================================================================
-- SECTION 1: USER & PROFILE CHECK
-- ==============================================================================

-- Check if your user has a profile
SELECT
  'USER PROFILE CHECK' as test_name,
  u.id as user_id,
  u.email as user_email,
  p.id as profile_id,
  p.name as profile_name,
  p.email as profile_email,
  p.avatar_url as profile_avatar
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- ==============================================================================
-- SECTION 2: ITINERARY CHECK
-- ==============================================================================

-- Get your recent itineraries
SELECT
  'YOUR RECENT ITINERARIES' as test_name,
  i.id,
  i.title,
  i.user_id,
  i.is_public,
  i.created_at,
  (SELECT COUNT(*) FROM public.activities WHERE itinerary_id = i.id) as activities_count,
  (SELECT COUNT(*) FROM public.packing_items WHERE itinerary_id = i.id) as packing_count,
  (SELECT COUNT(*) FROM public.expenses WHERE itinerary_id = i.id) as expenses_count
FROM public.itineraries i
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY i.created_at DESC;

-- ==============================================================================
-- SECTION 3: EXPENSES TABLE STRUCTURE
-- ==============================================================================

-- Check expenses table columns
SELECT
  'EXPENSES TABLE COLUMNS' as test_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- ==============================================================================
-- SECTION 4: ACTUAL EXPENSE DATA
-- ==============================================================================

-- Check all expenses for your itineraries (basic columns)
SELECT
  'YOUR EXPENSES - BASIC' as test_name,
  e.id,
  e.itinerary_id,
  i.title as itinerary_title,
  e.category,
  e.amount,
  e.user_id,
  e.created_at
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;

-- Check expenses with enhanced columns
SELECT
  'YOUR EXPENSES - ENHANCED' as test_name,
  e.id,
  i.title as itinerary_title,
  e.description,
  e.amount,
  e.category,
  e.paid_by_user_id,
  e.split_type,
  e.date,
  e.currency
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;

-- Try the join with profiles (this is what EnhancedExpenseTracker does)
SELECT
  'YOUR EXPENSES - WITH PROFILE JOIN' as test_name,
  e.id,
  i.title as itinerary_title,
  e.description,
  e.amount,
  e.paid_by_user_id,
  p.id as profile_id,
  p.name as paid_by_name,
  p.email as paid_by_email,
  p.avatar_url as paid_by_avatar
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
LEFT JOIN public.profiles p ON e.paid_by_user_id = p.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;

-- ==============================================================================
-- SECTION 5: PACKING ITEMS TABLE STRUCTURE
-- ==============================================================================

-- Check packing_items table columns
SELECT
  'PACKING_ITEMS TABLE COLUMNS' as test_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'packing_items'
ORDER BY ordinal_position;

-- ==============================================================================
-- SECTION 6: ACTUAL PACKING DATA
-- ==============================================================================

-- Check all packing items for your itineraries
SELECT
  'YOUR PACKING ITEMS' as test_name,
  p.id,
  p.itinerary_id,
  i.title as itinerary_title,
  p.name,
  p.is_packed,
  p.category,
  p.quantity,
  p.user_id,
  p.created_at
FROM public.packing_items p
JOIN public.itineraries i ON p.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- ==============================================================================
-- SECTION 7: RLS POLICY CHECK
-- ==============================================================================

-- Check which RLS policies are active on expenses
SELECT
  'EXPENSES RLS POLICIES' as test_name,
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

-- Check which RLS policies are active on packing_items
SELECT
  'PACKING_ITEMS RLS POLICIES' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'packing_items';

-- Check which RLS policies are active on profiles
SELECT
  'PROFILES RLS POLICIES' as test_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- ==============================================================================
-- SECTION 8: FOREIGN KEY CHECK
-- ==============================================================================

-- Check foreign key constraints on expenses
SELECT
  'EXPENSES FOREIGN KEYS' as test_name,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'expenses'
  AND tc.table_schema = 'public';

-- ==============================================================================
-- DONE!
-- ==============================================================================

SELECT '✅ Debug script completed! Please copy ALL results above.' as status;
