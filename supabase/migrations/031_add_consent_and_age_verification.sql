-- ============================================================================
-- Migration: Add consent tracking and age verification
-- ============================================================================
-- Implements COPPA-compliant age verification and tiered account system
-- - Minimum age: 13 (COPPA floor)
-- - 13-17: Limited accounts (no payments, no location tracking without parental consent)
-- - 18+: Full access

-- Add consent and age columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'standard' CHECK (account_type IN ('minor', 'standard', 'business')),
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tos_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS parental_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parental_consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS parental_email TEXT,
  ADD COLUMN IF NOT EXISTS location_tracking_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT false;

-- Create consent records table for audit trail
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('tos', 'privacy_policy', 'parental', 'marketing', 'location_tracking', 'data_processing')),
  consent_version TEXT,
  consent_given BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for consent queries
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- Enable RLS on consent_records
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records
CREATE POLICY "Users can view own consent records" ON consent_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consent records
CREATE POLICY "Users can insert own consent records" ON consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine account type based on age
CREATE OR REPLACE FUNCTION get_account_type_for_age(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  user_age INTEGER;
BEGIN
  user_age := calculate_age(birth_date);
  IF user_age < 13 THEN
    RETURN NULL; -- Not eligible
  ELSIF user_age < 18 THEN
    RETURN 'minor';
  ELSE
    RETURN 'standard';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user has given required consent
CREATE OR REPLACE FUNCTION has_required_consent(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT tos_accepted_at, privacy_policy_accepted_at, date_of_birth, account_type, parental_consent
  INTO profile_record
  FROM profiles
  WHERE id = user_uuid;

  -- Must have accepted TOS and Privacy Policy
  IF profile_record.tos_accepted_at IS NULL OR profile_record.privacy_policy_accepted_at IS NULL THEN
    RETURN false;
  END IF;

  -- Must have date of birth
  IF profile_record.date_of_birth IS NULL THEN
    RETURN false;
  END IF;

  -- Minors must have parental consent
  IF profile_record.account_type = 'minor' AND profile_record.parental_consent = false THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use payment features
CREATE OR REPLACE FUNCTION can_use_payments(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT account_type, parental_consent
  INTO profile_record
  FROM profiles
  WHERE id = user_uuid;

  -- Minors cannot use payments unless they have parental consent
  IF profile_record.account_type = 'minor' AND profile_record.parental_consent = false THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use location tracking
CREATE OR REPLACE FUNCTION can_use_location_tracking(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT account_type, parental_consent, location_tracking_consent
  INTO profile_record
  FROM profiles
  WHERE id = user_uuid;

  -- Must have location tracking consent
  IF profile_record.location_tracking_consent = false THEN
    RETURN false;
  END IF;

  -- Minors need parental consent for location tracking
  IF profile_record.account_type = 'minor' AND profile_record.parental_consent = false THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent
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
  ELSIF p_consent_type = 'location_tracking' THEN
    UPDATE profiles SET location_tracking_consent = p_consent_given WHERE id = p_user_id;
  ELSIF p_consent_type = 'data_processing' AND p_consent_given THEN
    UPDATE profiles SET data_processing_consent = p_consent_given WHERE id = p_user_id;
  END IF;

  RETURN consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consent and Age Verification Ready!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Account Types:';
  RAISE NOTICE '  - minor: Ages 13-17 (limited features)';
  RAISE NOTICE '  - standard: Ages 18+ (full access)';
  RAISE NOTICE '  - business: Business accounts';
  RAISE NOTICE '';
  RAISE NOTICE 'Required Consent:';
  RAISE NOTICE '  - Terms of Service';
  RAISE NOTICE '  - Privacy Policy';
  RAISE NOTICE '  - Date of Birth verification';
  RAISE NOTICE '  - Parental consent (for minors)';
  RAISE NOTICE '';
END $$;
