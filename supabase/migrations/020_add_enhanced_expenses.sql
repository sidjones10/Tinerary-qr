-- Migration: Enhanced Expense Tracking System
-- Adds split expenses, settlements, and advanced expense features

-- First, ensure user_id column exists (it should, but let's be safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing columns to expenses table
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'custom', 'shares'));

-- Set paid_by_user_id to user_id for existing records (only if user_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    UPDATE expenses SET paid_by_user_id = user_id WHERE paid_by_user_id IS NULL;
  END IF;
END $$;

-- Set date to created_at for existing records
UPDATE expenses SET date = created_at WHERE date IS NULL;

-- Create expense_splits table for tracking who owes what
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_paid ON expense_splits(is_paid);
CREATE INDEX IF NOT EXISTS idx_expenses_itinerary ON expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- RLS Policies for expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Anyone can view expenses for public itineraries
DROP POLICY IF EXISTS "Anyone can view expenses for public itineraries" ON expenses;
CREATE POLICY "Anyone can view expenses for public itineraries"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND itineraries.is_public = true
    )
  );

-- Users can view expenses for their own itineraries
DROP POLICY IF EXISTS "Users can view expenses for own itineraries" ON expenses;
CREATE POLICY "Users can view expenses for own itineraries"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can add expenses to their own itineraries
DROP POLICY IF EXISTS "Users can add expenses to own itineraries" ON expenses;
CREATE POLICY "Users can add expenses to own itineraries"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can update expenses they created
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can delete expenses from their itineraries
DROP POLICY IF EXISTS "Users can delete expenses from own itineraries" ON expenses;
CREATE POLICY "Users can delete expenses from own itineraries"
  ON expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = expenses.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- RLS Policies for expense_splits table
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Anyone can view splits for public itineraries
DROP POLICY IF EXISTS "Anyone can view splits for public itineraries" ON expense_splits;
CREATE POLICY "Anyone can view splits for public itineraries"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      INNER JOIN itineraries ON expenses.itinerary_id = itineraries.id
      WHERE expenses.id = expense_splits.expense_id
      AND itineraries.is_public = true
    )
  );

-- Users can view splits for their itineraries
DROP POLICY IF EXISTS "Users can view splits for own itineraries" ON expense_splits;
CREATE POLICY "Users can view splits for own itineraries"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      INNER JOIN itineraries ON expenses.itinerary_id = itineraries.id
      WHERE expenses.id = expense_splits.expense_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can add splits to their itinerary expenses
DROP POLICY IF EXISTS "Users can add splits to own itinerary expenses" ON expense_splits;
CREATE POLICY "Users can add splits to own itinerary expenses"
  ON expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      INNER JOIN itineraries ON expenses.itinerary_id = itineraries.id
      WHERE expenses.id = expense_splits.expense_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can update splits in their itineraries
DROP POLICY IF EXISTS "Users can update splits in own itineraries" ON expense_splits;
CREATE POLICY "Users can update splits in own itineraries"
  ON expense_splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      INNER JOIN itineraries ON expenses.itinerary_id = itineraries.id
      WHERE expenses.id = expense_splits.expense_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users can delete splits from their itineraries
DROP POLICY IF EXISTS "Users can delete splits from own itineraries" ON expense_splits;
CREATE POLICY "Users can delete splits from own itineraries"
  ON expense_splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      INNER JOIN itineraries ON expenses.itinerary_id = itineraries.id
      WHERE expenses.id = expense_splits.expense_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Users involved in a split can mark it as paid
DROP POLICY IF EXISTS "Users can mark their own splits as paid" ON expense_splits;
CREATE POLICY "Users can mark their own splits as paid"
  ON expense_splits FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to auto-create equal splits when expense is created
CREATE OR REPLACE FUNCTION create_equal_splits()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INTEGER;
  split_amount DECIMAL(10, 2);
  participant RECORD;
BEGIN
  -- Only create splits if split_type is 'equal' and no splits exist yet
  IF NEW.split_type = 'equal' THEN
    -- Count participants (attendees of the itinerary)
    SELECT COUNT(*) INTO participant_count
    FROM itinerary_attendees
    WHERE itinerary_id = NEW.itinerary_id;

    -- If no attendees, use just the payer
    IF participant_count = 0 THEN
      participant_count := 1;
      split_amount := NEW.amount;

      INSERT INTO expense_splits (expense_id, user_id, amount, is_paid)
      VALUES (NEW.id, NEW.paid_by_user_id, split_amount, true)
      ON CONFLICT (expense_id, user_id) DO NOTHING;
    ELSE
      -- Calculate equal split amount
      split_amount := NEW.amount / participant_count;

      -- Create splits for each attendee
      FOR participant IN
        SELECT user_id FROM itinerary_attendees WHERE itinerary_id = NEW.itinerary_id
      LOOP
        INSERT INTO expense_splits (expense_id, user_id, amount, is_paid)
        VALUES (
          NEW.id,
          participant.user_id,
          split_amount,
          participant.user_id = NEW.paid_by_user_id -- Mark as paid if they're the payer
        )
        ON CONFLICT (expense_id, user_id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create splits
DROP TRIGGER IF EXISTS create_equal_splits_trigger ON expenses;
CREATE TRIGGER create_equal_splits_trigger
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION create_equal_splits();

-- Comments
COMMENT ON TABLE expense_splits IS 'Tracks who owes what for each expense';
COMMENT ON COLUMN expenses.paid_by_user_id IS 'User who paid for this expense';
COMMENT ON COLUMN expenses.split_type IS 'How the expense should be split: equal, percentage, custom, shares';
COMMENT ON COLUMN expenses.currency IS 'Currency code (USD, EUR, etc)';
COMMENT ON COLUMN expense_splits.is_paid IS 'Whether this person has settled their share';

SELECT 'Enhanced expense tracking system created successfully! ✓' as status;
