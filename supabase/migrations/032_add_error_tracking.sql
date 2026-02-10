-- ============================================================================
-- Migration: Add error tracking table
-- ============================================================================
-- Tracks client-side and server-side errors for monitoring and debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type TEXT NOT NULL CHECK (error_type IN ('client', 'server', 'api', 'database', 'auth')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  url TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- Anyone can insert error logs (for client-side error reporting)
CREATE POLICY "Anyone can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Only admins can update error logs (to mark as resolved)
CREATE POLICY "Admins can update error logs" ON error_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
  );

-- Function to log errors easily
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO error_logs (error_type, error_message, error_stack, component, url, user_id, metadata)
  VALUES (p_error_type, p_error_message, p_error_stack, p_component, p_url, p_user_id, p_metadata)
  RETURNING id INTO error_id;

  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Error Tracking System Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Error types: client, server, api, database, auth';
  RAISE NOTICE 'Use log_error() function to record errors';
  RAISE NOTICE '';
END $$;
