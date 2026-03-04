-- Add missing SELECT RLS policy on the businesses table.
--
-- The businesses table has RLS enabled but no SELECT policy for
-- authenticated users. This means client-side queries (using the
-- anon key) silently return no rows, causing:
--   - Duplicate business creation (can't detect existing row)
--   - Business profile page can't load business data
--   - Settings page falls back to stale sessionStorage flags
--
-- This migration adds a SELECT policy so business owners can
-- read their own row via the anon key (client-side Supabase).

-- Ensure RLS is enabled (idempotent)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own business
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (user_id = auth.uid());

-- Also add UPDATE policy so owners can edit their own business
CREATE POLICY "Users can update their own business"
  ON businesses FOR UPDATE
  USING (user_id = auth.uid());
