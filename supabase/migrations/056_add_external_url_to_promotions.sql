-- Add external_url column to promotions table
-- Stores the outbound link to the business's original listing page.
-- When a user clicks "View Deal", they are redirected through affiliate tracking
-- to this URL.

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMENT ON COLUMN promotions.external_url IS 'URL to the business original listing page for affiliate-style outbound links';
