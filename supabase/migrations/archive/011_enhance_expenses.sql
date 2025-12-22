-- Enhance expenses table for detailed tracking
-- Add columns for who paid and split information

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'custom', 'shares')),
ADD COLUMN IF NOT EXISTS split_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false;

-- Create expense_splits table for tracking individual splits
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  percentage DECIMAL(5, 2),
  shares INTEGER,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_settlements table for tracking who owes whom
CREATE TABLE IF NOT EXISTS expense_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id, from_user_id, to_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_itinerary ON expense_settlements(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_from_user ON expense_settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_expense_settlements_to_user ON expense_settlements(to_user_id);

-- Enable RLS
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_splits
CREATE POLICY "Users can view splits for their itineraries" ON expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN itineraries i ON e.itinerary_id = i.id
      WHERE e.id = expense_splits.expense_id
      AND (i.is_public = true OR i.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM itinerary_invitations inv
        WHERE inv.itinerary_id = i.id
        AND inv.invitee_id = auth.uid()
        AND inv.status = 'accepted'
      ))
    )
  );

CREATE POLICY "Itinerary owners can manage splits" ON expense_splits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN itineraries i ON e.itinerary_id = i.id
      WHERE e.id = expense_splits.expense_id
      AND i.user_id = auth.uid()
    )
  );

-- RLS Policies for expense_settlements
CREATE POLICY "Users can view settlements for their itineraries" ON expense_settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = expense_settlements.itinerary_id
      AND (i.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM itinerary_invitations inv
        WHERE inv.itinerary_id = i.id
        AND inv.invitee_id = auth.uid()
        AND inv.status = 'accepted'
      ))
    )
  );

CREATE POLICY "Itinerary owners can manage settlements" ON expense_settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = expense_settlements.itinerary_id
      AND i.user_id = auth.uid()
    )
  );

-- Update existing expenses policies to include new columns
DROP POLICY IF EXISTS "Users can view expenses for public itineraries" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses for their itineraries" ON expenses;

CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = expenses.itinerary_id
      AND (i.is_public = true OR i.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM itinerary_invitations inv
        WHERE inv.itinerary_id = i.id
        AND inv.invitee_id = auth.uid()
        AND inv.status = 'accepted'
      ))
    )
  );

CREATE POLICY "Itinerary owners can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries i
      WHERE i.id = expenses.itinerary_id
      AND i.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON COLUMN expenses.paid_by_user_id IS 'User who paid for this expense';
COMMENT ON COLUMN expenses.split_type IS 'How to split: equal, percentage, custom, or shares';
COMMENT ON COLUMN expenses.split_data IS 'JSON array of split details for custom splits';
COMMENT ON COLUMN expenses.is_settled IS 'Whether all splits for this expense have been paid';
COMMENT ON TABLE expense_splits IS 'Individual user splits for expenses';
COMMENT ON TABLE expense_settlements IS 'Summary of who owes whom for the entire trip';
