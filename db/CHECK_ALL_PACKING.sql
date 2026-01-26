-- Check if there are ANY packing items in the database at all
SELECT
  id,
  itinerary_id,
  name,
  is_packed,
  user_id,
  created_at
FROM public.packing_items
ORDER BY created_at DESC
LIMIT 20;
