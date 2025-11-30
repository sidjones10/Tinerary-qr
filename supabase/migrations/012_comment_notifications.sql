-- Add comment notifications functionality
-- This creates notifications when someone comments on an itinerary or replies to a comment

-- Function to create notification when a new comment is posted
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  itinerary_owner_id UUID;
  parent_comment_user_id UUID;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
  itinerary_title TEXT;
BEGIN
  -- Get the itinerary owner and title
  SELECT user_id, title INTO itinerary_owner_id, itinerary_title
  FROM itineraries
  WHERE id = NEW.itinerary_id;

  -- If it's a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get the parent comment's user
    SELECT user_id INTO parent_comment_user_id
    FROM comments
    WHERE id = NEW.parent_comment_id;

    -- Create notification for the parent comment's author
    -- But not if they're replying to themselves
    IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
      notification_type := 'comment_reply';
      notification_title := 'New reply to your comment';
      notification_message := 'Someone replied to your comment on "' || itinerary_title || '"';

      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        is_read,
        created_at
      ) VALUES (
        parent_comment_user_id,
        notification_type,
        notification_title,
        notification_message,
        '/event/' || NEW.itinerary_id,
        false,
        NOW()
      );
    END IF;
  ELSE
    -- It's a top-level comment, notify the itinerary owner
    -- But not if they're commenting on their own itinerary
    IF itinerary_owner_id IS NOT NULL AND itinerary_owner_id != NEW.user_id THEN
      notification_type := 'new_comment';
      notification_title := 'New comment on your itinerary';
      notification_message := 'Someone commented on "' || itinerary_title || '"';

      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        is_read,
        created_at
      ) VALUES (
        itinerary_owner_id,
        notification_type,
        notification_title,
        notification_message,
        '/event/' || NEW.itinerary_id,
        false,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Add comment notification types to notifications table (if not exists)
COMMENT ON COLUMN notifications.type IS 'Notification type: like, comment, follower, invitation, share, new_comment, comment_reply, etc.';
