-- ============================================================================
-- STEP 1: Check your recent itineraries
-- ============================================================================
-- Copy this query, run it alone, and send me the results

SELECT
  i.id,
  i.title,
  i.created_at,
  (SELECT COUNT(*) FROM public.packing_items WHERE itinerary_id = i.id) as packing_count,
  (SELECT COUNT(*) FROM public.expenses WHERE itinerary_id = i.id) as expense_count
FROM public.itineraries i
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY i.created_at DESC;
