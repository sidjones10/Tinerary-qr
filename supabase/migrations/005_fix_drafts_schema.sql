-- Fix Drafts Table Schema
-- Update drafts table to match the app's data structure

-- Drop the old drafts table if it exists with the wrong schema
DROP TABLE IF EXISTS drafts CASCADE;

-- Recreate drafts table with proper schema
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  type TEXT DEFAULT 'event',
  is_public BOOLEAN DEFAULT true,
  activities JSONB DEFAULT '[]',
  packing_items JSONB DEFAULT '[]',
  expenses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_drafts_user_id ON drafts(user_id);
