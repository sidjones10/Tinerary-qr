-- Organic Mention Highlights
-- Tracks when businesses are mentioned in itinerary activities,
-- and lets businesses purchase highlights (badge + booking link overlays).

-- ─── Business Mentions ───────────────────────────────────────
-- Detected when an activity title, location, or description matches a business name.
CREATE TABLE IF NOT EXISTS business_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  matched_text TEXT NOT NULL,          -- the text snippet that triggered the match
  match_field TEXT NOT NULL DEFAULT 'title', -- title | location | description
  context_snippet TEXT,                -- surrounding text for display
  creator_username TEXT,               -- cached for display
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'highlighted', 'expired', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, itinerary_id, activity_id)
);

-- ─── Mention Highlight Plans ─────────────────────────────────
-- Purchased highlight plan instances (single, bundle, monthly, annual).
CREATE TABLE IF NOT EXISTS mention_highlight_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('single', 'bundle', 'monthly_unlimited', 'annual_unlimited')),
  price_paid INTEGER NOT NULL,         -- cents
  highlights_total INTEGER NOT NULL DEFAULT 1,   -- 1 for single, 5 for bundle, -1 for unlimited
  highlights_used INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Mention Highlights (individual activations) ─────────────
-- One row per highlighted mention; links a mention to a plan.
CREATE TABLE IF NOT EXISTS mention_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mention_id UUID NOT NULL REFERENCES business_mentions(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES mention_highlight_plans(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_url TEXT,                    -- business-supplied booking link
  offer_text TEXT,                     -- optional special offer ("10% off with code TINERARY")
  badge_style TEXT DEFAULT 'default',  -- default | gold | verified
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_business_mentions_business_id ON business_mentions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_mentions_itinerary_id ON business_mentions(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_business_mentions_activity_id ON business_mentions(activity_id);
CREATE INDEX IF NOT EXISTS idx_business_mentions_status ON business_mentions(status);
CREATE INDEX IF NOT EXISTS idx_mention_highlight_plans_business_id ON mention_highlight_plans(business_id);
CREATE INDEX IF NOT EXISTS idx_mention_highlight_plans_status ON mention_highlight_plans(status);
CREATE INDEX IF NOT EXISTS idx_mention_highlights_business_id ON mention_highlights(business_id);
CREATE INDEX IF NOT EXISTS idx_mention_highlights_mention_id ON mention_highlights(mention_id);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE business_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_highlight_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_highlights ENABLE ROW LEVEL SECURITY;

-- Business owners can see their own mentions
CREATE POLICY "Business owners can view their mentions"
  ON business_mentions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Anyone can see highlighted mentions (for rendering overlays on public itineraries)
CREATE POLICY "Anyone can view active highlights"
  ON mention_highlights FOR SELECT
  USING (true);

-- Business owners can manage their own highlight plans
CREATE POLICY "Business owners can view their plans"
  ON mention_highlight_plans FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Business owners can insert mentions (via detection)
CREATE POLICY "Service can insert mentions"
  ON business_mentions FOR INSERT
  WITH CHECK (true);

-- Business owners can update their own mentions
CREATE POLICY "Business owners can update their mentions"
  ON business_mentions FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Insert policies for highlight activation
CREATE POLICY "Business owners can insert highlights"
  ON mention_highlights FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert plans"
  ON mention_highlight_plans FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their plans"
  ON mention_highlight_plans FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ─── Helper: increment highlight click count ─────────────────
CREATE OR REPLACE FUNCTION increment_highlight_click(highlight_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE mention_highlights
  SET click_count = click_count + 1
  WHERE id = highlight_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Helper: increment highlight view count ──────────────────
CREATE OR REPLACE FUNCTION increment_highlight_view(highlight_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE mention_highlights
  SET view_count = view_count + 1
  WHERE id = highlight_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
