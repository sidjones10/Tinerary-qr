-- Fix RLS policies on itinerary_metrics table
-- Current policies are too permissive (allow anyone to insert/update)

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view metrics" ON itinerary_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON itinerary_metrics;
DROP POLICY IF EXISTS "System can update metrics" ON itinerary_metrics;

-- Create more secure policies
-- Allow anyone to view metrics (for public itineraries)
CREATE POLICY "Anyone can view metrics" ON itinerary_metrics
  FOR SELECT USING (true);

-- Only itinerary owners can manage metrics for their itineraries
CREATE POLICY "Owners can insert metrics" ON itinerary_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update metrics" ON itinerary_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete metrics" ON itinerary_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_metrics.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Allow service role to manage all metrics (for system operations)
CREATE POLICY "Service role can manage all metrics" ON itinerary_metrics
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON POLICY "Owners can insert metrics" ON itinerary_metrics IS 'Only itinerary owners can create metrics for their itineraries';
