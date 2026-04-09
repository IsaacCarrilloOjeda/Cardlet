-- ── Migration 003: Leaderboard ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_leaderboard(lim int DEFAULT 10)
RETURNS TABLE (
  user_id    UUID,
  username   TEXT,
  streak     INT,
  set_count  BIGINT,
  card_count BIGINT,
  score      BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.username,
    p.streak,
    COUNT(DISTINCT s.id)                                                    AS set_count,
    COUNT(DISTINCT c.id)                                                    AS card_count,
    (p.streak * 50 + COUNT(DISTINCT s.id) * 30 + COUNT(DISTINCT c.id) * 8) AS score
  FROM profiles p
  LEFT JOIN study_sets s ON s.user_id = p.id
  LEFT JOIN cards      c ON c.set_id  = s.id
  WHERE p.username IS NOT NULL
  GROUP BY p.id, p.username, p.streak
  ORDER BY score DESC
  LIMIT lim;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_leaderboard(int) TO authenticated;
