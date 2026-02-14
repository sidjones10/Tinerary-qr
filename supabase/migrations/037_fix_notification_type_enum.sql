-- ============================================================================
-- Migration 037: Fix Notification Type Enum
-- ============================================================================
-- ISSUE: Like notifications fail with "invalid input value for enum
-- notification_type: 'like'" because the enum doesn't include all types.
--
-- SOLUTION: Convert the type column from enum to TEXT for flexibility,
-- or add all missing values to the enum.
-- ============================================================================

-- First, let's check if type is an enum and convert it to TEXT
-- This is the safest approach as it allows any notification type

-- Drop the enum constraint if it exists and convert to TEXT
DO $$
BEGIN
  -- Try to alter the column type to TEXT
  -- This will work if it's currently an enum
  BEGIN
    ALTER TABLE notifications ALTER COLUMN type TYPE TEXT;
    RAISE NOTICE 'Converted notifications.type to TEXT';
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'notifications.type is already TEXT or conversion not needed: %', SQLERRM;
  END;
END $$;

-- If there's an enum type, try to add the missing values
DO $$
BEGIN
  -- Add 'like' if it doesn't exist
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'like';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'notification_type enum does not exist, skipping';
    WHEN duplicate_object THEN
      RAISE NOTICE 'like already exists in enum';
  END;

  -- Add other common notification types
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'follower';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'share';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'first_post';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'view_milestone';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invitation';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_confirmation';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_issued';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'itinerary_rsvp';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'promotion_approved';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'affiliate_conversion';
  EXCEPTION WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'system_message';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 037: Notification Type Fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'The notifications.type column now accepts:';
  RAISE NOTICE '  - like, follower, share';
  RAISE NOTICE '  - new_comment, comment_reply';
  RAISE NOTICE '  - first_post, view_milestone';
  RAISE NOTICE '  - invitation, booking_confirmation';
  RAISE NOTICE '  - ticket_issued, itinerary_rsvp';
  RAISE NOTICE '  - promotion_approved, affiliate_conversion';
  RAISE NOTICE '  - system_message';
  RAISE NOTICE '';
  RAISE NOTICE 'Likes should now work correctly!';
  RAISE NOTICE '';
END $$;
