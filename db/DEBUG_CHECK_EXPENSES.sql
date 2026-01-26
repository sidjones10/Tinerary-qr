-- ============================================================================
-- Check if any expenses exist for your itineraries
-- ============================================================================
-- Run this query and send me the results

SELECT
  e.*
FROM public.expenses e
JOIN public.itineraries i ON e.itinerary_id = i.id
WHERE i.user_id = auth.uid()
  AND i.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC
LIMIT 10;
