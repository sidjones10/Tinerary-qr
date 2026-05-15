-- ============================================================================
-- Migration 071: Add rsvp_note and guest_count to itinerary_invitations
-- ============================================================================
-- Supports Partiful-style RSVP where attendees can leave a message and
-- indicate how many guests they're bringing.

ALTER TABLE itinerary_invitations
  ADD COLUMN IF NOT EXISTS rsvp_note TEXT,
  ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 1;

-- Update the rsvp_to_event RPC to accept the new fields
CREATE OR REPLACE FUNCTION rsvp_to_event(
  p_itinerary_id UUID,
  p_response TEXT,
  p_note TEXT DEFAULT NULL,
  p_guest_count INTEGER DEFAULT 1
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
  v_guest_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_response NOT IN ('accepted', 'declined', 'tentative') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response');
  END IF;

  v_guest_count := GREATEST(1, COALESCE(p_guest_count, 1));

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

  SELECT id, status
    INTO v_invitation_id, v_existing_status
    FROM itinerary_invitations
   WHERE itinerary_id = p_itinerary_id
     AND invitee_id = v_user_id
   LIMIT 1;

  IF v_invitation_id IS NOT NULL THEN
    IF v_existing_status = p_response
       AND (p_note IS NULL)
       AND (p_guest_count IS NULL OR p_guest_count = 1)
    THEN
      RETURN jsonb_build_object(
        'success', true,
        'invitationId', v_invitation_id,
        'status', p_response
      );
    END IF;

    UPDATE itinerary_invitations
       SET status = p_response,
           rsvp_note = COALESCE(p_note, rsvp_note),
           guest_count = v_guest_count,
           updated_at = NOW(),
           expires_at = NULL
     WHERE id = v_invitation_id;

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
    IF v_invitations_enabled = false THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invitations are closed');
    END IF;

    INSERT INTO itinerary_invitations (
      itinerary_id, inviter_id, invitee_id, status, rsvp_note, guest_count, created_at, expires_at
    ) VALUES (
      p_itinerary_id,
      v_host_id,
      v_user_id,
      p_response,
      p_note,
      v_guest_count,
      NOW(),
      CASE
        WHEN v_start_date IS NOT NULL AND v_start_date > NOW()
          THEN v_start_date
        ELSE NOW() + INTERVAL '7 days'
      END
    )
    RETURNING id INTO v_invitation_id;

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

GRANT EXECUTE ON FUNCTION public.rsvp_to_event(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rsvp_to_event(UUID, TEXT, TEXT, INTEGER) TO anon;
