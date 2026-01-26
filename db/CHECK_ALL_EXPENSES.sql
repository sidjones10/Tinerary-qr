-- Check if there are ANY expenses in the database at all
SELECT
  id,
  itinerary_id,
  title,
  amount,
  category,
  user_id,
  created_at
FROM public.expenses
ORDER BY created_at DESC
LIMIT 20;
