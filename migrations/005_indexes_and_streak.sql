-- ── Migration 005: Streak, Indexes, Daily Challenge ─────────────────────────

-- ── Streak infrastructure ───────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Atomic streak bump: called once per study action.
-- Same-day → no change. Yesterday → +1. Older / null → reset to 1.
CREATE OR REPLACE FUNCTION bump_streak(uid UUID)
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE profiles
     SET streak = CASE
           WHEN last_study_date = CURRENT_DATE THEN streak
           WHEN last_study_date = CURRENT_DATE - INTERVAL '1 day' THEN streak + 1
           ELSE 1
         END,
         last_study_date = CURRENT_DATE
   WHERE id = uid
  RETURNING streak;
$$;

GRANT EXECUTE ON FUNCTION bump_streak(UUID) TO authenticated;

-- ── Foreign-key indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_sets_user_id     ON study_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_set_id           ON cards(set_id);
CREATE INDEX IF NOT EXISTS idx_ucp_user_next_review   ON user_card_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_feedback_status        ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id       ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_public_created
  ON study_sets(is_public, created_at DESC)
  WHERE is_public = true;

-- ── Trigram indexes for explore search ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_study_sets_title_trgm
  ON study_sets USING gin (title gin_trgm_ops)
  WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_study_sets_subject_trgm
  ON study_sets USING gin (subject gin_trgm_ops)
  WHERE is_public = true;

-- ── Daily Challenge RPC ────────────────────────────────────────────────────
-- Deterministic: same card for every user per UTC date.
CREATE OR REPLACE FUNCTION get_daily_challenge_card()
RETURNS TABLE (
  id         UUID,
  set_id     UUID,
  front      TEXT,
  back       TEXT,
  set_title  TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.set_id, c.front, c.back, s.title AS set_title
    FROM cards c
    JOIN study_sets s ON s.id = c.set_id
   WHERE s.is_public = true
   ORDER BY md5((CURRENT_DATE::text || c.id::text))
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_daily_challenge_card() TO authenticated;

-- ── Mistake Deck RPC ───────────────────────────────────────────────────────
-- Cards the user has struggled with: low ease factor or recently rated down.
CREATE OR REPLACE FUNCTION get_mistake_cards(uid UUID, lim INT DEFAULT 30)
RETURNS TABLE (
  id             UUID,
  set_id         UUID,
  front          TEXT,
  back           TEXT,
  image_url      TEXT,
  difficulty     INT,
  created_at     TIMESTAMPTZ,
  ease_factor    FLOAT,
  interval_days  INT,
  repetitions    INT,
  next_review_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.set_id, c.front, c.back, c.image_url, c.difficulty, c.created_at,
         ucp.ease_factor, ucp.interval AS interval_days, ucp.repetitions, ucp.next_review_at
    FROM user_card_progress ucp
    JOIN cards c ON c.id = ucp.card_id
   WHERE ucp.user_id = uid
     AND ucp.ease_factor < 2.2
   ORDER BY ucp.ease_factor ASC, ucp.next_review_at ASC
   LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_mistake_cards(UUID, INT) TO authenticated;
