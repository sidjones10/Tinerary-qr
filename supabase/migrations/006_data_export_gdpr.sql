-- Add GDPR Data Export Function
-- Allows users to export all their data in JSON format

-- ============================================================================
-- GDPR Compliance: Right to Data Portability
-- ============================================================================
-- This migration provides a function to export all user data in a structured
-- JSON format, complying with GDPR Article 20 (Right to data portability)
-- and CCPA requirements for data access.
-- ============================================================================

-- Function to export all user data
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
  profile_data JSONB;
  itineraries_data JSONB;
  comments_data JSONB;
  saved_items_data JSONB;
  notifications_data JSONB;
  behavior_data JSONB;
BEGIN
  -- Get profile data
  SELECT to_jsonb(p.*) INTO profile_data
  FROM profiles p
  WHERE p.id = user_id;

  -- Get all itineraries created by user with their activities, packing lists, and expenses
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'title', i.title,
      'description', i.description,
      'location', i.location,
      'start_date', i.start_date,
      'end_date', i.end_date,
      'duration', i.duration,
      'image_url', i.image_url,
      'is_public', i.is_public,
      'is_draft', i.is_draft,
      'tags', i.tags,
      'created_at', i.created_at,
      'updated_at', i.updated_at,
      'activities', (
        SELECT COALESCE(jsonb_agg(to_jsonb(a.*)), '[]'::jsonb)
        FROM activities a
        WHERE a.itinerary_id = i.id
      ),
      'packing_lists', (
        SELECT COALESCE(jsonb_agg(to_jsonb(pl.*)), '[]'::jsonb)
        FROM packing_lists pl
        WHERE pl.itinerary_id = i.id
      ),
      'expenses', (
        SELECT COALESCE(jsonb_agg(to_jsonb(e.*)), '[]'::jsonb)
        FROM expenses e
        WHERE e.itinerary_id = i.id
      )
    )
  ), '[]'::jsonb) INTO itineraries_data
  FROM itineraries i
  WHERE i.user_id = user_id;

  -- Get all comments made by user
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'itinerary_id', c.itinerary_id,
      'content', c.content,
      'created_at', c.created_at,
      'updated_at', c.updated_at
    )
  ), '[]'::jsonb) INTO comments_data
  FROM comments c
  WHERE c.user_id = user_id;

  -- Get all saved/liked itineraries
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'itinerary_id', si.itinerary_id,
      'type', si.type,
      'created_at', si.created_at
    )
  ), '[]'::jsonb) INTO saved_items_data
  FROM saved_itineraries si
  WHERE si.user_id = user_id;

  -- Get all notifications
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'type', n.type,
      'title', n.title,
      'message', n.message,
      'is_read', n.is_read,
      'created_at', n.created_at
    )
  ), '[]'::jsonb) INTO notifications_data
  FROM notifications n
  WHERE n.user_id = user_id;

  -- Get user behavior data
  SELECT to_jsonb(ub.*) INTO behavior_data
  FROM user_behavior ub
  WHERE ub.user_id = user_id;

  -- Combine all data into a single JSON object
  user_data := jsonb_build_object(
    'export_date', NOW(),
    'user_id', user_id,
    'profile', profile_data,
    'itineraries', itineraries_data,
    'comments', comments_data,
    'saved_itineraries', saved_items_data,
    'notifications', notifications_data,
    'behavior', behavior_data
  );

  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_user_data IS 'Export all user data in JSON format for GDPR compliance';

-- Grant execute permission to authenticated users (they can only export their own data via RLS in the API)
GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Data Export Function Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'GDPR Compliance Features:';
  RAISE NOTICE '  ✓ export_user_data(user_id) - Export all user data';
  RAISE NOTICE '';
  RAISE NOTICE 'Data Included in Export:';
  RAISE NOTICE '  • Profile information';
  RAISE NOTICE '  • All itineraries (with activities, packing, expenses)';
  RAISE NOTICE '  • Comments made by user';
  RAISE NOTICE '  • Saved/liked itineraries';
  RAISE NOTICE '  • Notifications';
  RAISE NOTICE '  • User behavior data';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Create API endpoint: /api/user/export-data';
  RAISE NOTICE '  2. Add "Download My Data" button to profile page';
  RAISE NOTICE '  3. Test the export functionality';
  RAISE NOTICE '';
  RAISE NOTICE 'See docs/DATA_EXPORT.md for implementation guide';
  RAISE NOTICE '';
END $$;
