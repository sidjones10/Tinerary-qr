-- Check if you have ANY itineraries at all (no date limit)
SELECT
  id,
  title,
  created_at,
  is_public
FROM public.itineraries
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
