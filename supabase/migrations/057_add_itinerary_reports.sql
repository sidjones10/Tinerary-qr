-- ============================================================================
-- Migration: Add itinerary reporting system
-- ============================================================================
-- Allows users to report public itineraries for admin review

-- Create report reasons enum-style check
CREATE TABLE IF NOT EXISTS itinerary_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'misleading',
    'harassment',
    'copyright',
    'other'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate reports from same user for same itinerary
  UNIQUE(itinerary_id, reporter_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_itinerary_reports_itinerary_id ON itinerary_reports(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_reports_reporter_id ON itinerary_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_reports_status ON itinerary_reports(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_reports_created_at ON itinerary_reports(created_at DESC);

-- Enable RLS
ALTER TABLE itinerary_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports for public itineraries (not their own)
CREATE POLICY "Users can create reports" ON itinerary_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON itinerary_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON itinerary_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can update reports (review/resolve/dismiss)
CREATE POLICY "Admins can update reports" ON itinerary_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (is_admin = true OR role = 'admin')
    )
  );
