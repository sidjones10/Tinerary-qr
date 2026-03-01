-- ============================================================
-- Migration 06: Direct Messaging + Sponsorship Sender Fields
-- ============================================================

-- ─── Conversations ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON conversation_participants(user_id);

-- ─── Messages ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id);

-- ─── RLS for conversations ──────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- ─── RLS for conversation_participants ──────────────────────

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of own conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── RLS for messages ───────────────────────────────────────

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ─── Sponsorship sender tracking ────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsorship_messages' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE sponsorship_messages
      ADD COLUMN sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsorship_messages' AND column_name = 'sender_is_verified_business'
  ) THEN
    ALTER TABLE sponsorship_messages
      ADD COLUMN sender_is_verified_business BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sponsorship_messages_sender
  ON sponsorship_messages(sender_id);

-- Allow authenticated users to INSERT sponsorship messages
CREATE POLICY IF NOT EXISTS "Authenticated users can send sponsorship messages"
  ON sponsorship_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant INSERT on sponsorship_messages to authenticated role
GRANT INSERT ON sponsorship_messages TO authenticated;

-- ─── Grants for new tables ──────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
