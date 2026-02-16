-- Migration: Set marketing_consent = true for all existing users and add browsing_emails_consent column
-- This grandfathers in existing users for marketing emails while new users must opt-in during signup
-- Also adds a separate column for browsing activity emails ("what you've been looking up")

-- Set marketing_consent to true for all existing users who have completed signup
-- (identified by having accepted TOS)
UPDATE profiles
SET marketing_consent = TRUE
WHERE tos_accepted_at IS NOT NULL
  AND marketing_consent IS NULL;

-- Add browsing_emails_consent column for "what you've been looking up" type emails
-- This is separate from marketing_consent and can be toggled in notification settings
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS browsing_emails_consent BOOLEAN DEFAULT TRUE;

-- Update existing users to have browsing_emails_consent = true (grandfather them in)
UPDATE profiles
SET browsing_emails_consent = TRUE
WHERE browsing_emails_consent IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.marketing_consent IS 'User consent for marketing emails (what''s new, promotions). Set during signup.';
COMMENT ON COLUMN profiles.browsing_emails_consent IS 'User consent for browsing activity emails (recommendations based on viewed itineraries). Managed in notification settings.';
