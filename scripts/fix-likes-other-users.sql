-- ============================================================================
-- FIX: Enable Likes on Other Users' Itineraries
-- ============================================================================
-- Run this script in your Supabase SQL Editor to fix the likes functionality
--
-- Problem: Users can only like their own itineraries, not others'
-- Solution: Use SECURITY DEFINER function to bypass RLS for FK checks
-- ============================================================================

-- Step 1: Create or replace the toggle_like function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, itinerary_uuid UUID)
RETURNS TABLE(is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
  existing_like_id UUID;
  current_like_count INTEGER;
  itinerary_exists BOOLEAN;
BEGIN
  -- Explicitly check if itinerary exists (bypasses RLS due to SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 FROM itineraries WHERE id = itinerary_uuid
  ) INTO itinerary_exists;

  IF NOT itinerary_exists THEN
    RAISE EXCEPTION 'Itinerary does not exist: %', itinerary_uuid;
  END IF;

  -- Check if like already exists
  SELECT id INTO existing_like_id
  FROM saved_itineraries
  WHERE user_id = user_uuid
    AND itinerary_id = itinerary_uuid
    AND type = 'like';

  IF existing_like_id IS NOT NULL THEN
    -- Unlike: Delete the existing like
    DELETE FROM saved_itineraries WHERE id = existing_like_id;

    -- Get updated count
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT FALSE, current_like_count;
  ELSE
    -- Like: Insert new like
    INSERT INTO saved_itineraries (user_id, itinerary_id, type)
    VALUES (user_uuid, itinerary_uuid, 'like');

    -- Get updated count
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;

    RETURN QUERY SELECT TRUE, current_like_count;
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a race condition, just return current state
    SELECT COALESCE(like_count, 0) INTO current_like_count
    FROM itinerary_metrics
    WHERE itinerary_id = itinerary_uuid;
    RETURN QUERY SELECT TRUE, current_like_count;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_like TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_like TO anon;

-- Step 3: Create user_has_liked function if it doesn't exist
CREATE OR REPLACE FUNCTION user_has_liked(user_uuid UUID, itinerary_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM saved_itineraries
    WHERE user_id = user_uuid
      AND itinerary_id = itinerary_uuid
      AND type = 'like'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_has_liked TO authenticated;

-- Step 4: Ensure itinerary_metrics table exists and has triggers
-- Create table if not exists
CREATE TABLE IF NOT EXISTS itinerary_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE UNIQUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id ON itinerary_metrics(itinerary_id);

-- Step 5: Create triggers to auto-update like counts
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'like' THEN
    INSERT INTO itinerary_metrics (itinerary_id, like_count)
    VALUES (NEW.itinerary_id, 1)
    ON CONFLICT (itinerary_id)
    DO UPDATE SET like_count = itinerary_metrics.like_count + 1, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'like' THEN
    UPDATE itinerary_metrics
    SET like_count = GREATEST(0, like_count - 1), updated_at = NOW()
    WHERE itinerary_id = OLD.itinerary_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers and recreate
DROP TRIGGER IF EXISTS like_count_increment ON saved_itineraries;
CREATE TRIGGER like_count_increment
  AFTER INSERT ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION increment_like_count();

DROP TRIGGER IF EXISTS like_count_decrement ON saved_itineraries;
CREATE TRIGGER like_count_decrement
  AFTER DELETE ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION decrement_like_count();

-- Step 6: Ensure saved_itineraries has proper structure
-- Add type column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_itineraries' AND column_name = 'type'
  ) THEN
    ALTER TABLE saved_itineraries ADD COLUMN type TEXT DEFAULT 'save';
  END IF;
END $$;

-- Step 7: Verification
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'toggle_like'
  ) INTO func_exists;

  IF func_exists THEN
    RAISE NOTICE '✓ toggle_like function created successfully';
    RAISE NOTICE '✓ Users should now be able to like any public itinerary';
  ELSE
    RAISE WARNING '✗ toggle_like function creation failed!';
  END IF;
END $$;
