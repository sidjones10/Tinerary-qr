-- ============================================================================
-- 077: Row-level security policies for the tables adopted in 076
-- ============================================================================
--
-- 076 enables RLS on twelve tables. RLS with no policy denies everything to
-- the anon and authenticated roles, so the policies must land with it.
--
-- Default posture: deny. Users reach only their own rows; anything
-- operational (moderation queues, webhook and cron logs, verification codes)
-- is service-role only, which bypasses RLS and is never exposed to a browser.
--
-- Policies are dropped first so this migration is re-runnable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- businesses — an owner reads and writes their own row.
-- Note: api_key lives on this table, so there is deliberately no public
-- SELECT policy. The enterprise API must look keys up with the service role.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners can view their business" ON businesses;
CREATE POLICY "Owners can view their business"
  ON businesses FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert their business" ON businesses;
CREATE POLICY "Owners can insert their business"
  ON businesses FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their business" ON businesses;
CREATE POLICY "Owners can update their business"
  ON businesses FOR UPDATE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- promotions — active promotions are public; owners manage their own.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Business owners can view their promotions" ON promotions;
CREATE POLICY "Business owners can view their promotions"
  ON promotions FOR SELECT USING (
    user_id = auth.uid()
    OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Business owners can insert promotions" ON promotions;
CREATE POLICY "Business owners can insert promotions"
  ON promotions FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Business owners can update their promotions" ON promotions;
CREATE POLICY "Business owners can update their promotions"
  ON promotions FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Business owners can delete their promotions" ON promotions;
CREATE POLICY "Business owners can delete their promotions"
  ON promotions FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- promotion_metrics — readable alongside a promotion the caller can see.
-- Counters are incremented server-side, so there is no client write policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Metrics visible with their promotion" ON promotion_metrics;
CREATE POLICY "Metrics visible with their promotion"
  ON promotion_metrics FOR SELECT USING (
    promotion_id IN (
      SELECT id FROM promotions
      WHERE status = 'active'
         OR business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- itinerary_rsvps — a user manages their own RSVP; the host sees all of theirs.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view RSVPs they can access" ON itinerary_rsvps;
CREATE POLICY "Users can view RSVPs they can access"
  ON itinerary_rsvps FOR SELECT USING (
    user_id = auth.uid()
    OR itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create their own RSVP" ON itinerary_rsvps;
CREATE POLICY "Users can create their own RSVP"
  ON itinerary_rsvps FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own RSVP" ON itinerary_rsvps;
CREATE POLICY "Users can update their own RSVP"
  ON itinerary_rsvps FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own RSVP" ON itinerary_rsvps;
CREATE POLICY "Users can delete their own RSVP"
  ON itinerary_rsvps FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- mentions — the author and the mentioned user can see a mention.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view mentions" ON mentions;
CREATE POLICY "Participants can view mentions"
  ON mentions FOR SELECT USING (
    user_id = auth.uid() OR mentioned_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create mentions" ON mentions;
CREATE POLICY "Users can create mentions"
  ON mentions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their mentions" ON mentions;
CREATE POLICY "Authors can delete their mentions"
  ON mentions FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — a reporter can file and see their own report. The moderation
-- queue is admin-only and runs through the service role.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reporters can view their own reports" ON reports;
CREATE POLICY "Reporters can view their own reports"
  ON reports FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can file reports" ON reports;
CREATE POLICY "Users can file reports"
  ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- support_tickets / ticket_notes — a user sees their own tickets. Internal
-- notes are staff-only, so ticket_notes gets no policy at all (service role
-- only), which is deliberate: notes must not leak to the reporter.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can open a ticket" ON support_tickets;
CREATE POLICY "Users can open a ticket"
  ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- user_search_history — strictly the owner's own rows.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own search history" ON user_search_history;
CREATE POLICY "Users can view their own search history"
  ON user_search_history FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can record their own searches" ON user_search_history;
CREATE POLICY "Users can record their own searches"
  ON user_search_history FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can clear their own search history" ON user_search_history;
CREATE POLICY "Users can clear their own search history"
  ON user_search_history FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- verification_codes, webhook_logs, cron_job_logs
--
-- No policies by design. A browser must never read an OTP, a webhook payload,
-- or the job log. All access goes through the service role, which bypasses
-- RLS; leaving RLS on with zero policies is what denies everyone else.
-- ---------------------------------------------------------------------------

-- Grants: RLS decides row visibility, but the roles still need table-level
-- privileges for the policies above to be reachable.
GRANT SELECT, INSERT, UPDATE ON businesses TO authenticated;
GRANT SELECT ON promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON promotions TO authenticated;
GRANT SELECT ON promotion_metrics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_rsvps TO authenticated;
GRANT SELECT, INSERT, DELETE ON mentions TO authenticated;
GRANT SELECT, INSERT ON reports TO authenticated;
GRANT SELECT, INSERT ON support_tickets TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_search_history TO authenticated;
