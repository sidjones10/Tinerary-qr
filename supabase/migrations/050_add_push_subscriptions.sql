-- ============================================================================
-- Migration 050: Add push_subscriptions table for Web Push notifications
-- ============================================================================
-- Stores Web Push API subscriptions so the server can send push notifications
-- to users' browsers/phones even when the app is not open.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate subscriptions for the same endpoint per user
  UNIQUE(user_id, endpoint)
);

-- Index for fast lookup by user_id (used when sending notifications)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Service role can read all subscriptions (for sending from cron)
CREATE POLICY "Service can read all push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (true);
