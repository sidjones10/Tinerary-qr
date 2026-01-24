-- Diagnostic Query: Check which tables exist in your database
-- Copy this entire query and run it in Supabase SQL Editor
-- Then paste the results back to me

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'itineraries',
    'activities',
    'packing_items',
    'expenses',
    'itinerary_categories',
    'itinerary_metrics',
    'notifications',
    'saved_itineraries',
    'comments',
    'likes',
    'follows',
    'user_preferences',
    'user_interactions',
    'itinerary_invitations',
    'drafts',
    'promotions',
    'bookings',
    'tickets',
    'verification_codes',
    'users'
  ]) AS table_name
),
actual_tables AS (
  SELECT tablename AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
)
SELECT
  et.table_name,
  CASE
    WHEN at.table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status,
  CASE
    WHEN at.table_name IS NOT NULL THEN
      (SELECT COUNT(*) FROM information_schema.columns
       WHERE table_name = et.table_name AND table_schema = 'public')
    ELSE 0
  END AS column_count
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
ORDER BY
  CASE WHEN at.table_name IS NOT NULL THEN 0 ELSE 1 END,
  et.table_name;

-- Also show any tables that exist but weren't in our expected list
SELECT
  '⚠️  UNEXPECTED: ' || tablename AS table_name,
  'Additional table found' AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    'profiles', 'itineraries', 'activities', 'packing_items', 'expenses',
    'itinerary_categories', 'itinerary_metrics', 'notifications', 'saved_itineraries',
    'comments', 'likes', 'follows', 'user_preferences', 'user_interactions',
    'itinerary_invitations', 'drafts', 'promotions', 'bookings', 'tickets',
    'verification_codes', 'users'
  )
ORDER BY tablename;
