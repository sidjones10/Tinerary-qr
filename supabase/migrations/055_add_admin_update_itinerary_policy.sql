-- ============================================================================
-- Migration 055: Add Admin Update Policy for Itineraries
-- ============================================================================
-- ISSUE FIXED:
-- Admins could delete any itinerary (policy existed) but could NOT update
-- other users' itineraries (e.g., toggling visibility). The only UPDATE
-- policy was "Users can update own itineraries" which checks
-- auth.uid() = user_id, silently blocking admin updates on others' rows.
-- ============================================================================

-- Allow admins to update any itinerary (for toggling visibility, etc.)
DROP POLICY IF EXISTS "Admins can update any itinerary" ON itineraries;
CREATE POLICY "Admins can update any itinerary" ON itineraries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );
