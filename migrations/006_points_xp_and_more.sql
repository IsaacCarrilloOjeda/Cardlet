-- ── Migration 006: Points, XP, Card Images, Study Buddy ────────────────────

-- ── Points & XP on profiles ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points_earned BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp            BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- Atomic add-points RPC. Caller passes both points (leaderboard) and xp (level).
CREATE OR REPLACE FUNCTION add_points_and_xp(uid UUID, p_points INT, p_xp INT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE profiles
     SET points_earned = points_earned + GREATEST(p_points, 0),
         xp            = xp            + GREATEST(p_xp,     0)
   WHERE id = uid;
$$;

GRANT EXECUTE ON FUNCTION add_points_and_xp(UUID, INT, INT) TO authenticated;

-- ── Updated leaderboard formula: include points_earned ────────────────────
DROP FUNCTION IF EXISTS get_leaderboard_v2(TEXT, TEXT, INT);
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
  points_earned BIGINT,
  xp            BIGINT,
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
      p.points_earned, p.xp,
      (p.streak * 50
       + COUNT(DISTINCT s.id) * 30
       + COUNT(DISTINCT ucp.card_id) * 8
       + p.points_earned)            AS score
    FROM profiles p
    LEFT JOIN study_sets         s   ON s.user_id   = p.id
    LEFT JOIN user_card_progress ucp ON ucp.user_id = p.id
    WHERE p.username IS NOT NULL
      AND (subject_filter IS NULL OR p.id IN (
        SELECT user_id FROM study_sets
        WHERE LOWER(subject) = LOWER(subject_filter) AND user_id IS NOT NULL
      ))
    GROUP BY p.id, p.username, p.is_private, p.role, p.streak,
             p.quiz_correct, p.quiz_attempts, p.points_earned, p.xp
  )
  SELECT * FROM base
  ORDER BY
    CASE mode
      WHEN 'streak'        THEN streak::numeric
      WHEN 'cards_studied' THEN cards_studied::numeric
      WHEN 'xp'            THEN xp::numeric
      WHEN 'quiz_accuracy' THEN
        CASE WHEN quiz_attempts > 0 THEN (quiz_correct::numeric / quiz_attempts * 100) ELSE 0 END
      ELSE score::numeric
    END DESC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_v2(TEXT, TEXT, INT) TO authenticated;

-- ── User-uploaded study materials (non-admin) ─────────────────────────────
-- Reuse the existing study_materials table; just allow user_id to set ownership.
ALTER TABLE study_materials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);

-- Allow users to insert their own materials and read public ones.
DROP POLICY IF EXISTS "Users insert own materials" ON study_materials;
CREATE POLICY "Users insert own materials" ON study_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public materials readable" ON study_materials;
CREATE POLICY "Public materials readable" ON study_materials
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- ── Study Buddy live sessions (multiplayer) ───────────────────────────────
CREATE TABLE IF NOT EXISTS buddy_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id      UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  host_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at   TIMESTAMPTZ
);

ALTER TABLE buddy_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read buddy sessions" ON buddy_sessions;
CREATE POLICY "Anyone can read buddy sessions" ON buddy_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Host can create buddy sessions" ON buddy_sessions;
CREATE POLICY "Host can create buddy sessions" ON buddy_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Host can close buddy sessions" ON buddy_sessions;
CREATE POLICY "Host can close buddy sessions" ON buddy_sessions
  FOR UPDATE USING (auth.uid() = host_id);
