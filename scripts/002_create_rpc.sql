-- Create RPC function for updating user stats after a match
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_kills INT,
  p_deaths INT,
  p_assists INT,
  p_elo_change INT,
  p_is_win BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_elo INT;
  new_tier TEXT;
BEGIN
  -- Update user stats
  UPDATE users
  SET 
    total_kills = total_kills + p_kills,
    total_deaths = total_deaths + p_deaths,
    total_assists = total_assists + p_assists,
    matches_played = matches_played + 1,
    wins = wins + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    elo = GREATEST(0, elo + p_elo_change),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING elo INTO new_elo;

  -- Update rank tier based on ELO
  new_tier := CASE
    WHEN new_elo >= 2500 THEN 'grandmaster'
    WHEN new_elo >= 2200 THEN 'master'
    WHEN new_elo >= 1900 THEN 'diamond'
    WHEN new_elo >= 1600 THEN 'platinum'
    WHEN new_elo >= 1300 THEN 'gold'
    WHEN new_elo >= 1000 THEN 'silver'
    WHEN new_elo >= 700 THEN 'bronze'
    ELSE 'unranked'
  END;

  UPDATE users
  SET rank_tier = new_tier
  WHERE id = p_user_id;
END;
$$;
