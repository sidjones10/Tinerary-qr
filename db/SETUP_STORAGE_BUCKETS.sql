-- SETUP STORAGE BUCKETS FOR IMAGES
-- Run this in Supabase SQL Editor to create storage buckets

-- Note: Storage buckets are created via the Supabase Dashboard Storage section,
-- not via SQL. This script creates the necessary RLS policies.

-- However, you can check if buckets exist with this query:
SELECT
  name,
  public,
  created_at
FROM storage.buckets
WHERE name IN ('itinerary-images', 'user-avatars');

-- ============================================
-- MANUAL STEPS TO CREATE BUCKETS:
-- ============================================
--
-- 1. Go to Supabase Dashboard → Storage (left sidebar)
-- 2. Click "New bucket"
-- 3. Create bucket named: "itinerary-images"
--    - Set as PUBLIC
--    - Max file size: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 4. Click "New bucket" again
-- 5. Create bucket named: "user-avatars"
--    - Set as PUBLIC
--    - Max file size: 2MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- ============================================

-- After creating the buckets manually in the UI, run these policies:

-- Policies for itinerary-images bucket
CREATE POLICY "Anyone can view itinerary images"
ON storage.objects FOR SELECT
USING (bucket_id = 'itinerary-images');

CREATE POLICY "Authenticated users can upload itinerary images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'itinerary-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own itinerary images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'itinerary-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own itinerary images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'itinerary-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for user-avatars bucket
CREATE POLICY "Anyone can view user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify buckets exist
SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✅ Both buckets exist'
    WHEN COUNT(*) = 1 THEN '⚠️  Only one bucket exists'
    ELSE '❌ No buckets found - create them manually in Storage UI'
  END as status,
  string_agg(name, ', ') as existing_buckets
FROM storage.buckets
WHERE name IN ('itinerary-images', 'user-avatars');
