-- ============================================================================
-- MASTER DIAGNOSTIC QUERY
-- ============================================================================
-- Run this entire query in Supabase SQL Editor to get a complete health check
-- Copy ALL the output and share with Claude for analysis
-- ============================================================================

\echo '=========================================='
\echo '📊 TINERARY DATABASE HEALTH CHECK'
\echo '=========================================='
\echo ''

-- ============================================================================
-- 1. List all public tables
-- ============================================================================
\echo '1️⃣  TABLES IN DATABASE:'
\echo '------------------------------------------'
SELECT
  tablename AS table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_name = tablename AND table_schema = 'public') AS columns,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=========================================='

-- ============================================================================
-- 2. Check critical missing tables
-- ============================================================================
\echo '2️⃣  CRITICAL TABLES STATUS:'
\echo '------------------------------------------'
WITH required_tables AS (
  SELECT unnest(ARRAY['profiles', 'itineraries', 'activities', 'notifications',
                       'comments', 'saved_itineraries', 'itinerary_metrics']) AS table_name
)
SELECT
  rt.table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = rt.table_name AND schemaname = 'public')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status
FROM required_tables rt
ORDER BY rt.table_name;

\echo ''
\echo '=========================================='

-- ============================================================================
-- 3. Check notifications table structure
-- ============================================================================
\echo '3️⃣  NOTIFICATIONS TABLE STRUCTURE:'
\echo '------------------------------------------'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Expected columns: id, user_id, type, title, message, link_url, is_read, created_at, image_url, metadata'

\echo ''
\echo '=========================================='

-- ============================================================================
-- 4. Check saved_itineraries structure (for likes)
-- ============================================================================
\echo '4️⃣  SAVED_ITINERARIES TABLE STRUCTURE:'
\echo '------------------------------------------'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'saved_itineraries' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo 'Expected columns: id, user_id, itinerary_id, created_at, type (for likes)'

\echo ''
\echo '=========================================='

-- ============================================================================
-- 5. Check RLS policies for critical tables
-- ============================================================================
\echo '5️⃣  RLS POLICIES:'
\echo '------------------------------------------'
SELECT
  tablename,
  policyname,
  cmd AS operation,
  CASE WHEN roles = '{public}' THEN 'public' ELSE 'authenticated' END AS who
FROM pg_policies
WHERE tablename IN ('notifications', 'itinerary_metrics', 'comments', 'saved_itineraries')
ORDER BY tablename, policyname;

\echo ''
\echo 'Expected: INSERT policies for notifications, itinerary_metrics, comments'

\echo ''
\echo '=========================================='

-- ============================================================================
-- 6. Check for required functions
-- ============================================================================
\echo '6️⃣  DATABASE FUNCTIONS:'
\echo '------------------------------------------'
SELECT
  routine_name AS function_name,
  routine_type AS type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_comment_count',
    'decrement_comment_count',
    'increment_like_count',
    'decrement_like_count',
    'user_has_liked',
    'toggle_like',
    'increment_view_count',
    'increment_save_count'
  )
ORDER BY routine_name;

\echo ''
\echo 'Expected: 8 functions for likes, comments, and metrics'

\echo ''
\echo '=========================================='

-- ============================================================================
-- 7. Check triggers
-- ============================================================================
\echo '7️⃣  ACTIVE TRIGGERS:'
\echo '------------------------------------------'
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('comments', 'saved_itineraries', 'itinerary_metrics')
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '=========================================='

-- ============================================================================
-- 8. Check for data in critical tables
-- ============================================================================
\echo '8️⃣  ROW COUNTS:'
\echo '------------------------------------------'
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'itineraries', 'notifications', 'comments', 'saved_itineraries')
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO row_count;
    RAISE NOTICE '% : % rows', table_record.tablename, row_count;
  END LOOP;
END $$;

\echo ''
\echo '=========================================='

-- ============================================================================
-- 9. Quick fix suggestions
-- ============================================================================
\echo '9️⃣  QUICK FIX CHECKLIST:'
\echo '------------------------------------------'

-- Check if saved_itineraries needs type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_itineraries' AND column_name = 'type'
  ) THEN
    RAISE NOTICE '❌ saved_itineraries missing type column';
    RAISE NOTICE '   Fix: ALTER TABLE saved_itineraries ADD COLUMN type TEXT DEFAULT ''save'';';
  ELSE
    RAISE NOTICE '✅ saved_itineraries has type column';
  END IF;

  -- Check if notifications has metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    RAISE NOTICE '❌ notifications missing metadata column';
    RAISE NOTICE '   Fix: Apply migration 015_fix_notifications_and_metrics.sql';
  ELSE
    RAISE NOTICE '✅ notifications has metadata column';
  END IF;

  -- Check if comments table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'comments' AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '❌ comments table missing';
    RAISE NOTICE '   Fix: Apply migration 002_comments_system.sql';
  ELSE
    RAISE NOTICE '✅ comments table exists';
  END IF;

  -- Check if itinerary_metrics has INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itinerary_metrics' AND cmd = 'INSERT'
  ) THEN
    RAISE NOTICE '❌ itinerary_metrics missing INSERT policy';
    RAISE NOTICE '   Fix: Apply migration 015_fix_notifications_and_metrics.sql';
  ELSE
    RAISE NOTICE '✅ itinerary_metrics has INSERT policy';
  END IF;
END $$;

\echo ''
\echo '=========================================='
\echo '✅ DIAGNOSTIC COMPLETE'
\echo '=========================================='
\echo ''
\echo 'Next steps:'
\echo '1. Copy ALL output above'
\echo '2. Share with Claude for analysis'
\echo '3. Claude will create targeted fixes'
\echo ''
