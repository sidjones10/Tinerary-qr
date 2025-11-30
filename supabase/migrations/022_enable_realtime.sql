-- Enable Realtime for tables that need real-time updates
-- This allows clients to subscribe to changes via Supabase Realtime

-- Helper function to safely add tables to realtime publication
DO $$
DECLARE
  tbl_name TEXT;
  tables_to_add TEXT[] := ARRAY['notifications', 'comments', 'saved_itineraries', 'user_follows'];
BEGIN
  FOREACH tbl_name IN ARRAY tables_to_add
  LOOP
    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND information_schema.tables.table_name = tbl_name
    ) THEN
      -- Check if table is already in the publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = tbl_name
      ) THEN
        -- Add table to realtime publication
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl_name);
        RAISE NOTICE '✓ Realtime enabled for %', tbl_name;
      ELSE
        RAISE NOTICE '⊙ Realtime already enabled for %', tbl_name;
      END IF;
    ELSE
      RAISE NOTICE '⊘ Skipping % (table does not exist)', tbl_name;
    END IF;
  END LOOP;
END $$;

-- Verify which tables have Realtime enabled
DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Realtime Enabled Tables';
  RAISE NOTICE '========================================';

  FOR table_record IN
    SELECT tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    ORDER BY tablename
  LOOP
    RAISE NOTICE '  ✓ %', table_record.tablename;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Realtime is now active for these tables!';
  RAISE NOTICE '';
END $$;
