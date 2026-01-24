# Migration 015: Fix Notifications and Metrics

## Problem
When publishing an itinerary, you get two errors:
1. `Error creating notification: {}`
2. `Metrics initialization error: {}`

## Root Cause
1. **Missing columns**: `notifications` table is missing `image_url` and `metadata` columns
2. **Missing RLS policies**: Both `notifications` and `itinerary_metrics` tables have RLS enabled but no INSERT policies

## Solution
Apply the migration `015_fix_notifications_and_metrics.sql`

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `015_fix_notifications_and_metrics.sql`
5. Click **Run**

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: Manual SQL execution
If you prefer to run commands one by one:

```sql
-- 1. Add missing columns to notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 2. Add INSERT policy for notifications
CREATE POLICY IF NOT EXISTS "Users can insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add INSERT policy for itinerary_metrics
CREATE POLICY IF NOT EXISTS "Users can insert itinerary metrics" ON itinerary_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- 4. Add SELECT policy for itinerary_metrics
CREATE POLICY IF NOT EXISTS "Users can view all itinerary metrics" ON itinerary_metrics
  FOR SELECT
  USING (true);

-- 5. Add UPDATE policy for itinerary_metrics
CREATE POLICY IF NOT EXISTS "Users can update own itinerary metrics" ON itinerary_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );
```

## Verification
After applying the migration, try publishing an itinerary again. The errors should be gone!

## What This Fixes
- ✅ Notifications can now include images and metadata
- ✅ Users can create their own notifications
- ✅ Itinerary metrics are properly tracked with RLS
- ✅ No more empty error objects when publishing

## Additional Improvements
The code has also been updated to handle these errors gracefully, so even if the migration isn't applied immediately, itinerary creation will still work (just without notifications and metrics).
