-- Create user_reports table for reporting user accounts
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'harassment', 'hate_speech', 'spam', 'impersonation',
    'inappropriate_content', 'predatory_behavior', 'scam',
    'underage', 'self_harm', 'other'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  admin_notes TEXT,
  admin_action TEXT CHECK (admin_action IN (NULL, 'warned', 'suspended', 'banned', 'no_action')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate reports from same reporter for same user (within a time window)
  CONSTRAINT unique_pending_report UNIQUE (reported_user_id, reporter_id, reason)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_severity ON user_reports(severity);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

-- RLS policies
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (insert their own)
CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all user reports"
  ON user_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- Admins can update reports
CREATE POLICY "Admins can update user reports"
  ON user_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );
