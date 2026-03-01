-- ============================================================
-- 058: Fix infinite recursion in messaging RLS policies
--
-- The conversation_participants SELECT policy references itself,
-- causing "infinite recursion detected in policy" errors.
-- Fix: use a SECURITY DEFINER function to look up a user's
-- conversation IDs without triggering RLS.
-- ============================================================

-- 1. Create a SECURITY DEFINER function that returns conversation IDs
--    for a given user. Runs as the function owner (bypasses RLS on
--    the lookup), so other policies can call it without recursion.

CREATE OR REPLACE FUNCTION get_user_conversation_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT conversation_id
  FROM conversation_participants
  WHERE user_id = uid;
$$;

-- 2. Drop all existing policies that cause or participate in the recursion

-- conversation_participants policies
DROP POLICY IF EXISTS "Users can view participants of own conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can add participants" ON conversation_participants;

-- conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

-- messages policies
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
-- Also handle alternate policy name from migration 057
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON messages;

-- 3. Recreate all policies using the SECURITY DEFINER function

-- ── conversation_participants ────────────────────────────────

CREATE POLICY "Users can view participants of own conversations"
  ON conversation_participants FOR SELECT
  USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Authenticated users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── conversations ────────────────────────────────────────────

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (id IN (SELECT get_user_conversation_ids(auth.uid())));

-- ── messages ─────────────────────────────────────────────────

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Users can send messages to own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));
