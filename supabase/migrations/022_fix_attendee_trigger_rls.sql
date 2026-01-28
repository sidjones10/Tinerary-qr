-- Migration 022: Fix RLS blocking attendee trigger
--
-- Problem: The add_owner_as_attendee() trigger function was being blocked by RLS policies
-- because database triggers don't have auth.uid() context. This caused expenses created
-- during itinerary creation to have no splits, making them invisible in the UI.
--
-- Solution: Add SECURITY DEFINER to the trigger function and add a bypass policy for
-- system operations.

-- First, add a policy that allows the trigger to insert attendees without RLS checks
-- This policy allows INSERT when the user_id matches the itinerary owner
DROP POLICY IF EXISTS "System can add attendees during itinerary creation" ON itinerary_attendees;
CREATE POLICY "System can add attendees during itinerary creation"
  ON itinerary_attendees FOR INSERT
  WITH CHECK (
    -- Allow if user_id matches the itinerary owner (for trigger usage)
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = itinerary_attendees.user_id
    )
  );

-- Recreate the function with SECURITY DEFINER to bypass RLS
-- SECURITY DEFINER makes the function run with the privileges of the function owner (postgres)
DROP FUNCTION IF EXISTS add_owner_as_attendee() CASCADE;
CREATE OR REPLACE FUNCTION add_owner_as_attendee()
RETURNS TRIGGER
SECURITY DEFINER  -- This is the key change!
SET search_path = public
AS $$
BEGIN
  -- Add the itinerary owner as an attendee with 'owner' role
  INSERT INTO itinerary_attendees (itinerary_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner')
  ON CONFLICT (itinerary_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (it was dropped with CASCADE)
DROP TRIGGER IF EXISTS add_owner_as_attendee_trigger ON itineraries;
CREATE TRIGGER add_owner_as_attendee_trigger
AFTER INSERT ON itineraries
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_attendee();

-- Do the same for the create_equal_splits function to ensure it can query attendees properly
DROP FUNCTION IF EXISTS create_equal_splits() CASCADE;
CREATE OR REPLACE FUNCTION create_equal_splits()
RETURNS TRIGGER
SECURITY DEFINER  -- This ensures the function can query attendees even without auth context
SET search_path = public
AS $$
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

-- Recreate the trigger (it was dropped with CASCADE)
DROP TRIGGER IF EXISTS create_equal_splits_trigger ON expenses;
CREATE TRIGGER create_equal_splits_trigger
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION create_equal_splits();

-- Verify the changes
DO $$
DECLARE
  add_owner_security TEXT;
  create_splits_security TEXT;
BEGIN
  -- Check if functions have SECURITY DEFINER
  SELECT prosecdef INTO add_owner_security
  FROM pg_proc
  WHERE proname = 'add_owner_as_attendee';

  SELECT prosecdef INTO create_splits_security
  FROM pg_proc
  WHERE proname = 'create_equal_splits';

  IF add_owner_security AND create_splits_security THEN
    RAISE NOTICE 'SUCCESS: Both functions now have SECURITY DEFINER';
  ELSE
    RAISE WARNING 'FAILED: Functions may not have SECURITY DEFINER set correctly';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION add_owner_as_attendee() IS
  'Automatically adds itinerary owner as attendee. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION create_equal_splits() IS
  'Automatically creates equal expense splits for all attendees. Uses SECURITY DEFINER to bypass RLS.';

SELECT '✅ Migration 022 complete: Trigger RLS issue fixed!' as status;
