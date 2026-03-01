-- ============================================================
-- 057: Messaging system tables (idempotent)
-- Creates conversations, conversation_participants, and messages
-- if they do not already exist. Wraps policies in existence checks
-- to avoid "already exists" errors on re-run.
-- ============================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation participants (links users to conversations)
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(conversation_id, is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON conversations(updated_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ─── Policies (wrapped in existence checks) ──────────────────

DO $$
BEGIN
  -- conversations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view own conversations') THEN
    CREATE POLICY "Users can view own conversations"
      ON conversations FOR SELECT
      USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Authenticated users can create conversations') THEN
    CREATE POLICY "Authenticated users can create conversations"
      ON conversations FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can update own conversations') THEN
    CREATE POLICY "Users can update own conversations"
      ON conversations FOR UPDATE
      USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
  END IF;

  -- conversation_participants policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Users can view participants of own conversations') THEN
    CREATE POLICY "Users can view participants of own conversations"
      ON conversation_participants FOR SELECT
      USING (conversation_id IN (SELECT conversation_id FROM conversation_participants cp WHERE cp.user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'Authenticated users can add participants') THEN
    CREATE POLICY "Authenticated users can add participants"
      ON conversation_participants FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in own conversations') THEN
    CREATE POLICY "Users can view messages in own conversations"
      ON messages FOR SELECT
      USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages to own conversations') THEN
    CREATE POLICY "Users can send messages to own conversations"
      ON messages FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update own messages') THEN
    CREATE POLICY "Users can update own messages"
      ON messages FOR UPDATE
      USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─── Grants ──────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- ─── Enable realtime for messages ────────────────────────────
-- Only add if not already in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
