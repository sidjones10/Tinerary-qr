-- Migration: Add Storage Policies for Photo Albums
-- This creates the storage bucket and RLS policies for event photos

-- Create storage bucket for event photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Policy 1: Anyone can view photos (bucket is public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Policy 2: Authenticated users can upload photos
-- File path format: {itineraryId}/{userId}-{timestamp}.{ext}
-- Allow uploads only if user owns the itinerary (first folder in path)
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND (
    -- Extract itinerary ID from path and check ownership
    (string_to_array(name, '/'))[1]::uuid IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
  )
);

-- Policy 3: Users can update their own photos
-- Verify the userId in the filename matches the authenticated user
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Check if the file belongs to user via event_photos table
    EXISTS (
      SELECT 1 FROM event_photos
      WHERE storage_path = name
      AND user_id = auth.uid()
    )
  )
);

-- Policy 4: Users can delete their own photos
-- Verify the userId in the filename matches the authenticated user
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Check if the file belongs to user via event_photos table
    EXISTS (
      SELECT 1 FROM event_photos
      WHERE storage_path = name
      AND user_id = auth.uid()
    )
  )
);

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%photo%';

SELECT 'Storage bucket and policies created successfully! ✓' as status;
