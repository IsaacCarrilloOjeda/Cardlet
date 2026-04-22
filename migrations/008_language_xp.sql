-- ── Migration 008: Language XP tracking ────────────────────────────────────

-- Per-language XP per user. Composite PK so a user can have one row per lang.
CREATE TABLE IF NOT EXISTS language_xp (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lang_id    TEXT NOT NULL,
  xp         BIGINT NOT NULL DEFAULT 0,
  lessons    INT    NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lang_id)
);

ALTER TABLE language_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read language xp" ON language_xp;
CREATE POLICY "Anyone can read language xp" ON language_xp
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can upsert own language xp" ON language_xp;
CREATE POLICY "Users can upsert own language xp" ON language_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own language xp" ON language_xp;
CREATE POLICY "Users can update own language xp" ON language_xp
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_language_xp_xp ON language_xp(xp DESC);
CREATE INDEX IF NOT EXISTS idx_language_xp_lang ON language_xp(lang_id);

-- Atomic bump. If delta_lessons is 0 XP only is bumped (e.g. review lessons
-- could use delta_lessons=0 in the future, but currently every call bumps 1).
CREATE OR REPLACE FUNCTION bump_language_xp(
  uid           UUID,
  p_lang_id     TEXT,
  delta_xp      INT,
  delta_lessons INT DEFAULT 1
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO language_xp (user_id, lang_id, xp, lessons, updated_at)
  VALUES (uid, p_lang_id, GREATEST(delta_xp, 0), GREATEST(delta_lessons, 0), now())
  ON CONFLICT (user_id, lang_id)
  DO UPDATE SET
    xp         = language_xp.xp      + GREATEST(EXCLUDED.xp, 0),
    lessons    = language_xp.lessons + GREATEST(EXCLUDED.lessons, 0),
    updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION bump_language_xp(UUID, TEXT, INT, INT) TO authenticated;

-- One-shot migration from localStorage: sets absolute values. Used only by the
-- client-side one-time migration path so a user's existing offline XP snaps in.
CREATE OR REPLACE FUNCTION set_language_xp_if_greater(
  uid        UUID,
  p_lang_id  TEXT,
  p_xp       INT,
  p_lessons  INT
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO language_xp (user_id, lang_id, xp, lessons, updated_at)
  VALUES (uid, p_lang_id, GREATEST(p_xp, 0), GREATEST(p_lessons, 0), now())
  ON CONFLICT (user_id, lang_id)
  DO UPDATE SET
    xp         = GREATEST(language_xp.xp,      EXCLUDED.xp),
    lessons    = GREATEST(language_xp.lessons, EXCLUDED.lessons),
    updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION set_language_xp_if_greater(UUID, TEXT, INT, INT) TO authenticated;

-- ── Language leaderboard RPC ──────────────────────────────────────────────
-- Returns top users for a given lang_id. Respects profile privacy like the
-- main leaderboard — private users get an anon display name.
DROP FUNCTION IF EXISTS get_language_leaderboard(TEXT, INT);
CREATE OR REPLACE FUNCTION get_language_leaderboard(
  p_lang_id TEXT,
  lim       INT DEFAULT 20
)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  avatar_url   TEXT,
  is_private   BOOLEAN,
  role         TEXT,
  streak       INT,
  xp           BIGINT,
  lessons      INT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    lx.user_id,
    CASE WHEN p.is_private THEN 'user' || LEFT(p.id::text, 6) ELSE p.username END AS display_name,
    CASE WHEN p.is_private THEN NULL ELSE p.avatar_url END AS avatar_url,
    p.is_private,
    p.role,
    p.streak,
    lx.xp,
    lx.lessons
  FROM language_xp lx
  JOIN profiles p ON p.id = lx.user_id
  WHERE lx.lang_id = p_lang_id
    AND p.username IS NOT NULL
  ORDER BY lx.xp DESC, lx.lessons DESC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION get_language_leaderboard(TEXT, INT) TO authenticated;
