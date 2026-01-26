-- FIX DRAFTS TABLE SCHEMA
-- Run this in Supabase SQL Editor

-- Drop the old drafts table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS public.drafts CASCADE;

-- Create drafts table with correct columns
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  type TEXT DEFAULT 'event',
  is_public BOOLEAN DEFAULT true,
  activities JSONB DEFAULT '[]'::jsonb,
  packing_items JSONB DEFAULT '[]'::jsonb,
  expenses JSONB DEFAULT '[]'::jsonb,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX idx_drafts_created_at ON public.drafts(created_at DESC);

-- Enable RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can insert their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.drafts;

-- Create RLS policies
CREATE POLICY "Users can view their own drafts"
  ON public.drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
  ON public.drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Verify table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'drafts'
ORDER BY ordinal_position;
