-- Query to get all users with their display names
SELECT id, email, name, display_name, created_at 
FROM users 
WHERE display_name IS NOT NULL
ORDER BY display_name;

-- Query to search users by display name (case-insensitive)
SELECT id, email, display_name, avatar_url
FROM users 
WHERE display_name ILIKE '%search_term%'
ORDER BY display_name;

-- Query to update a user's display name
UPDATE users 
SET display_name = 'New Display Name', 
    updated_at = NOW()
WHERE id = 'user_id_here';

-- Query to get user profile with display name for public view
SELECT 
    id,
    display_name,
    avatar_url,
    created_at
FROM users 
WHERE id = 'user_id_here' 
AND display_name IS NOT NULL;

-- Query to check if display name is already taken
SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE display_name = 'desired_display_name' 
    AND id != 'current_user_id'
) AS display_name_exists;
