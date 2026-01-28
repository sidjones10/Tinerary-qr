# Migration 021: Create Itinerary Attendees Table

## Problem
Expenses are not showing on posted itineraries because:
1. **Missing `itinerary_attendees` table** - The expense split system references this table but it doesn't exist
2. **No participants tracked** - When itineraries are created, nobody is added as a participant/attendee
3. **Expenses have no splits** - Without attendees, expense splits aren't created properly
4. **Wrong participants data** - Only the owner is passed to the expense tracker, not actual attendees

## Root Cause
The expense splitting system was designed to work with an `itinerary_attendees` table to track who is part of an itinerary, but this table was never created. This causes:
- The `create_equal_splits()` trigger to fail or only create splits for the payer
- The expense tracker to not display expenses properly
- No way to track multiple participants for expense splitting

## Solution
Apply the migration `021_create_itinerary_attendees.sql`

This migration:
1. ✅ Creates the `itinerary_attendees` table with proper schema and RLS policies
2. ✅ Adds a trigger to automatically add the owner as an attendee when itineraries are created
3. ✅ Migrates all existing itineraries to have their owners as attendees
4. ✅ Enables proper expense splitting for all participants

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `021_create_itinerary_attendees.sql`
5. Click **Run**

### Option 2: Run Migration Script
```bash
node scripts/run-migration-021.js
```

### Option 3: Supabase CLI (if available)
```bash
supabase db push
```

## What This Fixes
- ✅ Creates the missing `itinerary_attendees` table
- ✅ Automatically adds itinerary owners as attendees
- ✅ Migrates all existing itineraries
- ✅ Enables proper expense split creation
- ✅ Fixes expense display on posted itineraries
- ✅ Allows multiple participants for expense splitting

## Verification
After applying the migration:

1. **Check the table exists:**
```sql
SELECT COUNT(*) FROM itinerary_attendees;
```
You should see at least as many rows as you have itineraries.

2. **Check attendees are populated:**
```sql
SELECT
  i.title,
  ia.role,
  p.name
FROM itineraries i
JOIN itinerary_attendees ia ON i.id = ia.itinerary_id
JOIN profiles p ON ia.user_id = p.id
LIMIT 10;
```

3. **Test expense creation:**
   - Go to a posted itinerary
   - Click the "Expenses" tab
   - Add a new expense
   - Verify that expense splits are created automatically

4. **Check existing expenses have splits:**
```sql
SELECT
  e.title,
  e.amount,
  COUNT(es.id) as split_count
FROM expenses e
LEFT JOIN expense_splits es ON e.id = es.expense_id
GROUP BY e.id, e.title, e.amount;
```

## Code Changes Required
The following code changes are also part of this fix:

1. **`/app/event/[id]/page.tsx`** - Now fetches attendees from database
2. **`/components/event-detail.tsx`** - Now passes real attendees to EnhancedExpenseTracker

These changes are already implemented in the codebase.

## Important Notes
- This migration is **safe to run multiple times** due to `IF NOT EXISTS` and `ON CONFLICT` clauses
- All existing itineraries will have their owners automatically added as attendees
- The trigger ensures all new itineraries will have their owners as attendees
- RLS policies ensure only itinerary owners can manage attendees
