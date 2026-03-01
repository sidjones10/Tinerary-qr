-- Add capacity tracking columns to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT NULL;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS available_capacity INTEGER DEFAULT NULL;

-- RPC function to decrease promotion capacity when a booking is made
CREATE OR REPLACE FUNCTION decrease_promotion_capacity(
  p_promotion_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotions
  SET available_capacity = GREATEST(0, COALESCE(available_capacity, max_capacity, 0) - p_quantity)
  WHERE id = p_promotion_id
    AND available_capacity IS NOT NULL;
END;
$$;

-- RPC function to restore promotion capacity when a booking is cancelled
CREATE OR REPLACE FUNCTION increase_promotion_capacity(
  p_promotion_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotions
  SET available_capacity = LEAST(
    COALESCE(max_capacity, available_capacity + p_quantity),
    COALESCE(available_capacity, 0) + p_quantity
  )
  WHERE id = p_promotion_id
    AND available_capacity IS NOT NULL;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION decrease_promotion_capacity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increase_promotion_capacity(UUID, INTEGER) TO authenticated;
