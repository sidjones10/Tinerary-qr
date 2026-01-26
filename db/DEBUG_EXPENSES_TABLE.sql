-- ============================================================================
-- Check what columns exist in the expenses table
-- ============================================================================
-- Run this query and send me the results

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;
