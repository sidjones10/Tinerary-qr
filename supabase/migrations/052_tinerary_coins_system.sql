-- Tinerary Coins System
-- Adds coin balance tracking, transaction history, and redemption tables

-- ─── Add account tier to profiles ───────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_tier TEXT NOT NULL DEFAULT 'user'
    CHECK (account_tier IN ('user', 'creator', 'business'));

-- ─── Coin balances (materialized view of transactions) ──────────
CREATE TABLE IF NOT EXISTS coin_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Coin transactions (full ledger) ────────────────────────────
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- positive = earn, negative = spend
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  action TEXT NOT NULL, -- machine-readable action key
  description TEXT NOT NULL, -- human-readable description
  reference_type TEXT, -- 'itinerary', 'review', 'referral', 'redemption', etc.
  reference_id UUID, -- ID of related entity
  metadata JSONB DEFAULT '{}', -- extra context (e.g. reward slug)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Coin redemptions (spending records) ─────────────────────────
CREATE TABLE IF NOT EXISTS coin_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES coin_transactions(id) ON DELETE CASCADE NOT NULL,
  reward_slug TEXT NOT NULL, -- machine-readable reward identifier
  reward_name TEXT NOT NULL, -- human-readable reward name
  cost INTEGER NOT NULL CHECK (cost > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- discount code, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coin_balances_user_id ON coin_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_action ON coin_transactions(action);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_reference ON coin_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_coin_redemptions_user_id ON coin_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_redemptions_status ON coin_redemptions(status);

-- ─── Enable RLS ──────────────────────────────────────────────────
ALTER TABLE coin_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_redemptions ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────────

-- coin_balances: users can view their own balance
CREATE POLICY "Users can view own coin balance"
  ON coin_balances FOR SELECT
  USING (auth.uid() = user_id);

-- coin_balances: system inserts/updates via service role or trigger
CREATE POLICY "Users can insert own coin balance"
  ON coin_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coin balance"
  ON coin_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- coin_transactions: users can view their own transactions
CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin transactions"
  ON coin_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- coin_redemptions: users can view their own redemptions
CREATE POLICY "Users can view own coin redemptions"
  ON coin_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin redemptions"
  ON coin_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coin redemptions"
  ON coin_redemptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── Helper: ensure coin balance row exists ──────────────────────
CREATE OR REPLACE FUNCTION ensure_coin_balance(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO coin_balances (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Function: award coins to a user ─────────────────────────────
CREATE OR REPLACE FUNCTION award_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_multiplier INTEGER := 1;
  v_final_amount INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Check if user has creator tier for 2x multiplier
  SELECT CASE WHEN account_tier = 'creator' THEN 2 ELSE 1 END
  INTO v_multiplier
  FROM profiles
  WHERE id = p_user_id;

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

-- ─── Function: spend coins ───────────────────────────────────────
CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_action TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_current_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Ensure balance row exists
  PERFORM ensure_coin_balance(p_user_id);

  -- Check sufficient balance
  SELECT balance INTO v_current_balance
  FROM coin_balances
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row to prevent race conditions

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

-- ─── Grant execute on functions to authenticated users ───────────
GRANT EXECUTE ON FUNCTION ensure_coin_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_coins(UUID, INTEGER, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION spend_coins(UUID, INTEGER, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
