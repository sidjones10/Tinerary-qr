-- Display Name Queries with Row Level Security Compliance
-- These queries work within Supabase RLS policies by using auth.uid()

-- 1. Get current user's display name (RLS compliant)
SELECT display_name, name, email 
FROM users 
WHERE id = auth.uid();

-- 2. Update current user's display name (RLS compliant)
UPDATE users 
SET display_name = 'New Display Name',
    updated_at = NOW()
WHERE id = auth.uid();

-- 3. Get display name for profile page (current user only)
SELECT 
  id,
  display_name,
  name,
  email,
  avatar_url,
  created_at
FROM users 
WHERE id = auth.uid();

-- 4. Search for users by display name (if public profiles are allowed)
-- Note: This requires a policy that allows reading other users' public data
SELECT 
  id,
  display_name,
  avatar_url
FROM users 
WHERE display_name ILIKE '%search_term%'
  AND id != auth.uid()  -- Exclude current user
LIMIT 10;

-- 5. Check if display name is available (current user context)
SELECT EXISTS(
  SELECT 1 
  FROM users 
  WHERE display_name = 'desired_name' 
    AND id != auth.uid()
) as display_name_taken;

-- 6. Get user's own profile with display name for settings
SELECT 
  display_name,
  name,
  email,
  phone,
  preferences,
  avatar_url
FROM users 
WHERE id = auth.uid();

-- 7. Update display name with validation (server-side function)
CREATE OR REPLACE FUNCTION update_user_display_name(new_display_name TEXT)
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  name_exists BOOLEAN;
BEGIN
  -- Get current user ID from auth context
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate display name length
  IF LENGTH(new_display_name) < 2 OR LENGTH(new_display_name) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Display name must be 2-50 characters');
  END IF;
  
  -- Check if display name is already taken
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE display_name = new_display_name 
      AND id != current_user_id
  ) INTO name_exists;
  
  IF name_exists THEN
    RETURN json_build_object('success', false, 'error', 'Display name already taken');
  END IF;
  
  -- Update the display name
  UPDATE users 
  SET display_name = new_display_name,
      updated_at = NOW()
  WHERE id = current_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Display name updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policy examples for users table (if not already created)
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data  
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow reading public profile data (optional)
CREATE POLICY "Public profiles readable" ON users
  FOR SELECT USING (
    -- Only allow reading specific public fields
    true -- You can add conditions here for public vs private profiles
  );

-- 9. Safe query for getting user display names in app context
-- This query respects RLS and only returns data the user can access
WITH user_context AS (
  SELECT auth.uid() as current_user_id
)
SELECT 
  u.id,
  u.display_name,
  u.avatar_url,
  CASE 
    WHEN u.id = uc.current_user_id THEN u.email
    ELSE NULL 
  END as email  -- Only show email for current user
FROM users u
CROSS JOIN user_context uc
WHERE u.id = uc.current_user_id;
