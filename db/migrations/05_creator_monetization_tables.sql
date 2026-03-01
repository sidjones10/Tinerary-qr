-- Creator Monetization Tables Migration
-- Adds tables for: boost campaigns, itinerary templates, sponsorship messages
-- Also adds tier and verified columns to profiles if not present

-- Add tier and is_verified columns to profiles (if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tier') THEN
    ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'user' CHECK (tier IN ('user', 'creator', 'business'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Boost Campaigns table
CREATE TABLE IF NOT EXISTS boost_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
  spent NUMERIC(10, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boost_campaigns_user_id ON boost_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_campaigns_status ON boost_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_boost_campaigns_itinerary_id ON boost_campaigns(itinerary_id);

-- Itinerary Templates table (for selling templates)
CREATE TABLE IF NOT EXISTS itinerary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  duration INTEGER DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cover_image TEXT,
  category TEXT DEFAULT 'General',
  sales_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_templates_creator_id ON itinerary_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_status ON itinerary_templates(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_category ON itinerary_templates(category);

-- Sponsorship Messages table
CREATE TABLE IF NOT EXISTS sponsorship_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_logo TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  budget TEXT,
  campaign_type TEXT DEFAULT 'Collaboration',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_messages_creator_id ON sponsorship_messages(creator_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_messages_status ON sponsorship_messages(status);

-- Template Purchases table (track who bought what)
CREATE TABLE IF NOT EXISTS template_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES itinerary_templates(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price_paid NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_template_purchases_buyer ON template_purchases(buyer_id);

-- Coin Transactions table (track coin earn/spend)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  action TEXT NOT NULL,
  reference_id TEXT,
  multiplier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);

-- Add coin_balance to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'coin_balance') THEN
    ALTER TABLE profiles ADD COLUMN coin_balance INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- RLS policies for boost_campaigns
ALTER TABLE boost_campaigns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boost_campaigns' AND policyname = 'Users can view own boost campaigns') THEN
    CREATE POLICY "Users can view own boost campaigns"
      ON boost_campaigns FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boost_campaigns' AND policyname = 'Users can create own boost campaigns') THEN
    CREATE POLICY "Users can create own boost campaigns"
      ON boost_campaigns FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boost_campaigns' AND policyname = 'Users can update own boost campaigns') THEN
    CREATE POLICY "Users can update own boost campaigns"
      ON boost_campaigns FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS policies for itinerary_templates
ALTER TABLE itinerary_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_templates' AND policyname = 'Anyone can view active templates') THEN
    CREATE POLICY "Anyone can view active templates"
      ON itinerary_templates FOR SELECT
      USING (status = 'active' OR auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_templates' AND policyname = 'Creators can manage own templates') THEN
    CREATE POLICY "Creators can manage own templates"
      ON itinerary_templates FOR INSERT
      WITH CHECK (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_templates' AND policyname = 'Creators can update own templates') THEN
    CREATE POLICY "Creators can update own templates"
      ON itinerary_templates FOR UPDATE
      USING (auth.uid() = creator_id);
  END IF;
END $$;

-- RLS policies for sponsorship_messages
ALTER TABLE sponsorship_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_messages' AND policyname = 'Creators can view own sponsorship messages') THEN
    CREATE POLICY "Creators can view own sponsorship messages"
      ON sponsorship_messages FOR SELECT
      USING (auth.uid() = creator_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_messages' AND policyname = 'Creators can update own sponsorship messages') THEN
    CREATE POLICY "Creators can update own sponsorship messages"
      ON sponsorship_messages FOR UPDATE
      USING (auth.uid() = creator_id);
  END IF;
END $$;

-- RLS policies for coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_transactions' AND policyname = 'Users can view own coin transactions') THEN
    CREATE POLICY "Users can view own coin transactions"
      ON coin_transactions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_transactions' AND policyname = 'Users can create own coin transactions') THEN
    CREATE POLICY "Users can create own coin transactions"
      ON coin_transactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON boost_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON itinerary_templates TO authenticated;
GRANT SELECT ON itinerary_templates TO anon;
GRANT SELECT, UPDATE ON sponsorship_messages TO authenticated;
GRANT SELECT, INSERT ON coin_transactions TO authenticated;
GRANT SELECT, INSERT ON template_purchases TO authenticated;
