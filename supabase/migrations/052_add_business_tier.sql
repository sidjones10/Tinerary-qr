-- Add business_tier column to businesses table
-- Defaults to 'basic' for the Basic Business Plan

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS business_tier TEXT NOT NULL DEFAULT 'basic'
CHECK (business_tier IN ('basic', 'premium', 'enterprise'));

-- Add index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_businesses_tier ON businesses (business_tier);
