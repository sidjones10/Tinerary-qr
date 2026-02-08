-- ============================================================================
-- Fix: Add Missing Privacy Control Columns to Itineraries Table
-- ============================================================================
-- This migration adds the missing packing_list_public and expenses_public
-- columns that are required by the create/edit functionality
-- ============================================================================

-- Add privacy toggle columns to itineraries table
DO $$
BEGIN
  -- Add packing_list_public column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'itineraries'
      AND column_name = 'packing_list_public'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN packing_list_public BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added packing_list_public column to itineraries table';
  ELSE
    RAISE NOTICE 'packing_list_public column already exists';
  END IF;

  -- Add expenses_public column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'itineraries'
      AND column_name = 'expenses_public'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN expenses_public BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added expenses_public column to itineraries table';
  ELSE
    RAISE NOTICE 'expenses_public column already exists';
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_packing_public ON itineraries(packing_list_public);
CREATE INDEX IF NOT EXISTS idx_itineraries_expenses_public ON itineraries(expenses_public);

-- Verify the columns were added
DO $$
DECLARE
  packing_exists BOOLEAN;
  expenses_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'itineraries'
      AND column_name = 'packing_list_public'
  ) INTO packing_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'itineraries'
      AND column_name = 'expenses_public'
  ) INTO expenses_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Privacy Columns Status:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'packing_list_public: %', CASE WHEN packing_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'expenses_public: %', CASE WHEN expenses_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '';

  IF packing_exists AND expenses_exists THEN
    RAISE NOTICE '✓ All required columns are present!';
  ELSE
    RAISE WARNING 'Some columns are still missing - please check the error messages above';
  END IF;
  RAISE NOTICE '';
END $$;
