-- ============================================================================
-- 078: Close three live RLS holes found in the policy audit
-- ============================================================================
--
-- Read from pg_policies on 2026-10-22. Three existing policies were named as
-- if they were scoped to the service role or to an owner, but were created
-- with `TO public` and a `true` predicate. In Postgres, `public` means every
-- role — including `anon`, the key that ships inside the browser bundle.
--
-- The service role bypasses RLS entirely. A policy is never what grants it
-- access, so "Service role can ..." policies are always either a no-op or,
-- as here, a hole.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. verification_codes — CRITICAL, account takeover
--
-- "Service role can manage verification codes": FOR ALL, TO public,
-- USING (true). Any holder of the anon key could
--     select phone, code from verification_codes
-- and read every live OTP. Request a code for any phone number, read it
-- straight out of the table, verify as that person.
--
-- Only backend/services/auth.ts touches this table, through the service-role
-- key. Nothing in the browser reads it. Correct state is zero policies: RLS
-- on with no policy denies anon and authenticated, and the service role is
-- unaffected.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can manage verification codes" ON verification_codes;

REVOKE ALL ON verification_codes FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. businesses — CRITICAL, credential disclosure
--
-- "Businesses are viewable by everyone": FOR SELECT, TO public, USING (true).
-- businesses holds api_key, the bearer credential for /api/enterprise/*.
-- Any holder of the anon key could read every business's key and then call
-- the enterprise analytics and reports endpoints as that business.
--
-- The owner-scoped "Users can view their own business" policy already exists
-- and becomes the operative one once this is dropped. Phase 2 is disabled
-- (lib/phase2.ts), so no public business directory is live today.
--
-- BEFORE ENABLING PHASE 2: a public directory needs a view over businesses
-- that excludes api_key, not a blanket SELECT policy back on this table.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON businesses;

-- Two UPDATE policies express the identical rule (one predates migration 058,
-- one came from it). Keep the singular-named one.
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;

-- ---------------------------------------------------------------------------
-- 3. promotion_metrics — integrity, ranking manipulation
--
-- "System can update promotion metrics": FOR UPDATE, TO public, USING (true),
-- plus an unrestricted INSERT. Any anon caller could inflate views, clicks
-- and ctr on any promotion, including a competitor's.
--
-- No application code writes this table from a browser — lib/supabase-client.ts
-- recordPromotionView() is an empty stub. Writes belong to the service role.
-- Public SELECT is kept: these are counters on public promotions.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can update promotion metrics" ON promotion_metrics;
DROP POLICY IF EXISTS "System can insert promotion metrics" ON promotion_metrics;

REVOKE INSERT, UPDATE, DELETE ON promotion_metrics FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Missing DELETE policies
--
-- promotions had SELECT/INSERT/UPDATE but no DELETE, so deleteDeal() in
-- app/actions/promotion-actions.ts silently affected zero rows. Mirrors the
-- existing ownership predicate exactly.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Business owners can delete their own promotions" ON promotions;
CREATE POLICY "Business owners can delete their own promotions" ON promotions FOR DELETE USING ( EXISTS ( SELECT 1 FROM businesses b WHERE b.id = promotions.business_id AND b.user_id = auth.uid() ) );

GRANT DELETE ON promotions TO authenticated;

-- user_search_history had no DELETE policy, so a user could not clear their
-- own search history — awkward next to the GDPR export/erasure flow.
DROP POLICY IF EXISTS "Users can clear own search history" ON user_search_history;
CREATE POLICY "Users can clear own search history" ON user_search_history FOR DELETE USING (auth.uid() = user_id);

GRANT DELETE ON user_search_history TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. public.users — CRITICAL, bulk email disclosure
--
-- RLS was never enabled on this table in any migration, and the Supabase
-- dashboard reports it UNRESTRICTED. It holds id + email for every account,
-- and is read from client components with the anon key
-- (components/settings-form.tsx, components/privacy-settings.tsx), so a
-- plain `select * from users` returns the full email list to anyone.
--
-- Scoped to the caller's own row. The only two functions that looked up by
-- another column — getUserByEmail and getUserByPhone in
-- backend/models/user.ts — have zero callers and should be deleted.
--
-- NOTE: public.users is a strict subset of profiles and looks vestigial.
-- Retiring it is the better long-term fix than maintaining policies on it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own row" ON public.users;
CREATE POLICY "Users can view their own row" ON public.users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own row" ON public.users;
CREATE POLICY "Users can insert their own row" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own row" ON public.users;
CREATE POLICY "Users can update their own row" ON public.users FOR UPDATE USING (id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
REVOKE ALL ON public.users FROM anon;
