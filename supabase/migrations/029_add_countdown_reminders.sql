-- ============================================================================
-- Migration: Add countdown reminders and post-event prompts
-- ============================================================================
-- Enables countdown reminder notifications for itineraries and tracks
-- whether users have been prompted to update their cover photo after an event

-- Add countdown_reminders_enabled to itineraries
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS countdown_reminders_enabled BOOLEAN DEFAULT true;

-- Add last_reminder_sent to track when the last reminder was sent
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ DEFAULT NULL;

-- Add cover_update_prompted to track if user was prompted post-event
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS cover_update_prompted BOOLEAN DEFAULT false;

-- Add the same fields to drafts for consistency
ALTER TABLE drafts
  ADD COLUMN IF NOT EXISTS countdown_reminders_enabled BOOLEAN DEFAULT true;

-- Create table to track sent reminders (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS itinerary_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- e.g., '5_days', '1_day', '5_hours', 'started', 'post_event_cover'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id, reminder_type)
);

-- Add RLS policies for itinerary_reminders
ALTER TABLE itinerary_reminders ENABLE ROW LEVEL SECURITY;

-- Users can read their own reminders
CREATE POLICY "Users can view their own reminders" ON itinerary_reminders
  FOR SELECT USING (user_id = auth.uid());

-- System can insert reminders (via service role)
CREATE POLICY "Service can insert reminders" ON itinerary_reminders
  FOR INSERT WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_itinerary_reminders_itinerary_id ON itinerary_reminders(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_reminders_user_id ON itinerary_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_countdown_enabled ON itineraries(countdown_reminders_enabled);
CREATE INDEX IF NOT EXISTS idx_itineraries_start_date ON itineraries(start_date);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Countdown Reminders Feature Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Reminder intervals:';
  RAISE NOTICE '  - 5 days before';
  RAISE NOTICE '  - 2 days before';
  RAISE NOTICE '  - 1 day before';
  RAISE NOTICE '  - 15 hours before';
  RAISE NOTICE '  - 10 hours before';
  RAISE NOTICE '  - 5 hours before';
  RAISE NOTICE '  - 2 hours before';
  RAISE NOTICE '  - 45 minutes before';
  RAISE NOTICE '  - 20 minutes before';
  RAISE NOTICE '  - 10 minutes before';
  RAISE NOTICE '  - 5 minutes before';
  RAISE NOTICE '  - Event started!';
  RAISE NOTICE '  - Post-event cover photo prompt (1 day after)';
  RAISE NOTICE '';
END $$;
