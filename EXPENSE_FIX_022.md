# Expense Creation Fix - Migration 022

## Quick Summary

**Problem**: Expenses added during itinerary create/update don't show on published pages.

**Root Cause**: Database trigger blocked by RLS policy (auth.uid() is NULL in trigger context).

**Solution**: Add `SECURITY DEFINER` to trigger functions to bypass RLS.

**Status**: ✅ Fix ready - Migration 022 needs to be applied to database

---

## What Was Happening

### ✅ Working: Adding Expenses Directly to Published Itineraries
- User clicks "Add Expense" on published itinerary
- EnhancedExpenseTracker creates expense with auth.uid() context
- Expense shows up correctly with splits

### ❌ Broken: Adding Expenses During Create/Update
- User creates itinerary with expenses
- Itinerary INSERT triggers `add_owner_as_attendee()`
- **Trigger has NO auth.uid() context**
- RLS policy blocks attendee INSERT
- Owner not added to `itinerary_attendees`
- Expense INSERT triggers `create_equal_splits()`
- No attendees found → fallback to single split
- EnhancedExpenseTracker shows empty state

---

## The Fix

Migration 022 adds `SECURITY DEFINER` to both trigger functions:

```sql
CREATE OR REPLACE FUNCTION add_owner_as_attendee()
RETURNS TRIGGER
SECURITY DEFINER  -- ← This is the key change
SET search_path = public
AS $$ ...
```

This makes triggers run with postgres privileges, bypassing RLS while still being secure.

---

## How to Apply

### Quick Method (Supabase Dashboard)

1. Copy entire file: `supabase/migrations/022_fix_attendee_trigger_rls.sql`
2. Open Supabase → SQL Editor → New Query
3. Paste and Run
4. Look for success message

### Alternative (CLI)

```bash
# If you have Supabase CLI
supabase db push

# Or with psql
psql $DATABASE_URL -f supabase/migrations/022_fix_attendee_trigger_rls.sql
```

---

## Verification

### Test 1: Create New Itinerary with Expenses

1. Go to `/create`
2. Add title, dates, location
3. Enable "Packing & Expenses"
4. Add expenses: "Food $50", "Hotel $100"
5. Click "Publish"
6. **Check**: Expenses show in Expenses tab with correct splits

### Test 2: Database Check

```sql
-- Get recent itinerary
SELECT id, title, created_at
FROM itineraries
ORDER BY created_at DESC
LIMIT 1;

-- Check attendees (should have owner)
SELECT *
FROM itinerary_attendees
WHERE itinerary_id = '<YOUR_ITINERARY_ID>';

-- Check expense splits (should have splits for each expense)
SELECT
  e.title,
  e.amount,
  COUNT(es.id) as splits
FROM expenses e
LEFT JOIN expense_splits es ON e.id = es.expense_id
WHERE e.itinerary_id = '<YOUR_ITINERARY_ID>'
GROUP BY e.id, e.title, e.amount;
```

### Expected Results
- ✅ Each itinerary should have at least 1 attendee (owner)
- ✅ Each expense should have at least 1 split
- ✅ Expenses should show in UI with correct amounts

---

## Files Changed

### New Files
- `supabase/migrations/022_fix_attendee_trigger_rls.sql` - The migration
- `supabase/migrations/022_README.md` - Detailed documentation
- `EXPENSE_FIX_022.md` - This quick reference

### No Code Changes Required
The application code is already correct. This is a database-only fix.

---

## Why This Happened

When Supabase executes database triggers:
- They run in a system context (no authenticated user)
- `auth.uid()` returns NULL
- RLS policies that check `auth.uid()` fail
- INSERTs/UPDATEs get blocked silently

This is a common gotcha with Supabase RLS + triggers.

---

## Is SECURITY DEFINER Safe?

**Yes**, when used correctly:

✅ Functions use `SET search_path = public` (prevents injection)
✅ Functions only operate on triggering row data
✅ Functions perform intended system operations only
✅ No user-controlled data in dynamic queries

The functions are:
- `add_owner_as_attendee()` - Only adds itinerary owner as attendee
- `create_equal_splits()` - Only creates splits for existing attendees

Both are necessary system operations that should bypass RLS.

---

## Troubleshooting

### "Expenses still not showing"

1. Verify migration was applied:
   ```sql
   SELECT prosecdef
   FROM pg_proc
   WHERE proname = 'add_owner_as_attendee';
   ```
   Should return `true`.

2. Check for old itineraries without attendees:
   ```sql
   SELECT i.id, i.title
   FROM itineraries i
   LEFT JOIN itinerary_attendees ia ON i.id = ia.itinerary_id
   WHERE ia.id IS NULL;
   ```

3. Manually fix old itineraries:
   ```sql
   INSERT INTO itinerary_attendees (itinerary_id, user_id, role)
   SELECT id, user_id, 'owner'
   FROM itineraries i
   WHERE NOT EXISTS (
     SELECT 1 FROM itinerary_attendees ia
     WHERE ia.itinerary_id = i.id
   );
   ```

### "Migration failed"

Check error message. Common issues:
- Function already exists → Use `DROP FUNCTION ... CASCADE` first
- Permission denied → Run as superuser or db owner
- Syntax error → Copy exact file contents

---

## Summary

This fix resolves the root cause of expenses not appearing on published itineraries when added during creation/update. By adding `SECURITY DEFINER` to the trigger functions, they can now properly create attendees and expense splits regardless of auth context.

**Action Required**: Apply migration 022 to your Supabase database.

**Estimated Time**: < 1 minute

**Risk**: Low (idempotent, can be rolled back)

**Impact**: High (fixes critical feature bug)
