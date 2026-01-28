# Migration 022: Fix RLS Blocking Attendee Trigger

## Problem

Expenses added during itinerary creation/update weren't showing up on published itineraries, even though:
- Adding expenses directly to published itineraries worked perfectly
- The database triggers and RLS policies were in place
- The code was correctly structured

## Root Cause

The `add_owner_as_attendee()` trigger function was being **blocked by RLS policies** because:

1. Database triggers don't have `auth.uid()` context
2. The RLS policy on `itinerary_attendees` required `auth.uid()` to match the itinerary owner
3. When the trigger tried to INSERT, `auth.uid()` was NULL, causing the INSERT to fail silently
4. Without attendees, the `create_equal_splits()` trigger had no one to create splits for
5. Without splits, the EnhancedExpenseTracker couldn't display the expenses

### Why Direct Addition Worked

When adding expenses directly via EnhancedExpenseTracker:
- The user was already authenticated (`auth.uid()` was set)
- The owner was already in `itinerary_attendees` (from previous operations or manual addition)
- The EnhancedExpenseTracker component manually creates splits after expense creation
- Therefore, expenses showed up correctly

### Why Create/Update Didn't Work

When creating/updating itineraries:
1. Itinerary INSERT → `add_owner_as_attendee_trigger` fires
2. Trigger tries to INSERT owner into `itinerary_attendees`
3. RLS policy blocks it (auth.uid() is NULL in trigger context)
4. Owner is NOT added as attendee
5. Expense INSERT → `create_equal_splits_trigger` fires
6. Trigger queries `itinerary_attendees` → finds NO participants
7. Falls back to creating a single split for the payer
8. EnhancedExpenseTracker expects multiple splits → shows nothing

## Solution

The migration makes two critical changes:

### 1. Add SECURITY DEFINER to Trigger Functions

```sql
CREATE OR REPLACE FUNCTION add_owner_as_attendee()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with postgres privileges, bypass RLS
SET search_path = public
AS $$ ...
```

`SECURITY DEFINER` makes the function run with the privileges of the function owner (postgres), bypassing RLS checks.

### 2. Add System Policy for Trigger Operations

```sql
CREATE POLICY "System can add attendees during itinerary creation"
  ON itinerary_attendees FOR INSERT
  WITH CHECK (
    -- Allow if user_id matches the itinerary owner
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_attendees.itinerary_id
      AND itineraries.user_id = itinerary_attendees.user_id
    )
  );
```

This policy allows the system to add attendees as long as the attendee's user_id matches the itinerary's owner.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `022_fix_attendee_trigger_rls.sql`
5. Paste into the query editor
6. Click **Run**
7. Verify you see the success message

### Option 2: Supabase CLI

```bash
supabase db push
```

Or manually run:

```bash
psql $DATABASE_URL -f supabase/migrations/022_fix_attendee_trigger_rls.sql
```

## Verification

After applying the migration:

### 1. Check Function Security

```sql
SELECT
  proname,
  prosecdef as has_security_definer
FROM pg_proc
WHERE proname IN ('add_owner_as_attendee', 'create_equal_splits');
```

Both functions should show `has_security_definer = true`.

### 2. Test Creating a New Itinerary with Expenses

1. Go to `/create`
2. Fill out itinerary details
3. Add expenses (e.g., "Food: $100", "Hotel: $200")
4. Click "Publish"
5. Navigate to the published itinerary
6. Click the "Expenses" tab
7. **Verify**: All expenses show up with proper splits

### 3. Check Database Directly

```sql
-- Get a recent itinerary
SELECT id, title FROM itineraries ORDER BY created_at DESC LIMIT 1;

-- Check it has attendees (use the ID from above)
SELECT * FROM itinerary_attendees WHERE itinerary_id = '<ITINERARY_ID>';

-- Check expenses have splits
SELECT
  e.title,
  e.amount,
  COUNT(es.id) as split_count
FROM expenses e
LEFT JOIN expense_splits es ON e.id = es.expense_id
WHERE e.itinerary_id = '<ITINERARY_ID>'
GROUP BY e.id, e.title, e.amount;
```

Each expense should have `split_count > 0`.

## Testing Checklist

After migration, test these scenarios:

- [ ] Create a new itinerary with expenses → expenses show on published page
- [ ] Update an existing itinerary's expenses → expenses show correctly
- [ ] Add expense directly to published itinerary → still works
- [ ] Verify attendees are created when itinerary is created
- [ ] Verify expense splits are created automatically
- [ ] Check that settlements calculate correctly

## Rollback

If you need to rollback (not recommended):

```sql
-- Remove SECURITY DEFINER
DROP FUNCTION add_owner_as_attendee() CASCADE;
DROP FUNCTION create_equal_splits() CASCADE;

-- Recreate without SECURITY DEFINER (will restore the bug)
-- Then recreate the triggers
```

## Technical Notes

### Security Implications

Using `SECURITY DEFINER` is safe here because:
1. The functions only perform specific, controlled operations
2. They use `SET search_path = public` to prevent schema injection
3. They only operate on data related to the triggering row
4. The operations (adding owner as attendee, creating equal splits) are intentional system behaviors

### Performance

No performance impact:
- Functions still fire on the same triggers
- No additional queries or operations
- RLS bypass makes operations slightly faster

## Related Issues

- [X] Expenses not showing on published itineraries (#issue-123)
- [X] Expense splits not being created during itinerary creation
- [X] EnhancedExpenseTracker showing empty state despite expenses existing

## References

- PostgreSQL SECURITY DEFINER: https://www.postgresql.org/docs/current/sql-createfunction.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Migration 020: Enhanced Expense Tracking System
- Migration 021: Create Itinerary Attendees Table
