-- Add custom pricing override column to business_subscriptions
-- Allows per-business price adjustments for early adopters, partnerships, promos.
--
-- The column is JSONB with this shape:
--   {
--     "monthlyPrice": 99,        -- custom price (null = standard)
--     "label": "Early Adopter",  -- shown to the business
--     "expiresAt": "2026-12-31", -- null = permanent
--     "reason": "Launch partner" -- internal note, not shown
--   }

ALTER TABLE business_subscriptions
  ADD COLUMN IF NOT EXISTS pricing_override JSONB DEFAULT NULL;

-- Optional: index for admin queries that need to find all overridden subs
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_pricing_override
  ON business_subscriptions USING gin (pricing_override)
  WHERE pricing_override IS NOT NULL;

COMMENT ON COLUMN business_subscriptions.pricing_override IS
  'Per-business custom pricing. NULL = standard tier price. See lib/paywall.ts PricingOverride type.';
