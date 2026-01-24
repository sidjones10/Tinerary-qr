-- Migration: Fix notifications and itinerary_metrics issues
-- Created: 2026-01-22
-- Purpose: Add missing columns and RLS policies for notifications and itinerary_metrics

-- 1. Add missing columns to notifications table
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 2. Add INSERT policy for notifications (allow users to create their own notifications)
CREATE POLICY IF NOT EXISTS "Users can insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add INSERT policy for itinerary_metrics (allow users to create metrics for their itineraries)
CREATE POLICY IF NOT EXISTS "Users can insert itinerary metrics" ON itinerary_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- 4. Add SELECT policy for itinerary_metrics (allow users to view metrics)
CREATE POLICY IF NOT EXISTS "Users can view all itinerary metrics" ON itinerary_metrics
  FOR SELECT
  USING (true); -- Metrics are public information

-- 5. Add UPDATE policy for itinerary_metrics (system can update, users can update their own)
CREATE POLICY IF NOT EXISTS "Users can update own itinerary metrics" ON itinerary_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- 6. Ensure RLS is enabled (should already be, but being explicit)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_metrics ENABLE ROW LEVEL SECURITY;

-- Create an index on notifications.user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itinerary_metrics_itinerary_id ON itinerary_metrics(itinerary_id);
