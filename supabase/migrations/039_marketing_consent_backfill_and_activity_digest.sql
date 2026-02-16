-- ============================================================================
-- Migration: Backfill marketing_consent for existing users & add activity_digest_consent
-- ============================================================================
-- 1. Sets marketing_consent = true for every existing user so they are
--    grandfathered in (new users will opt-in explicitly during signup).
-- 2. Adds an activity_digest_consent column (defaults to true) which controls
--    personalised "based on what you've been browsing" emails. This is a
--    separate concept from marketing emails and is managed exclusively from
--    the Notification Settings page.
-- 3. Updates the record_consent() helper to handle the new consent type.
-- 4. Adds 'activity_digest' to the consent_records check constraint.

-- ── 1. Backfill marketing_consent ──────────────────────────────────────────
UPDATE profiles
SET marketing_consent = true
WHERE marketing_consent IS DISTINCT FROM true;

-- ── 2. Add activity_digest_consent column ──────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activity_digest_consent BOOLEAN DEFAULT true;

-- Backfill existing users to true (column default covers new rows)
UPDATE profiles
SET activity_digest_consent = true
WHERE activity_digest_consent IS NULL;

-- ── 3. Widen the consent_type check on consent_records ─────────────────────
-- Drop and recreate the check constraint to include the new type.
ALTER TABLE consent_records DROP CONSTRAINT IF EXISTS consent_records_consent_type_check;
ALTER TABLE consent_records
  ADD CONSTRAINT consent_records_consent_type_check
  CHECK (consent_type IN ('tos', 'privacy_policy', 'parental', 'marketing', 'location_tracking', 'data_processing', 'activity_digest'));

-- ── 4. Update record_consent() to handle activity_digest ───────────────────
CREATE OR REPLACE FUNCTION record_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_consent_version TEXT,
  p_consent_given BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  consent_id UUID;
BEGIN
  INSERT INTO consent_records (user_id, consent_type, consent_version, consent_given, ip_address, user_agent)
  VALUES (p_user_id, p_consent_type, p_consent_version, p_consent_given, p_ip_address, p_user_agent)
  RETURNING id INTO consent_id;

  -- Update profile based on consent type
  IF p_consent_type = 'tos' AND p_consent_given THEN
    UPDATE profiles SET tos_accepted_at = NOW(), tos_version = p_consent_version WHERE id = p_user_id;
  ELSIF p_consent_type = 'privacy_policy' AND p_consent_given THEN
    UPDATE profiles SET privacy_policy_accepted_at = NOW(), privacy_policy_version = p_consent_version WHERE id = p_user_id;
  ELSIF p_consent_type = 'parental' AND p_consent_given THEN
    UPDATE profiles SET parental_consent = true, parental_consent_at = NOW() WHERE id = p_user_id;
  ELSIF p_consent_type = 'marketing' THEN
    UPDATE profiles SET marketing_consent = p_consent_given WHERE id = p_user_id;
  ELSIF p_consent_type = 'activity_digest' THEN
    UPDATE profiles SET activity_digest_consent = p_consent_given WHERE id = p_user_id;
  ELSIF p_consent_type = 'location_tracking' THEN
    UPDATE profiles SET location_tracking_consent = p_consent_given WHERE id = p_user_id;
  ELSIF p_consent_type = 'data_processing' AND p_consent_given THEN
    UPDATE profiles SET data_processing_consent = p_consent_given WHERE id = p_user_id;
  END IF;

  RETURN consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Done ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Marketing consent backfill complete!';
  RAISE NOTICE 'Activity digest consent column added!';
  RAISE NOTICE '========================================';
END $$;
