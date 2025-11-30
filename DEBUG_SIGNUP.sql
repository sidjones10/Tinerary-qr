-- Run these queries in Supabase SQL Editor to debug the signup issue

-- 1. Check if the trigger exists
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'create_profile_trigger';

-- 2. Check if the function exists
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_profile_for_user';

-- 3. Check the profiles table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check for any constraints on profiles table
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'profiles';

-- 5. Check recent auth.users entries
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if those users have profiles
SELECT
    u.id,
    u.email as user_email,
    p.id as profile_id,
    p.email as profile_email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
