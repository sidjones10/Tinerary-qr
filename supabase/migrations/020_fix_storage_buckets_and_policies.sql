-- Migration: Fix Storage Buckets and Policies
-- This creates storage buckets and RLS policies for user avatars and itinerary images

-- ============================================================================
-- Create storage buckets
-- ============================================================================

-- Create user-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true, -- Make public so images can be accessed via URL
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create itinerary-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'itinerary-images',
  'itinerary-images',
  true, -- Make public so images can be accessed via URL
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- Drop existing policies to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Public can view user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Public can view itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own itinerary images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own itinerary images" ON storage.objects;

-- ============================================================================
-- User Avatars Policies
-- ============================================================================

-- Policy 1: Anyone can view user avatars
CREATE POLICY "Public can view user avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policy 2: Users can upload their own avatar
-- File path format: {userId}/{filename}
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- Policy 3: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- ============================================================================
-- Itinerary Images Policies
-- ============================================================================

-- Policy 1: Anyone can view itinerary images
CREATE POLICY "Public can view itinerary images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'itinerary-images');

-- Policy 2: Authenticated users can upload itinerary images to their own folder
-- File path format: {userId}/{filename}
CREATE POLICY "Authenticated users can upload itinerary images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'itinerary-images'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- Policy 3: Users can update their own itinerary images
CREATE POLICY "Users can update own itinerary images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'itinerary-images'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- Policy 4: Users can delete their own itinerary images
CREATE POLICY "Users can delete own itinerary images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'itinerary-images'
  AND (string_to_array(name, '/'))[1]::uuid = auth.uid()
);

-- ============================================================================
-- Verify the setup
-- ============================================================================

-- Check buckets
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('user-avatars', 'itinerary-images', 'event-photos');

-- Check policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND (
  policyname LIKE '%avatar%'
  OR policyname LIKE '%itinerary%'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Storage Buckets Fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Buckets created:';
  RAISE NOTICE '  ✓ user-avatars (2MB limit)';
  RAISE NOTICE '  ✓ itinerary-images (5MB limit)';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  ✓ Public read access for all images';
  RAISE NOTICE '  ✓ Users can upload/update/delete own files';
  RAISE NOTICE '';
  RAISE NOTICE 'File path format:';
  RAISE NOTICE '  - user-avatars: {userId}/{filename}';
  RAISE NOTICE '  - itinerary-images: {userId}/{filename}';
  RAISE NOTICE '';
END $$;
