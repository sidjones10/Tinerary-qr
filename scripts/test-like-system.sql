-- Test script to verify the like system is working correctly

\echo '========================================';
\echo 'Testing Like System';
\echo '========================================';
\echo '';

-- 1. Check if toggle_like function exists
\echo '1. Checking if toggle_like function exists...';
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'toggle_like'
) AS toggle_like_exists;

-- 2. Check if user_has_liked function exists
\echo '';
\echo '2. Checking if user_has_liked function exists...';
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'user_has_liked'
) AS user_has_liked_exists;

-- 3. Check saved_itineraries table structure
\echo '';
\echo '3. Checking saved_itineraries table structure...';
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_itineraries'
ORDER BY ordinal_position;

-- 4. Check if there are any likes in the system
\echo '';
\echo '4. Checking existing likes...';
SELECT COUNT(*) AS total_likes
FROM saved_itineraries
WHERE type = 'like';

-- 5. Check itinerary_metrics table
\echo '';
\echo '5. Checking itinerary_metrics...';
SELECT
  COUNT(*) AS total_metrics,
  SUM(like_count) AS total_like_count,
  AVG(like_count) AS avg_like_count
FROM itinerary_metrics;

-- 6. Check if triggers exist
\echo '';
\echo '6. Checking if triggers exist...';
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('like_count_increment', 'like_count_decrement');

\echo '';
\echo 'Test complete!';
