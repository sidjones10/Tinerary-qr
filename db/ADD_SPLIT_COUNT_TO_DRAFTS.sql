-- Add split_count column to drafts table
-- This stores the "Number of people" for expense splitting

ALTER TABLE public.drafts
ADD COLUMN IF NOT EXISTS split_count INTEGER DEFAULT 1;

COMMENT ON COLUMN public.drafts.split_count IS 'Number of people to split expenses between';
