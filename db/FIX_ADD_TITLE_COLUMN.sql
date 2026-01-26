-- FIX: Add missing 'title' column to expenses table
-- This column is required by the expense creation code but was missing from the schema
-- Run this in Supabase SQL Editor

-- Add the title column
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing expenses to have a title based on category or description
UPDATE public.expenses
SET title = COALESCE(
  title,
  category,
  description,
  'Expense'
)
WHERE title IS NULL;

-- Verify the change
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND column_name = 'title';

-- Show a sample of expenses with the new title column
SELECT
  id,
  title,
  category,
  amount,
  description,
  created_at
FROM public.expenses
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Title column added successfully!' as status;
