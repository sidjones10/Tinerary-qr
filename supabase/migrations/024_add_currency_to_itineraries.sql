-- Add currency field to itineraries table
-- This allows each itinerary to have its own currency for expenses

ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'
CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'));

-- Add index for currency queries
CREATE INDEX IF NOT EXISTS idx_itineraries_currency ON itineraries(currency);

-- Add comment for documentation
COMMENT ON COLUMN itineraries.currency IS 'Currency code for the itinerary expenses (USD, EUR, GBP, JPY, CAD, AUD)';
