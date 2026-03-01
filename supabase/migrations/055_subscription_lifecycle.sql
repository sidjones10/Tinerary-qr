-- Subscription lifecycle fields for proper billing period management
-- Supports: cancel-at-period-end, resubscribe without double charge,
-- prorated upgrades, deferred downgrades

ALTER TABLE business_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_tier TEXT DEFAULT NULL CHECK (pending_tier IS NULL OR pending_tier IN ('basic', 'premium', 'enterprise')),
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ DEFAULT NULL;

-- Index for finding subscriptions due for renewal or pending changes
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_period_end
  ON business_subscriptions(current_period_end)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_pending_tier
  ON business_subscriptions(pending_tier)
  WHERE pending_tier IS NOT NULL;

COMMENT ON COLUMN business_subscriptions.current_period_start IS
  'Start of the current paid billing period.';
COMMENT ON COLUMN business_subscriptions.current_period_end IS
  'End of the current paid billing period. User retains access until this date.';
COMMENT ON COLUMN business_subscriptions.cancel_at_period_end IS
  'When true, subscription will not renew but user keeps access until current_period_end.';
COMMENT ON COLUMN business_subscriptions.pending_tier IS
  'If set, the subscription will switch to this tier at the start of the next billing period (downgrade).';
COMMENT ON COLUMN business_subscriptions.paid_amount IS
  'Amount actually paid for the current period (may differ from standard price due to proration or overrides).';
COMMENT ON COLUMN business_subscriptions.canceled_at IS
  'Timestamp when the user requested cancellation. NULL if not canceled.';
