-- Backfill itinerary_metrics for existing itineraries
-- Some itineraries may not have metrics records, causing join failures

INSERT INTO itinerary_metrics (
  itinerary_id,
  view_count,
  save_count,
  share_count,
  like_count,
  comment_count,
  average_rating,
  trending_score,
  created_at,
  updated_at
)
SELECT
  id,
  0, -- view_count
  0, -- save_count
  0, -- share_count
  0, -- like_count
  0, -- comment_count
  0, -- average_rating
  0.0, -- trending_score
  NOW(),
  NOW()
FROM itineraries
WHERE NOT EXISTS (
  SELECT 1 FROM itinerary_metrics WHERE itinerary_id = itineraries.id
)
ON CONFLICT (itinerary_id) DO NOTHING;

-- Create a trigger to automatically create metrics when an itinerary is created
CREATE OR REPLACE FUNCTION create_metrics_for_itinerary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO itinerary_metrics (itinerary_id)
  VALUES (NEW.id)
  ON CONFLICT (itinerary_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_metrics_trigger ON itineraries;

CREATE TRIGGER create_metrics_trigger
  AFTER INSERT ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION create_metrics_for_itinerary();

-- Verify the backfill
SELECT
  COUNT(*) FILTER (WHERE m.itinerary_id IS NULL) as itineraries_without_metrics,
  COUNT(*) FILTER (WHERE m.itinerary_id IS NOT NULL) as itineraries_with_metrics
FROM itineraries i
LEFT JOIN itinerary_metrics m ON i.id = m.itinerary_id;

COMMENT ON FUNCTION create_metrics_for_itinerary() IS 'Automatically creates metrics record when itinerary is created';
