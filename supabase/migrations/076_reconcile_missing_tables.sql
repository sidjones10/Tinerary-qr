-- ============================================================================
-- 076: Reconcile tables that exist only in the live database
-- ============================================================================
--
-- Twelve tables were queried by application code but had no CREATE TABLE
-- anywhere in version control — they were created by hand in the Supabase
-- dashboard. That made the database impossible to rebuild from this repo:
-- no staging environment, no disaster recovery, no reviewable schema history.
--
-- Every statement here is idempotent (IF NOT EXISTS), so this is safe to run
-- against the existing production database: it adopts the tables that are
-- already there and creates the ones that are missing. An existing column is
-- never altered.
--
-- Column definitions were reconstructed from two sources: lib/database.types.ts
-- where the table appears there (businesses, promotions, promotion_metrics),
-- and otherwise from the queries in app/ and lib/. Neither is a dump, so this
-- is a best reconstruction, not a guarantee — verify it (see below).
--
-- After applying, run `supabase db dump --schema public` and diff against
-- this file to confirm the repo now matches reality.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- businesses
-- Referenced by: business-actions, admin/businesses, enterprise/*, promotions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  website TEXT,
  logo TEXT,
  category TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Columns added by later features; separate so this adopts an existing table.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_tier TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS branding_config JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS account_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS report_config JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS enterprise_badge_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS priority_placement BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS unlimited_mentions BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mention_highlights_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mention_highlights_reset_at TIMESTAMP WITH TIME ZONE;

-- The enterprise API authenticates with a per-business key. These were
-- referenced by app/api/enterprise/* but existed in no migration, so every
-- enterprise request failed its key lookup.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS api_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_api_key
  ON businesses (api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses (user_id);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- promotions / promotion_metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  category TEXT,
  location TEXT,
  image TEXT,
  price NUMERIC(10, 2),
  original_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  discount INTEGER,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'rejected', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  subcategory TEXT,
  images TEXT[],
  tags TEXT[],
  features JSONB,
  rank_score NUMERIC(10, 4) NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  max_capacity INTEGER,
  available_capacity INTEGER,
  clicks INTEGER NOT NULL DEFAULT 0,
  priority_placement BOOLEAN NOT NULL DEFAULT false,
  enterprise_badge_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions (business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions (status);
CREATE INDEX IF NOT EXISTS idx_promotions_rank ON promotions (rank_score DESC);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS promotion_metrics (
  promotion_id UUID PRIMARY KEY REFERENCES promotions(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(6, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promotion_metrics_updated_at
  ON promotion_metrics (updated_at DESC);

ALTER TABLE promotion_metrics ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- itinerary_rsvps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itinerary_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (itinerary_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_rsvps_itinerary
  ON itinerary_rsvps (itinerary_id);

ALTER TABLE itinerary_rsvps ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- mentions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentioned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user
  ON mentions (mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions (created_at DESC);

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- reports (user/content reports surfaced in the admin moderation queue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  comment_id UUID,
  reason TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- support_tickets / ticket_notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket_id ON ticket_notes (ticket_id);

ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- user_search_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT,
  location_extracted TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_search_history_user
  ON user_search_history (user_id, created_at DESC);

ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- verification_codes (phone verification)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes (phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires
  ON verification_codes (expires_at);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- webhook_logs / cron_job_logs (admin observability)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT,
  event_type TEXT,
  status TEXT,
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at
  ON webhook_logs (created_at DESC);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  duration_ms INTEGER,
  error_message TEXT,
  details JSONB,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at
  ON cron_job_logs (executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_id ON cron_job_logs (job_id);

ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Missing columns on activities
--
-- app/actions/itinerary-actions.ts writes these three on every activity
-- create and update, but they were in no migration.
-- ---------------------------------------------------------------------------
ALTER TABLE activities ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;
