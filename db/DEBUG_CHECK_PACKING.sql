-- ============================================================================
-- Check if any packing items exist for your itineraries
-- ============================================================================
-- Run this query and send me the results

SELECT
  p.*
FROM public.packing_items p
JOIN public.itineraries i ON p.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC
LIMIT 10;
