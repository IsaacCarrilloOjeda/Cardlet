-- ── Migration 002: Admin Features ────────────────────────────────────────────

-- Allow admin-created sets to have no owner
ALTER TABLE study_sets ALTER COLUMN user_id DROP NOT NULL;

-- ── Study Materials ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_materials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  subject     TEXT,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   BIGINT,
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public materials readable" ON study_materials
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

-- ── Feedback ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type       TEXT NOT NULL CHECK (type IN ('bug', 'feature')),
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admin reads/updates all feedback via service-role key (bypasses RLS automatically)
