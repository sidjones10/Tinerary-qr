-- ============================================================================
-- Migration 069: Add RPC function for link-based RSVP
-- ============================================================================
-- This function handles RSVP when a user arrives via an invite link and
-- may not yet have an invitation record. It runs as SECURITY DEFINER
-- to bypass RLS (the invitee can't INSERT into itinerary_invitations
-- because the inviter_id would be the host, not themselves).
--
-- Called from the frontend via supabase.rpc('rsvp_to_event', {...})

CREATE OR REPLACE FUNCTION rsvp_to_event(
  p_itinerary_id UUID,
  p_response TEXT -- 'accepted', 'declined', or 'tentative'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_invitation_id UUID;
  v_host_id UUID;
  v_existing_status TEXT;
  v_invitations_enabled BOOLEAN;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Validate response
  IF p_response NOT IN ('accepted', 'declined', 'tentative') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response');
  END IF;

  -- Fetch the itinerary
  SELECT user_id, invitations_enabled, start_date
    INTO v_host_id, v_invitations_enabled, v_start_date
    FROM itineraries
   WHERE id = p_itinerary_id;

  IF v_host_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  IF v_host_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are the host');
  END IF;

  -- Check for existing invitation
  SELECT id, status
    INTO v_invitation_id, v_existing_status
    FROM itinerary_invitations
   WHERE itinerary_id = p_itinerary_id
     AND invitee_id = v_user_id
   LIMIT 1;

  IF v_invitation_id IS NOT NULL THEN
    -- Existing invitation — update it (even if expired)
    IF v_existing_status = p_response THEN
      RETURN jsonb_build_object(
        'success', true,
        'invitationId', v_invitation_id,
        'status', p_response
      );
    END IF;

    UPDATE itinerary_invitations
       SET status = p_response,
           updated_at = NOW(),
           expires_at = NULL
     WHERE id = v_invitation_id;

    -- Manage attendees
    IF p_response = 'accepted' THEN
      INSERT INTO itinerary_attendees (itinerary_id, user_id, role, joined_at)
      VALUES (p_itinerary_id, v_user_id, 'member', NOW())
      ON CONFLICT (itinerary_id, user_id) DO NOTHING;
    ELSIF v_existing_status = 'accepted' THEN
      DELETE FROM itinerary_attendees
       WHERE itinerary_id = p_itinerary_id
         AND user_id = v_user_id;
    END IF;
  ELSE
    -- No existing invitation — check if invitations are enabled
    IF v_invitations_enabled = false THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invitations are closed');
    END IF;

    -- Create new invitation
    INSERT INTO itinerary_invitations (
      itinerary_id, inviter_id, invitee_id, status, created_at, expires_at
    ) VALUES (
      p_itinerary_id,
      v_host_id,
      v_user_id,
      p_response,
      NOW(),
      CASE
        WHEN v_start_date IS NOT NULL AND v_start_date > NOW()
          THEN v_start_date
        ELSE NOW() + INTERVAL '7 days'
      END
    )
    RETURNING id INTO v_invitation_id;

    -- Add as attendee if accepting
    IF p_response = 'accepted' THEN
      INSERT INTO itinerary_attendees (itinerary_id, user_id, role, joined_at)
      VALUES (p_itinerary_id, v_user_id, 'member', NOW())
      ON CONFLICT (itinerary_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invitationId', v_invitation_id,
    'status', p_response
  );
END;
$$;
