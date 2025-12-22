-- Fix profile creation race condition
-- This migration creates a unified trigger that handles BOTH users and profiles table inserts
-- preventing race conditions between client-side and database-side insertions

-- ============================================================================
-- STEP 1: DROP EXISTING TRIGGERS AND FUNCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- STEP 2: CREATE UNIFIED USER CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevents errors if already exists

  -- Insert into profiles table
  INSERT INTO public.profiles (id, name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevents errors if already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE TRIGGER ON AUTH.USERS
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Profile creation race condition fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Unified trigger handles both users and profiles tables';
  RAISE NOTICE '  ✓ ON CONFLICT DO NOTHING prevents race condition errors';
  RAISE NOTICE '  ✓ SECURITY DEFINER ensures proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'The trigger now automatically creates entries in both:';
  RAISE NOTICE '  - public.users table';
  RAISE NOTICE '  - public.profiles table';
  RAISE NOTICE '';
  RAISE NOTICE 'Client-side inserts can now be safely removed.';
  RAISE NOTICE '';
END $$;
