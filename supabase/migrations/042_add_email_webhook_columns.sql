-- Migration: Add Resend webhook tracking columns to email_logs
-- Stores the Resend email ID so webhook events can update delivery status.

-- Resend email ID returned at send time
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS resend_id TEXT;

-- Delivery lifecycle timestamps (populated by Resend webhooks)
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ;

-- Index for fast webhook lookups by resend_id
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_id);

-- Allow service-role updates (for the webhook handler)
CREATE POLICY "Service can update email logs"
  ON public.email_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);
