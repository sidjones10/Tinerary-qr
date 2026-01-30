# Likes System Fix

## Issues Found

### 1. Missing `type` Column
The `saved_itineraries` table was missing the `type` column that distinguishes between:
- `type = 'like'`: User has liked/favorited the itinerary
- `type = 'save'`: User has saved/bookmarked the itinerary

This column is required by the `toggle_like` RPC function created in migration `007_likes_system.sql`.

### 2. Missing RLS Policies
The `saved_itineraries` table had RLS enabled but NO policies, which prevented users from:
- Viewing their own likes and saves
- Creating new likes or saves (except through the SECURITY DEFINER toggle_like function)
- Deleting their likes or saves

### 3. Unique Constraint Issue
The original unique constraint only allowed one row per `(user_id, itinerary_id)` pair, which prevented users from both liking AND saving the same itinerary.

## How These Issues Affected the App

### Detail View Liking
- **Symptom**: Liking button didn't work
- **Cause**: The `toggle_like` function tried to INSERT with a `type` column that didn't exist
- **Result**: Database error (silently failed in the UI)

### Discover Page Liking
- **Symptom**: Same as detail view
- **Cause**: Same issue - missing type column
- **Result**: Like count didn't update

### Likes Tab Empty
- **Symptom**: Liked itineraries didn't show up
- **Causes**:
  1. No likes were actually saved (due to the INSERT failure above)
  2. Even if they were saved, RLS policies would prevent querying them
- **Result**: Empty likes tab

## Solutions Provided

### Migration Files
1. **`006.5_add_type_column_to_saved_itineraries.sql`**
   - Adds the `type` column with default value 'save'
   - Creates index on `type` for better performance
   - Updates unique constraint to allow both like and save
   - Adds check constraint to ensure type is either 'like' or 'save'

2. **`006.6_add_saved_itineraries_policies.sql`**
   - Creates RLS policy for users to view their own saved items
   - Creates RLS policy for users to insert their own saved items
   - Creates RLS policy for users to delete their own saved items
   - Creates RLS policy to allow viewing public itinerary save counts
   - Grants necessary permissions to authenticated users

### Comprehensive Fix Script
**`scripts/fix-likes-system.sql`** - A single script that:
- Applies all fixes in the correct order
- Checks existing state before making changes
- Provides detailed feedback about what was fixed
- Verifies the setup after applying fixes

## How to Apply the Fix

### Option 1: Run the Comprehensive Fix Script (Recommended)
```bash
# From the project root
psql $DATABASE_URL -f scripts/fix-likes-system.sql
```

### Option 2: Apply Migrations Individually
```bash
# Apply in order
psql $DATABASE_URL -f supabase/migrations/006.5_add_type_column_to_saved_itineraries.sql
psql $DATABASE_URL -f supabase/migrations/006.6_add_saved_itineraries_policies.sql
```

### Option 3: Using Supabase CLI
```bash
# If using Supabase CLI locally
supabase migration up
```

## Testing the Fix

### 1. Test Liking from Detail View
1. Navigate to any itinerary detail page (e.g., `/event/[id]`)
2. Click the "Like" button
3. Verify:
   - Button changes to "Liked"
   - Like count increments
   - Heart icon fills with red

### 2. Test Liking from Discover Page
1. Navigate to the discover page
2. Click the heart icon on any itinerary
3. Verify the like count updates

### 3. Test Likes Tab
1. After liking some itineraries
2. Navigate to the Likes tab (`/liked`)
3. Verify:
   - Your liked itineraries appear
   - You can click to view them
   - You can unlike them (heart button)

### 4. Test Unlike
1. Click the "Liked" button (or filled heart) on an itinerary you've liked
2. Verify:
   - Button changes to "Like"
   - Like count decrements
   - Itinerary disappears from Likes tab

## Diagnostic Page

A diagnostic page has been created at `/diagnostics` that checks:
- User authentication status
- Existence of RPC functions (toggle_like, user_has_liked)
- Table access permissions
- Your current likes
- Metrics data
- Join queries

Visit this page if you're still experiencing issues after applying the fix.

## Database Schema After Fix

### saved_itineraries Table
```sql
CREATE TABLE saved_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'save' CHECK (type IN ('like', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, itinerary_id, type)
);
```

### RLS Policies
- Users can view own saved itineraries
- Users can insert own saved itineraries
- Users can delete own saved itineraries
- Anyone can view save counts for public itineraries

## Related Files

### Frontend Components
- `/components/event-detail.tsx` - Detail view like button
- `/app/discover/page.tsx` - Discover page like button
- `/components/discovery-feed.tsx` - Discovery feed like button
- `/app/liked/page.tsx` - Likes tab

### Database Functions
- `toggle_like(user_uuid, itinerary_uuid)` - Like/unlike an itinerary
- `user_has_liked(user_uuid, itinerary_uuid)` - Check if user has liked
- `increment_like_count()` - Trigger function to update metrics
- `decrement_like_count()` - Trigger function to update metrics

### Migrations
- `001_initial_schema.sql` - Creates saved_itineraries table (without type)
- `007_likes_system.sql` - Creates like functions and triggers
- `006.5_add_type_column_to_saved_itineraries.sql` - **NEW** - Adds type column
- `006.6_add_saved_itineraries_policies.sql` - **NEW** - Adds RLS policies
