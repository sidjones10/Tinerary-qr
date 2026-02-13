-- Test the toggle_like function to see what it returns
-- Run this in Supabase SQL Editor with your user_id and an itinerary_id

-- First, check if the function exists
SELECT
  proname as function_name,
  prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'toggle_like';

-- Check current state of saved_itineraries for a test user and itinerary
-- Replace with actual IDs
-- SELECT * FROM saved_itineraries
-- WHERE user_id = 'YOUR_USER_ID'
-- AND itinerary_id = 'YOUR_ITINERARY_ID';

-- Test the toggle_like function
-- Uncomment and replace with actual IDs to test:
-- SELECT * FROM toggle_like(
--   'YOUR_USER_UUID'::UUID,
--   'YOUR_ITINERARY_UUID'::UUID
-- );

-- Check the like count for an itinerary
-- SELECT like_count FROM itinerary_metrics WHERE itinerary_id = 'YOUR_ITINERARY_ID';
