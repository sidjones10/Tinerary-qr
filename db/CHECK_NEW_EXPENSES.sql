-- Check if ANY expenses exist now (to see if new ones were created after the fix)
SELECT
  e.id,
  e.itinerary_id,
  i.title as itinerary_name,
  e.title,
  e.description,
  e.amount,
  e.category,
  e.created_at
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
ORDER BY e.created_at DESC
LIMIT 10;
