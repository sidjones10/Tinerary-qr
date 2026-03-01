-- Affiliate Commerce Tables
-- Adds tables for affiliate link tracking, earnings, and packing item URLs

-- ─── Affiliate Links ──────────────────────────────────────────
-- Stores generated affiliate links with their codes, user IDs, and targets
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('promotion', 'itinerary', 'external')),
  target_url TEXT NOT NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(affiliate_code);

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Users can read their own affiliate links
CREATE POLICY "Users can view own affiliate links"
  ON affiliate_links FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own affiliate links
CREATE POLICY "Users can create own affiliate links"
  ON affiliate_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access on affiliate_links"
  ON affiliate_links FOR ALL
  USING (auth.role() = 'service_role');


-- ─── Affiliate Earnings ───────────────────────────────────────
-- Tracks commission earnings per affiliate conversion
-- status: 'pending' (tracked but payouts disabled), 'approved' (ready for payout), 'paid'
CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  user_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  user_tier TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_user_id ON affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_code ON affiliate_earnings(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON affiliate_earnings(status);

-- Enable RLS
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- Users can view their own earnings
CREATE POLICY "Users can view own affiliate earnings"
  ON affiliate_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access on affiliate_earnings"
  ON affiliate_earnings FOR ALL
  USING (auth.role() = 'service_role');


-- ─── Add URL column to packing_items ──────────────────────────
-- Allows users to attach product links to packing items
ALTER TABLE packing_items ADD COLUMN IF NOT EXISTS url TEXT;


-- ─── Add index on affiliate_clicks ────────────────────────────
-- Improve lookup performance for affiliate code queries
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks(affiliate_code);
