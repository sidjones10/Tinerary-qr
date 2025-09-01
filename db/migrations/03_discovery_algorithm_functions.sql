-- Create RPC functions for tracking metrics

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.itinerary_metrics
  SET view_count = view_count + 1
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment save count
CREATE OR REPLACE FUNCTION increment_save_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.itinerary_metrics
  SET save_count = save_count + 1
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.itinerary_metrics
  SET like_count = like_count + 1
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment share count
CREATE OR REPLACE FUNCTION increment_share_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.itinerary_metrics
  SET share_count = share_count + 1
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(itinerary_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.itinerary_metrics
  SET comment_count = comment_count + 1
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_average_rating(itinerary_id UUID, new_rating DECIMAL)
RETURNS void AS $$
DECLARE
  current_avg DECIMAL;
  current_count INTEGER;
BEGIN
  -- Get current values
  SELECT average_rating, comment_count INTO current_avg, current_count
  FROM public.itinerary_metrics
  WHERE itinerary_id = $1;
  
  -- Calculate new average
  IF current_count = 0 THEN
    current_avg := new_rating;
  ELSE
    current_avg := ((current_avg * current_count) + new_rating) / (current_count + 1);
  END IF;
  
  -- Update the metrics
  UPDATE public.itinerary_metrics
  SET average_rating = current_avg
  WHERE itinerary_id = $1;
END;
$$ LANGUAGE plpgsql;
