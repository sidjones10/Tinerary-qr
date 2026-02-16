-- Migration: Add login_events table for sign-in tracking and security alerts
-- This table records every sign-in so users can be notified and revoke suspicious sessions.

CREATE TABLE IF NOT EXISTS public.login_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revoked BOOLEAN DEFAULT false NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoke_token UUID DEFAULT gen_random_uuid() NOT NULL
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_revoke_token ON public.login_events(revoke_token);

-- RLS policies
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own login events
CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT
  USING (auth.uid() = user_id);

-- Server-side inserts (via service role or API routes)
CREATE POLICY "Service can insert login events"
  ON public.login_events FOR INSERT
  WITH CHECK (true);

-- Users can update (revoke) their own login events
CREATE POLICY "Users can revoke own login events"
  ON public.login_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all login events
CREATE POLICY "Admins can view all login events"
  ON public.login_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );
