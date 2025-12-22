# Supabase Database Setup

## Applying Migrations

To set up the database schema for Tinerary, follow these steps:

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

2. Link your project to Supabase:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

3. Apply the migration:
```bash
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Option 3: Manual Migration

Run the migration file directly through your database client or the Supabase SQL editor.

## What Gets Created

This migration creates the following tables:
- `profiles` - User profile information
- `itineraries` - Trip/event details
- `activities` - Individual activities within trips
- `packing_items` - Packing list items
- `expenses` - Expense tracking
- `itinerary_categories` - Categories for trips
- `itinerary_invitations` - Invitations to trips (for existing users)
- `pending_invitations` - Email invitations (for non-users)
- `notifications` - User notifications
- `saved_itineraries` - Saved/bookmarked trips
- `itinerary_metrics` - View counts, likes, trending scores
- `user_preferences` - User preferences for personalized recommendations
- `user_interactions` - User interaction tracking for recommendation algorithm
- `drafts` - Draft trips

## Row Level Security (RLS)

The migration automatically enables and configures RLS policies to ensure:
- Users can only modify their own data
- Public itineraries are viewable by everyone
- Private itineraries are only accessible to the owner and invited users
- Notifications are private to each user

## Functions and Triggers

The migration includes:
- `increment_view_count()` - Increments view count for itineraries
- `increment_save_count()` - Increments save count for itineraries
- `calculate_trending_score()` - Auto-calculates trending scores based on engagement metrics
- Trigger to update trending scores on metrics changes

## Storage Buckets

After applying the migration, you need to create storage buckets for:
- `itinerary-images` - Trip cover images
- `user-avatars` - Profile pictures

See the Storage Setup section below.

## Storage Setup

1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `itinerary-images`
   - Make it public for easy access
   - Set allowed MIME types: image/jpeg, image/png, image/webp
   - Set maximum file size: 5MB

3. Create a new bucket named `user-avatars`
   - Make it public
   - Set allowed MIME types: image/jpeg, image/png, image/webp
   - Set maximum file size: 2MB

### Storage Policies

After creating buckets, add these policies in the Storage section:

**For itinerary-images:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'itinerary-images');

-- Allow public to view images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'itinerary-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'itinerary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'itinerary-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**For user-avatars:**
```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Environment Variables

Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verifying the Setup

After applying the migration, you can verify it worked by:

1. Check the Tables view in Supabase Dashboard
2. Run this query in the SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all 13 tables listed.

## Troubleshooting

### RLS Preventing Access
If you're getting RLS errors, check that:
- You're authenticated when making requests
- The policies match your use case
- The user has the correct permissions

### Functions Not Working
If the trending score isn't calculating:
- Check that the trigger is enabled
- Verify the function exists with `\df calculate_trending_score`

### Storage Upload Fails
If image uploads fail:
- Verify the bucket exists
- Check that storage policies are correctly applied
- Ensure file size doesn't exceed limits
- Verify MIME type is allowed
