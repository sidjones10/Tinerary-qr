# Apply All Migrations to Supabase Database

## Current Situation

You have **15 migration files** in `supabase/migrations/` but they may not all be applied to your database. This causes errors because the code expects tables/columns that don't exist.

## Migration Files You Have

✅ **001_initial_schema.sql** - Base tables (profiles, itineraries, activities, etc.)
✅ **002_comments_system.sql** - Comments table with threading support
✅ **003_user_behavior_tracking.sql** - User interaction tracking
✅ **004_realtime_subscriptions.sql** - Real-time features
✅ **005_account_deletion_gdpr.sql** - GDPR compliance
✅ **006_data_export_gdpr.sql** - Data export features
✅ **007_likes_system.sql** - Like/unlike functionality
✅ **008-014** - Various fixes for profile creation and RLS
✅ **015_fix_notifications_and_metrics.sql** - Adds missing columns and RLS policies

## Step 1: Check What's Been Applied

Run this in Supabase SQL Editor:

```sql
-- Check which tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables:
- profiles
- users (if using custom auth)
- itineraries
- activities
- packing_items
- expenses
- itinerary_categories
- itinerary_metrics
- notifications
- saved_itineraries
- **comments** ← Check if this exists
- user_preferences
- user_interactions
- itinerary_invitations
- drafts
- promotions (optional)
- bookings (optional)
- tickets (optional)
- verification_codes

## Step 2: Apply Missing Migrations

### Option A: Apply All at Once (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Create a **new query**
3. Copy ALL migration files in order (001 → 015)
4. Paste and **Run**

### Option B: Apply One by One

For each migration file that needs to be applied:

1. Open the file in `supabase/migrations/`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Check for success message

**Order matters!** Apply in this sequence:
```
001 → 002 → 003 → 007 → 015
```

(Migrations 004-006, 008-014 are for specific features/fixes, apply if needed)

## Step 3: Verify Migration Success

After applying migrations, run this diagnostic query:

```sql
-- Check comments table
SELECT
  'comments' as table_name,
  COUNT(*) as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'comments') as policy_count
FROM information_schema.columns
WHERE table_name = 'comments' AND table_schema = 'public';

-- Check notifications columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check itinerary_metrics policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'itinerary_metrics';

-- Check saved_itineraries structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'saved_itineraries' AND table_schema = 'public'
ORDER BY ordinal_position;
```

Expected results:
- **comments**: Should have 9 columns and 4 RLS policies
- **notifications**: Should have `image_url` and `metadata` columns
- **itinerary_metrics**: Should have INSERT, SELECT, and UPDATE policies
- **saved_itineraries**: Should have a `type` column (for likes system)

## Step 4: Critical Columns to Verify

Run this to check for the most commonly missing pieces:

```sql
-- Check if saved_itineraries has 'type' column (needed for likes)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'saved_itineraries' AND column_name = 'type';

-- Check if notifications has metadata/image_url
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name IN ('metadata', 'image_url');

-- Check if comments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'comments'
) as comments_exists;
```

## Common Issues & Fixes

### Issue 1: `saved_itineraries` missing `type` column

**Error**: Likes system references `type` column that doesn't exist

**Fix**: Add the column manually:
```sql
ALTER TABLE saved_itineraries
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'save';

-- Add check constraint
ALTER TABLE saved_itineraries
  ADD CONSTRAINT saved_itineraries_type_check
  CHECK (type IN ('save', 'like'));
```

### Issue 2: Comments table doesn't exist

**Fix**: Apply migration `002_comments_system.sql`

### Issue 3: RLS policies block inserts

**Fix**: Apply migration `015_fix_notifications_and_metrics.sql`

## Quick Fix: Apply Just the Essentials

If you want to get everything working quickly, run these in order:

### 1️⃣ Core Schema (if not already applied)
```sql
-- Run: 001_initial_schema.sql
-- This creates all base tables
```

### 2️⃣ Comments System
```sql
-- Run: 002_comments_system.sql
-- Adds comments table with RLS
```

### 3️⃣ Likes System
```sql
-- First, ensure saved_itineraries has type column:
ALTER TABLE saved_itineraries
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'save';

-- Then run: 007_likes_system.sql
-- Adds like/unlike functions and triggers
```

### 4️⃣ Notifications & Metrics Fix
```sql
-- Run: 015_fix_notifications_and_metrics.sql
-- Fixes the publishing errors
```

## After Applying Migrations

Test these features:
- ✅ Publish an itinerary (should work without errors)
- ✅ Add a comment (test if comments table works)
- ✅ Like/unlike an itinerary (test likes system)
- ✅ Check notifications (should appear in UI)

## Need Help?

If you're still seeing errors after applying migrations, run the diagnostic query I created:

```bash
# In Supabase SQL Editor:
# Run: scripts/check-database-tables.sql
```

Then share the results and I'll help debug!
