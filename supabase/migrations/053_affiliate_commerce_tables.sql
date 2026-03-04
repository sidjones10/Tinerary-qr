-- Affiliate Commerce Tables
-- Adds tables for affiliate link tracking, earnings, and packing item URLs

-- ─── Affiliate Clicks ───────────────────────────────────────
-- Tracks individual clicks on affiliate links for analytics
-- Created BEFORE affiliate_links so the index at the bottom doesn't fail
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON affiliate_clicks(affiliate_code);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_clicks' AND policyname = 'Service role full access on affiliate_clicks'
  ) THEN
    CREATE POLICY "Service role full access on affiliate_clicks"
      ON affiliate_clicks FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;


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

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Users can view own affiliate links'
  ) THEN
    CREATE POLICY "Users can view own affiliate links"
      ON affiliate_links FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Users can create own affiliate links'
  ) THEN
    CREATE POLICY "Users can create own affiliate links"
      ON affiliate_links FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_links' AND policyname = 'Service role full access on affiliate_links'
  ) THEN
    CREATE POLICY "Service role full access on affiliate_links"
      ON affiliate_links FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;


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

ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_earnings' AND policyname = 'Users can view own affiliate earnings'
  ) THEN
    CREATE POLICY "Users can view own affiliate earnings"
      ON affiliate_earnings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'affiliate_earnings' AND policyname = 'Service role full access on affiliate_earnings'
  ) THEN
    CREATE POLICY "Service role full access on affiliate_earnings"
      ON affiliate_earnings FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ─── Add URL column to packing_items ──────────────────────────
-- Allows users to attach product links to packing items
ALTER TABLE packing_items ADD COLUMN IF NOT EXISTS url TEXT;
