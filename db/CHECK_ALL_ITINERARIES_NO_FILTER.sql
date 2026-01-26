-- Check ALL itineraries in the database (bypass RLS temporarily)
-- This will show us if itineraries exist with different user_ids

SELECT
  id,
  title,
  user_id,
  is_public,
  created_at
FROM public.itineraries
ORDER BY created_at DESC
LIMIT 20;
