-- ── Migration 007: Study Activity Tracking + Set Ratings ─────────────────────

-- ── Study Activity (daily card count for heatmap) ─────────────────────────
CREATE TABLE IF NOT EXISTS study_activity (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  cards_studied INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, activity_date)
);

ALTER TABLE study_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity" ON study_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own activity" ON study_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON study_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- Atomic increment: called alongside every card progress update
CREATE OR REPLACE FUNCTION bump_study_activity(uid UUID, delta INT DEFAULT 1)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO study_activity (user_id, activity_date, cards_studied)
  VALUES (uid, CURRENT_DATE, delta)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET cards_studied = study_activity.cards_studied + EXCLUDED.cards_studied;
$$;

GRANT EXECUTE ON FUNCTION bump_study_activity(UUID, INT) TO authenticated;

-- ── Set Ratings & Comments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS set_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id     UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  stars      INT  NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, set_id)
);

ALTER TABLE set_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings" ON set_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON set_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON set_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON set_ratings
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_set_ratings_set_id ON set_ratings(set_id);
CREATE INDEX IF NOT EXISTS idx_set_ratings_user_id ON set_ratings(user_id);
