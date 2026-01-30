# Fix: Likes Not Saving on Other People's Itineraries

## Issue Description

**Problem:** Users can like their own itineraries successfully, but when they try to like other people's itineraries, the likes don't save.

**Symptoms:**
- ✅ Liking own itineraries works fine
- ❌ Liking other users' itineraries fails silently or shows an error
- ❌ Likes on other people's itineraries don't appear in the Likes tab
- ❌ Like counts don't update for other people's itineraries

## Root Cause Analysis

The issue stems from how PostgreSQL's Row Level Security (RLS) interacts with foreign key constraints in `SECURITY DEFINER` functions.

### Technical Details

1. **The Setup:**
   - The `toggle_like` function is marked as `SECURITY DEFINER`
   - The `saved_itineraries` table has a foreign key: `itinerary_id REFERENCES itineraries(id)`
   - The `itineraries` table has RLS policies enabled

2. **The Problem:**
   - When a user tries to like another person's itinerary:
     - Frontend calls `toggle_like(user_id, itinerary_id)`
     - Function tries to `INSERT INTO saved_itineraries`
     - PostgreSQL validates the FK constraint by checking if the itinerary exists
     - **This FK validation check is subject to RLS policies**
     - Even though the function is `SECURITY DEFINER`, FK checks use the calling context
     - If the user can't "see" the itinerary through RLS, the INSERT fails

3. **Why it works for own itineraries:**
   - The RLS policy on `itineraries` allows SELECT when:
     ```sql
     is_public = true OR user_id = auth.uid()
     ```
   - For own itineraries, `user_id = auth.uid()` is true, so FK check passes
   - For others' itineraries, it should pass if `is_public = true`, but the FK check context doesn't properly resolve this

## The Solution

The fix modifies the `toggle_like` function to explicitly validate itinerary existence **before** attempting the INSERT operation. Since the function is `SECURITY DEFINER`, this explicit check bypasses RLS and can see all itineraries.

### Changes Made

**File:** `supabase/migrations/025_fix_toggle_like_rls.sql`

```sql
CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Explicitly check if itinerary exists (bypasses RLS)
  SELECT EXISTS (
    SELECT 1 FROM itineraries WHERE id = itinerary_uuid
  ) INTO itinerary_exists;

  IF NOT itinerary_exists THEN
    RAISE EXCEPTION 'Itinerary does not exist: %', itinerary_uuid;
  END IF;

  -- Rest of the function...
  -- (like/unlike logic)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Key improvement:** The function now validates itinerary existence using an explicit `EXISTS` check before attempting the INSERT. This check runs with the function owner's privileges and bypasses RLS, so it can see all itineraries regardless of the calling user's RLS context.

## How to Apply the Fix

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to: **Project** → **SQL Editor**
3. Create a new query
4. Copy and paste the contents of: `scripts/fix-likes-on-others-itineraries.sql`
5. Click **Run** to execute

### Option 2: Using psql Command Line

```bash
psql $DATABASE_URL -f scripts/fix-likes-on-others-itineraries.sql
```

### Option 3: Using Supabase CLI

```bash
cd supabase
supabase db push
# This will apply migration 025_fix_toggle_like_rls.sql
```

## Verification Steps

After applying the fix, verify it works:

### 1. Test in the UI

1. Navigate to the Discover feed
2. Find an itinerary created by another user
3. Click the heart/like button
4. **Expected:** Heart fills, like count increases
5. Navigate to your **Likes** tab
6. **Expected:** The liked itinerary appears there
7. Click unlike
8. **Expected:** Heart empties, like count decreases

### 2. Test with Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Like someone else's itinerary
4. **Expected:** No errors in console
5. Check Network tab for the `toggle_like` RPC call
6. **Expected:** Status 200, response includes `is_liked: true`

### 3. Run Diagnostic Page

1. Navigate to `/diagnostics` in your app
2. Click "Run Diagnostics"
3. Check that all tests pass:
   - ✅ toggle_like function exists
   - ✅ saved_itineraries table accessible
   - ✅ RLS policies configured

## What This Fix Does

✅ **Allows users to like any public itinerary** (own or others')
✅ **Properly validates itinerary existence** before attempting INSERT
✅ **Bypasses RLS issues** with FK constraint validation
✅ **Maintains security** - users can only create likes under their own user_id
✅ **Preserves all existing functionality** - no breaking changes

## What This Fix Doesn't Change

- ✅ RLS policies remain secure and unchanged
- ✅ Users still can't like non-existent itineraries
- ✅ Users still can't create likes for other users
- ✅ All other like system functionality (unlike, like counts, triggers) unchanged

## Troubleshooting

### Issue: Still can't like other people's itineraries

**Check:**
1. Verify the migration was applied successfully:
   ```sql
   SELECT proname, prosecdef
   FROM pg_proc
   WHERE proname = 'toggle_like';
   -- Should return: toggle_like | t (true)
   ```

2. Check if the itinerary you're trying to like is public:
   ```sql
   SELECT id, title, is_public
   FROM itineraries
   WHERE id = '<itinerary_id>';
   -- is_public should be true
   ```

3. Clear browser cache and reload the page

### Issue: Error "Itinerary does not exist"

This means the itinerary ID being passed doesn't exist in the database. Check:
- The itinerary wasn't deleted
- The correct ID is being passed from the frontend
- Check browser console for the exact `itinerary_uuid` being sent

### Issue: Permission denied errors

This indicates RLS policies on `saved_itineraries` might be too restrictive. Verify:
```sql
SELECT * FROM pg_policies WHERE tablename = 'saved_itineraries';
```

Expected policies:
- Users can view own saved itineraries
- Users can insert own saved itineraries
- Users can delete own saved itineraries

## Related Files

### Frontend Components
- `components/event-detail.tsx` - Detail view like button (lines 251-294)
- `app/discover/page.tsx` - Discover page like functionality (lines 115-171)
- `components/discovery-feed.tsx` - Feed like button (lines 131-173)
- `app/liked/page.tsx` - Likes tab display (lines 143-169)

### Database
- `supabase/migrations/007_likes_system.sql` - Original toggle_like function
- `supabase/migrations/025_fix_toggle_like_rls.sql` - **THIS FIX**
- `supabase/migrations/006.5_add_type_column_to_saved_itineraries.sql` - Type column
- `supabase/migrations/006.6_add_saved_itineraries_policies.sql` - RLS policies

### Scripts
- `scripts/fix-likes-on-others-itineraries.sql` - Standalone fix script (use this!)
- `scripts/fix-likes-system.sql` - Original likes system fixes

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Foreign Key Constraints and RLS](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

## Questions?

If you continue experiencing issues after applying this fix:

1. Check the diagnostic page: `/diagnostics`
2. Review the browser console for errors
3. Verify the migration was applied: Check `pg_proc` table
4. Ensure prerequisites are met (type column, RLS policies)

---

**Fix Version:** 1.0
**Created:** 2026-01-30
**Migration File:** `025_fix_toggle_like_rls.sql`
**Script File:** `scripts/fix-likes-on-others-itineraries.sql`
