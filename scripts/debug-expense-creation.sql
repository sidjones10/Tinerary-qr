-- Debug script to check expense creation issues
-- Run this after creating an itinerary with expenses to see what went wrong

-- 1. Check recent itineraries and their attendees
SELECT
  i.id as itinerary_id,
  i.title,
  i.user_id as owner_id,
  i.created_at,
  COUNT(DISTINCT ia.id) as attendee_count
FROM itineraries i
LEFT JOIN itinerary_attendees ia ON i.id = ia.itinerary_id
WHERE i.created_at > NOW() - INTERVAL '1 hour'
GROUP BY i.id, i.title, i.user_id, i.created_at
ORDER BY i.created_at DESC
LIMIT 10;

-- 2. Check expenses for recent itineraries
SELECT
  e.id as expense_id,
  e.itinerary_id,
  e.title,
  e.category,
  e.amount,
  e.user_id as creator_id,
  e.paid_by_user_id,
  e.split_type,
  e.created_at,
  COUNT(DISTINCT es.id) as split_count
FROM expenses e
LEFT JOIN expense_splits es ON e.id = es.expense_id
WHERE e.created_at > NOW() - INTERVAL '1 hour'
GROUP BY e.id, e.itinerary_id, e.title, e.category, e.amount, e.user_id, e.paid_by_user_id, e.split_type, e.created_at
ORDER BY e.created_at DESC
LIMIT 20;

-- 3. Check expense splits for recent expenses
SELECT
  es.id as split_id,
  es.expense_id,
  e.title as expense_title,
  e.itinerary_id,
  es.user_id,
  p.name as user_name,
  es.amount as split_amount,
  es.is_paid,
  es.created_at
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
LEFT JOIN profiles p ON es.user_id = p.id
WHERE es.created_at > NOW() - INTERVAL '1 hour'
ORDER BY es.created_at DESC
LIMIT 30;

-- 4. Find itineraries with expenses but no splits (THE PROBLEM!)
SELECT
  i.title as itinerary_title,
  e.id as expense_id,
  e.title as expense_title,
  e.amount,
  e.created_at as expense_created,
  COUNT(DISTINCT es.id) as split_count,
  COUNT(DISTINCT ia.id) as attendee_count
FROM itineraries i
JOIN expenses e ON i.id = e.itinerary_id
LEFT JOIN expense_splits es ON e.id = es.expense_id
LEFT JOIN itinerary_attendees ia ON i.id = ia.itinerary_id
WHERE e.created_at > NOW() - INTERVAL '24 hours'
GROUP BY i.title, e.id, e.title, e.amount, e.created_at
HAVING COUNT(DISTINCT es.id) = 0
ORDER BY e.created_at DESC;

-- 5. Check if itinerary_attendees table exists and has data
SELECT
  COUNT(*) as total_attendees,
  COUNT(DISTINCT itinerary_id) as itineraries_with_attendees
FROM itinerary_attendees;
