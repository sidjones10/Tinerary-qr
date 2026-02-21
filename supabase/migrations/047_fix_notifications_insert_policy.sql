-- Fix notifications INSERT policy: allow authenticated users to create
-- notifications for any user, not just themselves.
-- Social features (likes, comments, follows) create notifications for
-- OTHER users, so the old policy (auth.uid() = user_id) blocked them.

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
