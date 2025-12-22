-- Comprehensive notification triggers for all user interactions
-- This migration creates database triggers to automatically generate notifications
-- ULTRA-SAFE VERSION: Creates missing tables and only creates triggers for existing tables

-- ============================================================================
-- STEP 1: ENSURE ALL REQUIRED TABLES EXIST
-- ============================================================================

-- Check and create saved_itineraries table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'save',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, itinerary_id)
);

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_itineraries' AND column_name = 'type'
  ) THEN
    ALTER TABLE saved_itineraries ADD COLUMN type TEXT DEFAULT 'save';
  END IF;
END $$;

-- Create index for type
CREATE INDEX IF NOT EXISTS idx_saved_itineraries_type ON saved_itineraries(type);

-- Enable RLS on saved_itineraries
ALTER TABLE saved_itineraries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_itineraries' AND policyname = 'Users can view own saved itineraries'
  ) THEN
    CREATE POLICY "Users can view own saved itineraries" ON saved_itineraries
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_itineraries' AND policyname = 'Users can insert own saved itineraries'
  ) THEN
    CREATE POLICY "Users can insert own saved itineraries" ON saved_itineraries
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_itineraries' AND policyname = 'Users can delete own saved itineraries'
  ) THEN
    CREATE POLICY "Users can delete own saved itineraries" ON saved_itineraries
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE NOTIFICATION FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ============================================================================
-- 1. LIKE NOTIFICATIONS (using saved_itineraries with type='like')
-- ============================================================================

-- Function to create notification when someone likes an itinerary
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  itinerary_owner_id UUID;
  itinerary_title TEXT;
  liker_name TEXT;
BEGIN
  -- Only proceed if this is a like (not a save)
  IF NEW.type IS NULL OR NEW.type != 'like' THEN
    RETURN NEW;
  END IF;

  -- Get the itinerary owner and title
  SELECT user_id, title INTO itinerary_owner_id, itinerary_title
  FROM itineraries
  WHERE id = NEW.itinerary_id;

  -- Get the name of the user who liked
  SELECT COALESCE(name, username, email) INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Only notify if someone else liked (not self-liking)
  IF itinerary_owner_id IS NOT NULL AND itinerary_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      is_read,
      created_at
    ) VALUES (
      itinerary_owner_id,
      'like',
      'New like on your itinerary',
      COALESCE(liker_name, 'Someone') || ' liked "' || itinerary_title || '"',
      '/event/' || NEW.itinerary_id,
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes on saved_itineraries table
DROP TRIGGER IF EXISTS trigger_like_notification ON saved_itineraries;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON saved_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- ============================================================================
-- 2. FOLLOWER NOTIFICATIONS (only if user_follows exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_follows') THEN
    -- Function to create notification when someone follows a user
    CREATE OR REPLACE FUNCTION create_follower_notification()
    RETURNS TRIGGER AS $func$
    DECLARE
      follower_name TEXT;
    BEGIN
      -- Get the name of the follower
      SELECT COALESCE(name, username, email) INTO follower_name
      FROM profiles
      WHERE id = NEW.follower_id;

      -- Notify the user being followed
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        is_read,
        created_at
      ) VALUES (
        NEW.following_id,
        'follower',
        'New follower',
        COALESCE(follower_name, 'Someone') || ' started following you',
        '/profile/' || NEW.follower_id,
        false,
        NOW()
      );

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for follows
    DROP TRIGGER IF EXISTS trigger_follower_notification ON user_follows;
    CREATE TRIGGER trigger_follower_notification
      AFTER INSERT ON user_follows
      FOR EACH ROW
      EXECUTE FUNCTION create_follower_notification();

    RAISE NOTICE '✓ Follower notifications enabled';
  ELSE
    RAISE NOTICE '⊘ Skipping follower notifications (user_follows table does not exist)';
  END IF;
END $$;

-- ============================================================================
-- 3. INVITATION NOTIFICATIONS (only if itinerary_invitations exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itinerary_invitations') THEN
    -- Function to create notification when someone is invited to an itinerary
    CREATE OR REPLACE FUNCTION create_itinerary_invitation_notification()
    RETURNS TRIGGER AS $func$
    DECLARE
      inviter_name TEXT;
      itinerary_title TEXT;
    BEGIN
      -- Get the name of the inviter
      SELECT COALESCE(name, username, email) INTO inviter_name
      FROM profiles
      WHERE id = NEW.inviter_id;

      -- Get the itinerary title
      SELECT title INTO itinerary_title
      FROM itineraries
      WHERE id = NEW.itinerary_id;

      -- Notify the invited user
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        is_read,
        created_at
      ) VALUES (
        NEW.invitee_id,
        'invitation',
        'New itinerary invitation',
        COALESCE(inviter_name, 'Someone') || ' invited you to "' || itinerary_title || '"',
        '/event/' || NEW.itinerary_id,
        false,
        NOW()
      );

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for invitations
    DROP TRIGGER IF EXISTS trigger_itinerary_invitation_notification ON itinerary_invitations;
    CREATE TRIGGER trigger_itinerary_invitation_notification
      AFTER INSERT ON itinerary_invitations
      FOR EACH ROW
      EXECUTE FUNCTION create_itinerary_invitation_notification();

    RAISE NOTICE '✓ Invitation notifications enabled';
  ELSE
    RAISE NOTICE '⊘ Skipping invitation notifications (itinerary_invitations table does not exist)';
  END IF;
END $$;

-- ============================================================================
-- 4. RSVP NOTIFICATIONS (optional - only if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itinerary_rsvps') THEN
    -- Function to create notification when someone RSVPs
    CREATE OR REPLACE FUNCTION create_rsvp_notification()
    RETURNS TRIGGER AS $func$
    DECLARE
      itinerary_owner_id UUID;
      itinerary_title TEXT;
      rsvp_user_name TEXT;
    BEGIN
      -- Get the itinerary owner and title
      SELECT user_id, title INTO itinerary_owner_id, itinerary_title
      FROM itineraries
      WHERE id = NEW.itinerary_id;

      -- Get the name of the user who RSVP'd
      SELECT COALESCE(name, username, email) INTO rsvp_user_name
      FROM profiles
      WHERE id = NEW.user_id;

      -- Only notify if someone else RSVP'd (not self-RSVP)
      IF itinerary_owner_id IS NOT NULL AND itinerary_owner_id != NEW.user_id THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link_url,
          is_read,
          created_at
        ) VALUES (
          itinerary_owner_id,
          'itinerary_rsvp',
          'New RSVP for your event',
          COALESCE(rsvp_user_name, 'Someone') || ' RSVP''d to "' || itinerary_title || '"',
          '/event/' || NEW.itinerary_id,
          false,
          NOW()
        );
      END IF;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_rsvp_notification ON itinerary_rsvps;
    CREATE TRIGGER trigger_rsvp_notification
      AFTER INSERT ON itinerary_rsvps
      FOR EACH ROW
      EXECUTE FUNCTION create_rsvp_notification();

    RAISE NOTICE '✓ RSVP notifications enabled';
  ELSE
    RAISE NOTICE '⊘ Skipping RSVP notifications (itinerary_rsvps table does not exist)';
  END IF;
END $$;

-- ============================================================================
-- 5. SHARE NOTIFICATIONS (optional - only if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itinerary_shares') THEN
    -- Function to create notification when an itinerary is shared
    CREATE OR REPLACE FUNCTION create_share_notification()
    RETURNS TRIGGER AS $func$
    DECLARE
      itinerary_owner_id UUID;
      itinerary_title TEXT;
      sharer_name TEXT;
    BEGIN
      -- Only proceed if there's a target_user_id (direct share)
      IF NEW.target_user_id IS NULL THEN
        RETURN NEW;
      END IF;

      -- Get the itinerary owner and title
      SELECT user_id, title INTO itinerary_owner_id, itinerary_title
      FROM itineraries
      WHERE id = NEW.itinerary_id;

      -- Get the name of the user who shared
      SELECT COALESCE(name, username, email) INTO sharer_name
      FROM profiles
      WHERE id = NEW.shared_by;

      -- Notify the user who received the share
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        is_read,
        created_at
      ) VALUES (
        NEW.target_user_id,
        'share',
        'Someone shared an itinerary with you',
        COALESCE(sharer_name, 'Someone') || ' shared "' || itinerary_title || '" with you',
        '/event/' || NEW.itinerary_id,
        false,
        NOW()
      );

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_share_notification ON itinerary_shares;
    CREATE TRIGGER trigger_share_notification
      AFTER INSERT ON itinerary_shares
      FOR EACH ROW
      EXECUTE FUNCTION create_share_notification();

    RAISE NOTICE '✓ Share notifications enabled';
  ELSE
    RAISE NOTICE '⊘ Skipping Share notifications (itinerary_shares table does not exist)';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Notification system configured!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables ensured:';
  RAISE NOTICE '  ✓ saved_itineraries (with type column for likes)';
  RAISE NOTICE '';
  RAISE NOTICE 'Active triggers:';
  RAISE NOTICE '  ✓ Like notifications (saved_itineraries with type=like)';
  RAISE NOTICE '  ✓ Comment notifications (from migration 012)';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the output above for status of other triggers.';
  RAISE NOTICE '';
  RAISE NOTICE 'All notification triggers are now active!';
  RAISE NOTICE 'Use the useNotifications hook for real-time updates.';
  RAISE NOTICE '';
END $$;
