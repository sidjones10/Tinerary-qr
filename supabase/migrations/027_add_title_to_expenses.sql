-- ============================================================================
-- Migration: Add title column to expenses table
-- ============================================================================
-- The enhanced expense tracker expects a 'title' column that didn't exist

-- Add title column to expenses table
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Set default title for existing rows
UPDATE expenses
SET title = COALESCE(category, 'Expense')
WHERE title IS NULL;

-- Add quantity column to packing_items for the full feature set
ALTER TABLE packing_items
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Expense and Packing Schema Updated!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  ✓ title column to expenses table';
  RAISE NOTICE '  ✓ quantity, category, url columns to packing_items';
  RAISE NOTICE '';
END $$;
