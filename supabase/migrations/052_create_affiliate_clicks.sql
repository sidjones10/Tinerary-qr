-- Create affiliate_clicks table
-- This table must exist before migration 053 which references it
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
