-- Quick-fix script to add mutuals function to your Supabase database
-- Run this in the Supabase SQL Editor if you haven't applied migration 016

-- Drop the function if it exists (to allow re-running)
DROP FUNCTION IF EXISTS get_mutual_connections(UUID, INT);

-- Create the function to get mutual connections
CREATE OR REPLACE FUNCTION get_mutual_connections(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  shared_events_count BIGINT,
  next_shared_event_id UUID,
  next_shared_event_title TEXT,
  next_shared_event_start_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_events AS (
    -- Get all events the user created
    SELECT i.id as event_id
    FROM itineraries i
    WHERE i.user_id = p_user_id

    UNION

    -- Get all events the user is invited to (accepted)
    SELECT ii.itinerary_id as event_id
    FROM itinerary_invitations ii
    WHERE ii.invitee_id = p_user_id
    AND ii.status = 'accepted'
  ),
  mutual_users AS (
    -- Find creators of these events (excluding the user)
    SELECT DISTINCT
      i.user_id as mutual_id,
      i.id as event_id,
      i.title as event_title,
      i.start_date as event_start_date
    FROM itineraries i
    INNER JOIN user_events ue ON i.id = ue.event_id
    WHERE i.user_id != p_user_id

    UNION

    -- Find attendees of these events (excluding the user)
    SELECT DISTINCT
      ii.invitee_id as mutual_id,
      i.id as event_id,
      i.title as event_title,
      i.start_date as event_start_date
    FROM itinerary_invitations ii
    INNER JOIN itineraries i ON ii.itinerary_id = i.id
    INNER JOIN user_events ue ON i.id = ue.event_id
    WHERE ii.invitee_id != p_user_id
    AND ii.status = 'accepted'
  ),
  mutual_event_counts AS (
    SELECT
      mu.mutual_id,
      COUNT(DISTINCT mu.event_id) as event_count,
      MIN(CASE
        WHEN mu.event_start_date >= NOW()
        THEN mu.event_id
        ELSE NULL
      END) as next_event_id,
      MIN(CASE
        WHEN mu.event_start_date >= NOW()
        THEN mu.event_title
        ELSE NULL
      END) as next_event_title,
      MIN(CASE
        WHEN mu.event_start_date >= NOW()
        THEN mu.event_start_date
        ELSE NULL
      END) as next_event_date
    FROM mutual_users mu
    GROUP BY mu.mutual_id
  )
  SELECT
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    mec.event_count as shared_events_count,
    mec.next_event_id as next_shared_event_id,
    mec.next_event_title as next_shared_event_title,
    mec.next_event_date as next_shared_event_start_date
  FROM mutual_event_counts mec
  INNER JOIN profiles p ON p.id = mec.mutual_id
  ORDER BY mec.event_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_mutual_connections(UUID, INT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_mutual_connections IS 'Finds users who share events with the given user, sorted by number of shared events';

-- Done!
SELECT 'Mutuals function created successfully! ✓' as status;
