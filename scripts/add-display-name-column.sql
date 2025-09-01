-- Add display_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing users to have display_name based on their name
UPDATE users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Create an index on display_name for better query performance
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Add a comment to document the column
COMMENT ON COLUMN users.display_name IS 'User-chosen display name for public profile';
