-- ============================================================================
-- Migration 038: Fix Notifications User Foreign Key
-- ============================================================================
-- ISSUE: Like fails with "Key (user_id) is not present in table users"
-- The notifications.user_id foreign key is referencing the wrong table.
-- It should reference profiles(id), not users.
-- ============================================================================

-- Step 1: Drop the incorrect foreign key constraint
-- The constraint name might vary, so we'll try common names
DO $$
BEGIN
  -- Try to drop the constraint with various possible names
  BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'notifications_user_id_fkey does not exist';
  END;

  BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey1;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'notifications_user_id_fkey1 does not exist';
  END;

  BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'fk_notifications_user does not exist';
  END;
END $$;

-- Step 2: Drop any constraint referencing 'users' table
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'notifications'
      AND con.contype = 'f'
      AND con.conname LIKE '%user%'
  LOOP
    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- Step 3: Add the correct foreign key referencing profiles
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 038: Notifications FK Fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed: notifications.user_id now references profiles(id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Likes should now work correctly!';
  RAISE NOTICE '';
END $$;
