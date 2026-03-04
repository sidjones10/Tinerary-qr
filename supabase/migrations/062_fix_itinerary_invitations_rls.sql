-- ============================================================================
-- Fix: Add missing RLS policies for itinerary_invitations
-- ============================================================================
-- The itinerary_invitations table had RLS enabled (migration 001) but ZERO
-- policies, which silently blocked ALL operations. This prevented:
--   1. Creating invitation records
--   2. In-app notifications (code is gated behind successful invite insert)
--   3. Invite emails (same gate)
--
-- Also adds policies for pending_invitations (non-user invites).

-- ============================================================================
-- itinerary_invitations policies
-- ============================================================================

-- Inviters can create invitations
CREATE POLICY "Users can create invitations"
  ON itinerary_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Users can view invitations they sent or received
CREATE POLICY "Users can view own invitations"
  ON itinerary_invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Invitees can update invitations (accept/decline)
CREATE POLICY "Invitees can update invitations"
  ON itinerary_invitations FOR UPDATE
  USING (auth.uid() = invitee_id);

-- Inviters can delete/cancel invitations they sent
CREATE POLICY "Inviters can delete own invitations"
  ON itinerary_invitations FOR DELETE
  USING (auth.uid() = inviter_id);

-- ============================================================================
-- pending_invitations policies (if RLS is enabled)
-- ============================================================================

-- Enable RLS on pending_invitations if not already enabled
ALTER TABLE IF EXISTS pending_invitations ENABLE ROW LEVEL SECURITY;

-- Inviters can create pending invitations
DROP POLICY IF EXISTS "Users can create pending invitations" ON pending_invitations;
CREATE POLICY "Users can create pending invitations"
  ON pending_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Users can view pending invitations they sent
DROP POLICY IF EXISTS "Users can view own pending invitations" ON pending_invitations;
CREATE POLICY "Users can view own pending invitations"
  ON pending_invitations FOR SELECT
  USING (auth.uid() = inviter_id);

-- Inviters can update/delete their pending invitations
DROP POLICY IF EXISTS "Users can update own pending invitations" ON pending_invitations;
CREATE POLICY "Users can update own pending invitations"
  ON pending_invitations FOR UPDATE
  USING (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can delete own pending invitations" ON pending_invitations;
CREATE POLICY "Users can delete own pending invitations"
  ON pending_invitations FOR DELETE
  USING (auth.uid() = inviter_id);
