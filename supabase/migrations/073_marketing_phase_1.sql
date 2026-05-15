-- Phase 1 marketing rollout: Founders' List, Journal, Issues
-- Supports manifesto homepage, /journal (admin-controlled), /issues (sign-in gated)

-- Founders' List signups
CREATE TABLE IF NOT EXISTS founders_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founders_list_created_at ON founders_list(created_at);

ALTER TABLE founders_list ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authed) can insert
DROP POLICY IF EXISTS "Anyone can join founders list" ON founders_list;
CREATE POLICY "Anyone can join founders list" ON founders_list
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can read the list
DROP POLICY IF EXISTS "Admins can read founders list" ON founders_list;
CREATE POLICY "Admins can read founders list" ON founders_list
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );

-- Journal posts (admin-controlled, publicly readable)
CREATE TABLE IF NOT EXISTS journal_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  dek TEXT,
  body_markdown TEXT NOT NULL,
  cover_image_url TEXT,
  author_name TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_posts_published ON journal_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_posts_slug ON journal_posts(slug);

ALTER TABLE journal_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published journal posts" ON journal_posts;
CREATE POLICY "Anyone can read published journal posts" ON journal_posts
  FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Admins manage journal posts" ON journal_posts;
CREATE POLICY "Admins manage journal posts" ON journal_posts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );

-- Issues (seasonal drops). Readable only to signed-in users.
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  season TEXT,
  cover_image_url TEXT,
  description TEXT,
  release_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_published ON issues(is_published, release_date DESC);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can read published issues" ON issues;
CREATE POLICY "Signed-in users can read published issues" ON issues
  FOR SELECT TO authenticated USING (is_published = true);

DROP POLICY IF EXISTS "Admins manage issues" ON issues;
CREATE POLICY "Admins manage issues" ON issues
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = 'admin')
    )
  );
