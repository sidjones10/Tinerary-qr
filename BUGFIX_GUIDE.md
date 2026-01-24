# Critical Bug Fixes - Photos & Packing List

## 🐛 Issues Fixed

1. **Photo Upload Error**: "new row violates row-level security policy"
2. **Packing List Error**: "optimistic state update occurred outside a transition"

---

## ✅ Fix #1: Photo Upload RLS Policy

### Problem
Photos can't be uploaded because the Supabase storage bucket doesn't have the correct RLS policies.

### Solution
Apply the new migration `019_add_storage_policies.sql` to create the storage bucket and set up proper policies.

### Steps to Fix

**Option A: Run Migration in Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/019_add_storage_policies.sql`
4. Paste into the SQL Editor
5. Click **Run**
6. You should see: "Storage bucket and policies created successfully! ✓"

**Option B: Manual Setup**

If the migration fails, create the bucket manually:

1. **Supabase Dashboard** → **Storage** → **New Bucket**
2. Settings:
   - **Name**: `event-photos`
   - **Public**: ✅ Yes
   - **File size limit**: 10485760 (10MB)
   - **Allowed MIME types**: Add these:
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
3. Click **Create Bucket**

Then add policies manually in **Storage** → **event-photos** → **Policies**:

```sql
-- Policy 1: Public Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Policy 2: Upload Photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND (string_to_array(name, '/'))[1]::uuid IN (
    SELECT id FROM itineraries WHERE user_id = auth.uid()
  )
);

-- Policy 3: Update Photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM event_photos
    WHERE storage_path = name
    AND user_id = auth.uid()
  )
);

-- Policy 4: Delete Photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM event_photos
    WHERE storage_path = name
    AND user_id = auth.uid()
  )
);
```

### Verify the Fix

1. Go to an event you own
2. Click the **Photos** tab
3. Click **Upload Photos**
4. Select an image
5. Should upload successfully without RLS errors! ✅

---

## ✅ Fix #2: Packing List React 19 Error

### Problem
Adding items to the packing list throws a React 19 error about optimistic updates needing to be inside a transition.

### Solution
The fix has been applied to `components/packing-list.tsx`. The optimistic state update is now wrapped in `startTransition`.

### What Changed

**Before:**
```typescript
// Optimistic update OUTSIDE transition ❌
addOptimisticItem({ type: "add", item: optimisticItem })

startTransition(async () => {
  const result = await createPackingItem(tripId, formData)
  // ...
})
```

**After:**
```typescript
// Optimistic update INSIDE transition ✅
startTransition(async () => {
  addOptimisticItem({ type: "add", item: optimisticItem })

  const result = await createPackingItem(tripId, formData)
  // ...
})
```

### Verify the Fix

1. Pull the latest code: `git pull origin claude/fix-settings-page-WAQEl`
2. Go to an event
3. Click **Packing List** tab
4. Click **Add Item**
5. Enter an item name and click **Add**
6. Should add successfully without errors! ✅

---

## 🚀 Quick Fix Commands

```bash
# 1. Pull latest code
git pull origin claude/fix-settings-page-WAQEl

# 2. Restart dev server
npm run dev

# 3. Go to Supabase Dashboard and run migration 019
# (Copy/paste contents of supabase/migrations/019_add_storage_policies.sql)

# 4. Test photo upload
# 5. Test packing list
```

---

## 📋 Checklist

After applying fixes:

- [ ] Applied migration 019 in Supabase SQL Editor
- [ ] Verified storage bucket `event-photos` exists
- [ ] Verified 4 storage policies exist
- [ ] Pulled latest code for packing list fix
- [ ] Tested photo upload - works! ✅
- [ ] Tested packing list - works! ✅

---

## 🐛 If Issues Persist

### Photo Upload Still Failing

**Error: "Bucket not found"**
- ✅ Run migration 019 to create bucket
- ✅ Or create bucket manually in Supabase Dashboard

**Error: "Policy violation"**
- ✅ Check you're logged in
- ✅ Check you own the itinerary/event
- ✅ Verify all 4 storage policies exist in Supabase Dashboard → Storage → event-photos → Policies

**Error: "File size too large"**
- ✅ Images must be under 10MB
- ✅ Compress large images before uploading

### Packing List Still Failing

**Error: Still shows React 19 warning**
- ✅ Make sure you pulled latest code
- ✅ Restart dev server (`npm run dev`)
- ✅ Hard refresh browser (Cmd/Ctrl + Shift + R)
- ✅ Clear browser cache

**Error: Items not saving**
- ✅ Check browser console for errors
- ✅ Verify database connection
- ✅ Check `packing_items` table exists in Supabase

---

## 🎯 Summary

Both issues are now fixed:

1. **Photo uploads** - Migration 019 creates storage bucket + RLS policies
2. **Packing list** - React 19 optimistic update wrapped in `startTransition`

**Time to fix**: ~5 minutes
- 2 min: Run migration 019
- 3 min: Pull code and test

Your app should now be fully functional! 🎉
