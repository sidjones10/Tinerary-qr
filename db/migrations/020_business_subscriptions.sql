-- Business Subscriptions table for tier-based premium features
-- Tracks which business tier (basic/premium/enterprise) each business is on

CREATE TABLE IF NOT EXISTS business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  mention_highlights_used INTEGER NOT NULL DEFAULT 0,
  mention_highlights_reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business_id ON business_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_status ON business_subscriptions(status);

-- RLS policies
ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business subscription"
  ON business_subscriptions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business subscription"
  ON business_subscriptions FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Bookings table (if not already created)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  attendee_names TEXT,
  attendee_emails TEXT,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_promotion_id ON bookings(promotion_id);

-- RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (user_id = auth.uid());
