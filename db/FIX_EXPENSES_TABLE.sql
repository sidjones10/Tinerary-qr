-- FIX EXPENSES TABLE TO SUPPORT BOTH SIMPLE AND COMPLEX EXPENSES
-- Run this in Supabase SQL Editor

-- Add missing columns to expenses table (if they don't exist)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'equal',
  ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Update existing expenses to have default values
UPDATE public.expenses
SET
  title = COALESCE(title, category, description, 'Expense'),
  description = COALESCE(description, 'Expense for ' || category),
  paid_by_user_id = COALESCE(paid_by_user_id, user_id),
  split_type = COALESCE(split_type, 'equal'),
  date = COALESCE(date, created_at::date),
  currency = COALESCE(currency, 'USD')
WHERE title IS NULL
   OR description IS NULL
   OR paid_by_user_id IS NULL
   OR split_type IS NULL
   OR date IS NULL
   OR currency IS NULL;

-- Create expense_splits table if it doesn't exist (for advanced expense splitting)
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);

-- Enable RLS on expense_splits
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_splits
DROP POLICY IF EXISTS "Users can view expense splits for their itineraries" ON public.expense_splits;
DROP POLICY IF EXISTS "Users can insert expense splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Users can update their own expense splits" ON public.expense_splits;

CREATE POLICY "Users can view expense splits for their itineraries"
  ON public.expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.itineraries i ON e.itinerary_id = i.id
      WHERE e.id = expense_id
        AND (i.user_id = auth.uid() OR i.is_public = true)
    )
  );

CREATE POLICY "Users can insert expense splits"
  ON public.expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.itineraries i ON e.itinerary_id = i.id
      WHERE e.id = expense_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own expense splits"
  ON public.expense_splits FOR UPDATE
  USING (user_id = auth.uid());

-- Make sure profiles RLS allows reading for expense display
-- This is needed so expense tracker can show who paid for each expense
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Verify the changes
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND column_name IN ('title', 'description', 'paid_by_user_id', 'split_type', 'date', 'currency')
ORDER BY column_name;

-- Test query to verify expense tracker will work
SELECT
  e.id,
  e.description,
  e.amount,
  e.category,
  e.paid_by_user_id,
  e.date,
  p.name as paid_by_name
FROM public.expenses e
LEFT JOIN public.profiles p ON e.paid_by_user_id = p.id
LIMIT 5;
