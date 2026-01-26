-- ============================================================================
-- Check what columns exist in the packing_items table
-- ============================================================================
-- Run this query and send me the results

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'packing_items'
ORDER BY ordinal_position;
