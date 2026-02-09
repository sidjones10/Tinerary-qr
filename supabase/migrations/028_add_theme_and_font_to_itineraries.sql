-- ============================================================================
-- Migration: Add theme and font columns to itineraries
-- ============================================================================
-- Allows users to customize the appearance of their itineraries

-- Add theme column (icon identifier)
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';

-- Add font column for custom fonts
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'default';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_theme ON itineraries(theme);
CREATE INDEX IF NOT EXISTS idx_itineraries_font ON itineraries(font);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Theme and Font Customization Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Available themes:';
  RAISE NOTICE '  - default (no icon)';
  RAISE NOTICE '  - heart (romantic/anniversary)';
  RAISE NOTICE '  - plane (travel/flight)';
  RAISE NOTICE '  - pasta (food/culinary)';
  RAISE NOTICE '  - beach (vacation/relaxation)';
  RAISE NOTICE '  - mountain (adventure/hiking)';
  RAISE NOTICE '  - party (celebration/event)';
  RAISE NOTICE '';
  RAISE NOTICE 'Available fonts:';
  RAISE NOTICE '  - default (system font)';
  RAISE NOTICE '  - times (Times New Roman)';
  RAISE NOTICE '  - calibri (Calibri)';
  RAISE NOTICE '  - arial (Arial)';
  RAISE NOTICE '  - playfair (Playfair Display - fun)';
  RAISE NOTICE '  - pacifico (Pacifico - fun)';
  RAISE NOTICE '  - dancing (Dancing Script - fun)';
  RAISE NOTICE '';
END $$;
