-- ── Migration 004: Privacy, Roles, Quiz Accuracy ─────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_private    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role          TEXT    NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS quiz_correct  BIGINT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_attempts BIGINT  NOT NULL DEFAULT 0;

-- Leaderboard v2: multiple modes, privacy masking, subject filter
CREATE OR REPLACE FUNCTION get_leaderboard_v2(
  mode           TEXT DEFAULT 'score',
  subject_filter TEXT DEFAULT NULL,
  lim            INT  DEFAULT 10
)
RETURNS TABLE (
  user_id       UUID,
  display_name  TEXT,
  avatar_url    TEXT,
  is_private    BOOLEAN,
  role          TEXT,
  streak        INT,
  set_count     BIGINT,
  cards_studied BIGINT,
  quiz_correct  BIGINT,
  quiz_attempts BIGINT,
  score         BIGINT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      CASE WHEN p.is_private THEN 'user' || LEFT(p.id::text, 6) ELSE p.username END AS display_name,
      CASE WHEN p.is_private THEN NULL ELSE p.avatar_url END AS avatar_url,
      p.is_private, p.role, p.streak,
      COUNT(DISTINCT s.id)         AS set_count,
      COUNT(DISTINCT ucp.card_id)  AS cards_studied,
      p.quiz_correct, p.quiz_attempts,
      (p.streak * 50 + COUNT(DISTINCT s.id) * 30 + COUNT(DISTINCT ucp.card_id) * 8) AS score
    FROM profiles p
    LEFT JOIN study_sets         s   ON s.user_id   = p.id
    LEFT JOIN user_card_progress ucp ON ucp.user_id = p.id
    WHERE p.username IS NOT NULL
      AND (subject_filter IS NULL OR p.id IN (
        SELECT user_id FROM study_sets
        WHERE LOWER(subject) = LOWER(subject_filter) AND user_id IS NOT NULL
      ))
    GROUP BY p.id, p.username, p.is_private, p.role, p.streak, p.quiz_correct, p.quiz_attempts
  )
  SELECT * FROM base
  ORDER BY
    CASE mode
      WHEN 'streak'        THEN streak::numeric
      WHEN 'cards_studied' THEN cards_studied::numeric
      WHEN 'quiz_accuracy' THEN
        CASE WHEN quiz_attempts > 0 THEN (quiz_correct::numeric / quiz_attempts * 100) ELSE 0 END
      ELSE score::numeric
    END DESC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_v2(TEXT, TEXT, INT) TO authenticated;

-- Distinct subjects from public sets (for leaderboard filter dropdown)
CREATE OR REPLACE FUNCTION get_distinct_subjects()
RETURNS TABLE (subject TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT subject FROM study_sets
  WHERE subject IS NOT NULL AND subject <> '' AND is_public = true
  ORDER BY subject;
$$;

GRANT EXECUTE ON FUNCTION get_distinct_subjects() TO authenticated;

-- Atomic quiz stat increment (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_quiz_stats(uid UUID, correct_delta INT, attempts_delta INT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE profiles
  SET quiz_correct  = quiz_correct  + correct_delta,
      quiz_attempts = quiz_attempts + attempts_delta
  WHERE id = uid;
$$;

GRANT EXECUTE ON FUNCTION increment_quiz_stats(UUID, INT, INT) TO authenticated;

-- Allow authenticated users to read any profile (needed for /users/[userId])
DROP POLICY IF EXISTS "Anyone can read public profiles" ON profiles;
CREATE POLICY "Anyone can read public profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
