-- ============================================================================
-- 077: Row-level security policies for the tables created in 076
-- ============================================================================
--
-- Scope: ONLY the seven tables that 076 actually created. Verified against
-- the live database on 2026-10-16 (pg_class.relrowsecurity + pg_attribute).
--
--   created by 076, RLS on, 0 policies  -> handled here
--     cron_job_logs, itinerary_rsvps, mentions, reports,
--     support_tickets, ticket_notes, webhook_logs
--
--   pre-existing, already carry their own policies -> NOT TOUCHED
--     businesses (5), promotions (4), promotion_metrics (3),
--     user_search_history (2), verification_codes (1)
--
-- The first version of this file also wrote policies for those five. That
-- was wrong twice over: it referenced promotions.user_id, which does not
-- exist (promotions is owned through business_id alone), aborting the whole
-- transaction; and even had it run, its policies would have OR'd together
-- with the existing ones and silently widened access. Permissive policies
-- are additive — adding one never restricts.
--
-- Of the seven, only four are reachable from a browser. ticket_notes,
-- webhook_logs and cron_job_logs deliberately get NO policy: they are
-- service-role only, and the service role bypasses RLS. RLS on with zero
-- policies is exactly what denies everyone else.
--
-- Safe to re-run: every policy is dropped before it is created.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- itinerary_rsvps  (id, itinerary_id, user_id, response, created_at, updated_at)
-- A guest manages their own RSVP; the host sees every RSVP on their trip.
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
-- mentions  (id, user_id, mentioned_user_id, itinerary_id, activity_id,
--            business_id, context, created_at)
-- The author and the mentioned user can see a mention.
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
-- reports  (id, reporter_id, reported_user_id, itinerary_id, comment_id,
--           reason, description, status, resolution_note, resolved_by,
--           resolved_at, created_at)
-- A reporter files and sees their own report. No UPDATE policy: a reporter
-- must not be able to edit status or resolution_note. The moderation queue
-- runs through the service role.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reporters can view their own reports" ON reports;
CREATE POLICY "Reporters can view their own reports"
  ON reports FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can file reports" ON reports;
CREATE POLICY "Users can file reports"
  ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- support_tickets  (id, user_id, email, subject, message, status, priority,
--                   assigned_to, created_at, updated_at)
-- A user opens and reads their own tickets. No UPDATE policy: status,
-- priority and assigned_to are staff fields.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can open a ticket" ON support_tickets;
CREATE POLICY "Users can open a ticket"
  ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ticket_notes, webhook_logs, cron_job_logs
--
-- No policies, by design. Internal staff notes must not leak to the person
-- who filed the ticket; a browser must never read a webhook payload or the
-- job log. All three are service-role only.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Grants. RLS decides which rows are visible, but the role still needs the
-- table-level privilege for the policies above to be reachable at all.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_rsvps TO authenticated;
GRANT SELECT, INSERT, DELETE          ON mentions        TO authenticated;
GRANT SELECT, INSERT                  ON reports         TO authenticated;
GRANT SELECT, INSERT                  ON support_tickets TO authenticated;
