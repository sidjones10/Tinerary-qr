-- ============================================================
-- 059: Allow participants to delete their own conversations
-- ============================================================

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (id IN (SELECT get_user_conversation_ids(auth.uid())));
