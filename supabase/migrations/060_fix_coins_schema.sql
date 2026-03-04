-- Fix Tinerary Coins Schema
-- Ensures coin_transactions has all required columns regardless of which migration ran first.
-- Migration 05 creates a minimal coin_transactions; migration 052 expects description, reference_type, metadata.

-- Add missing columns to coin_transactions if they don't exist
ALTER TABLE coin_transactions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE coin_transactions ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE coin_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- The old migration used reference_id TEXT, the new one uses UUID.
-- If it's TEXT, rename and add UUID column. If it's already UUID, this is a no-op.
-- Safest approach: ensure reference_id is TEXT (accepts both UUIDs and arbitrary strings)
DO $$
BEGIN
  -- Check current type of reference_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coin_transactions' AND column_name = 'reference_id' AND data_type = 'uuid'
  ) THEN
    -- Already UUID — change to TEXT to be more flexible
    ALTER TABLE coin_transactions ALTER COLUMN reference_id TYPE TEXT USING reference_id::TEXT;
  END IF;
END $$;

-- Ensure coin_balances table exists (in case only migration 05 ran, not 052)
CREATE TABLE IF NOT EXISTS coin_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_balances_user_id ON coin_balances(user_id);

-- Ensure coin_redemptions table exists
CREATE TABLE IF NOT EXISTS coin_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES coin_transactions(id) ON DELETE CASCADE NOT NULL,
  reward_slug TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_redemptions_user_id ON coin_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_redemptions_status ON coin_redemptions(status);

-- Ensure referrals table exists for tracking referral sign-ups
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- Ensure reviews table exists for business reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);

-- RLS for new tables
ALTER TABLE coin_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS pattern via DO blocks)
DO $$
BEGIN
  -- coin_balances
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_balances' AND policyname = 'Users can view own coin balance') THEN
    CREATE POLICY "Users can view own coin balance" ON coin_balances FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_balances' AND policyname = 'Users can insert own coin balance') THEN
    CREATE POLICY "Users can insert own coin balance" ON coin_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_balances' AND policyname = 'Users can update own coin balance') THEN
    CREATE POLICY "Users can update own coin balance" ON coin_balances FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- coin_redemptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_redemptions' AND policyname = 'Users can view own coin redemptions') THEN
    CREATE POLICY "Users can view own coin redemptions" ON coin_redemptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_redemptions' AND policyname = 'Users can insert own coin redemptions') THEN
    CREATE POLICY "Users can insert own coin redemptions" ON coin_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coin_redemptions' AND policyname = 'Users can update own coin redemptions') THEN
    CREATE POLICY "Users can update own coin redemptions" ON coin_redemptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- referrals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can view own referrals') THEN
    CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can insert referrals') THEN
    CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
  END IF;

  -- reviews
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view reviews') THEN
    CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert own reviews') THEN
    CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update own reviews') THEN
    CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recreate functions with TEXT reference_id (compatible with both migration paths)
CREATE OR REPLACE FUNCTION ensure_coin_balance(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO coin_balances (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_multiplier INTEGER := 1;
  v_final_amount INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Check if user has creator tier for 2x multiplier
  SELECT CASE
    WHEN tier = 'creator' OR account_tier = 'creator' THEN 2
    ELSE 1
  END INTO v_multiplier
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    v_multiplier := 1;
  END IF;

  v_final_amount := p_amount * v_multiplier;

  -- Ensure balance row exists
  PERFORM ensure_coin_balance(p_user_id);

  -- Insert transaction
  INSERT INTO coin_transactions (user_id, amount, type, action, description, reference_type, reference_id, metadata)
  VALUES (p_user_id, v_final_amount, 'earn', p_action, p_description, p_reference_type, p_reference_id, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Update balance
  UPDATE coin_balances
  SET balance = balance + v_final_amount,
      lifetime_earned = lifetime_earned + v_final_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_current_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Ensure balance row exists
  PERFORM ensure_coin_balance(p_user_id);

  -- Check sufficient balance (lock row)
  SELECT balance INTO v_current_balance
  FROM coin_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient coin balance. Have %, need %', v_current_balance, p_amount;
  END IF;

  -- Insert transaction (negative amount)
  INSERT INTO coin_transactions (user_id, amount, type, action, description, reference_type, reference_id, metadata)
  VALUES (p_user_id, -p_amount, 'spend', p_action, p_description, p_reference_type, p_reference_id, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Update balance
  UPDATE coin_balances
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION ensure_coin_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_coins(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION spend_coins(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON coin_balances TO authenticated;
GRANT SELECT, INSERT ON coin_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON coin_redemptions TO authenticated;
GRANT SELECT, INSERT ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;
