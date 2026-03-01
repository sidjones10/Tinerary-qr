-- Business Webhooks
-- Enterprise-tier feature: up to 10 webhook integrations per business
-- Webhooks fire on business events (promotion metrics, bookings, etc.)

CREATE TABLE IF NOT EXISTS business_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,                -- HMAC-SHA256 signing secret
  events TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'promotion.viewed','booking.created'}
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,                     -- optional human-readable label
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT url_is_https CHECK (url LIKE 'https://%')
);

CREATE INDEX IF NOT EXISTS idx_business_webhooks_business_id
  ON business_webhooks(business_id);

-- Enable RLS
ALTER TABLE business_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by webhook delivery)
CREATE POLICY "Service role full access on business_webhooks"
  ON business_webhooks FOR ALL
  USING (auth.role() = 'service_role');

-- Business owners can manage their own webhooks via the API
-- (The API verifies business ownership before querying)
CREATE POLICY "Business owners can view own webhooks"
  ON business_webhooks FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert own webhooks"
  ON business_webhooks FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update own webhooks"
  ON business_webhooks FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete own webhooks"
  ON business_webhooks FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );


-- ─── Webhook Delivery Log ───────────────────────────────────────
-- Tracks each delivery attempt for debugging and retry

CREATE TABLE IF NOT EXISTS webhook_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES business_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_webhook_id
  ON webhook_delivery_log(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_delivered_at
  ON webhook_delivery_log(delivered_at DESC);

ALTER TABLE webhook_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on webhook_delivery_log"
  ON webhook_delivery_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Business owners can view own delivery logs"
  ON webhook_delivery_log FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM business_webhooks
      WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );
