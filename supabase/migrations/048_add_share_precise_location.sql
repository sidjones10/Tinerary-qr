-- Add share_precise_location column to itineraries table
-- When false (default), public itineraries show a generalized location (city/region only)
-- instead of the exact address. Only applies to public itineraries.
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS share_precise_location BOOLEAN DEFAULT true;

-- Backfill: existing itineraries keep precise location enabled for backwards compatibility
UPDATE itineraries SET share_precise_location = true WHERE share_precise_location IS NULL;
