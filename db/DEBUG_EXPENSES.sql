-- DEBUG EXPENSES ISSUE
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if expenses exist
SELECT
  'Total expenses in database' as check_name,
  COUNT(*) as count
FROM public.expenses;

-- 2. Check if required columns exist
SELECT
  'Columns in expenses table' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 3. Check actual expense data
SELECT
  id,
  itinerary_id,
  category,
  amount,
  description,
  paid_by_user_id,
  split_type,
  date,
  user_id,
  created_at
FROM public.expenses
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if profiles join works
SELECT
  e.id,
  e.description,
  e.amount,
  e.category,
  e.paid_by_user_id,
  p.id as profile_id,
  p.name as profile_name,
  p.email as profile_email
FROM public.expenses e
LEFT JOIN public.profiles p ON e.paid_by_user_id = p.id
ORDER BY e.created_at DESC
LIMIT 5;

-- 5. Check for a specific itinerary (replace with your itinerary ID)
-- First, get an itinerary ID:
SELECT
  'Recent itineraries' as info,
  id,
  title,
  created_at
FROM public.itineraries
ORDER BY created_at DESC
LIMIT 5;

-- Then check its expenses (uncomment and replace YOUR_ITINERARY_ID):
-- SELECT * FROM public.expenses WHERE itinerary_id = 'YOUR_ITINERARY_ID';
