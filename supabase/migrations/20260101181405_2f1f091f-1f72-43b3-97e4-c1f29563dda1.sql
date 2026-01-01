-- Update the recalculate_user_badges function to make badges progressive
-- (remove lower tier badges when higher tier is achieved)
CREATE OR REPLACE FUNCTION public.recalculate_user_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_articles_count int;
  v_reputation int;
  v_paying_referrals int;
BEGIN
  -- Get article count
  SELECT COUNT(*) INTO v_articles_count
  FROM articles
  WHERE author_id = p_user_id AND status = 'approved';

  -- Get reputation
  SELECT COALESCE(reputation, 0) INTO v_reputation
  FROM profiles
  WHERE id = p_user_id;

  -- Get paying referrals count
  SELECT COUNT(DISTINCT referred_id) INTO v_paying_referrals
  FROM referral_earnings
  WHERE referrer_id = p_user_id;

  -- Publication badges (PROGRESSIVE - only keep highest tier)
  -- Remove all automatic publication badges first, then add the appropriate one
  DELETE FROM user_badges 
  WHERE user_profile_id = p_user_id 
    AND badge IN ('author', 'experienced_author', 'legend') 
    AND is_manual = false;

  IF v_articles_count >= 30 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'legend', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_articles_count >= 10 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'experienced_author', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_articles_count >= 3 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'author', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  END IF;

  -- Reputation badges (PROGRESSIVE - only keep highest tier)
  DELETE FROM user_badges 
  WHERE user_profile_id = p_user_id 
    AND badge IN ('man', 'expert', 'sage') 
    AND is_manual = false;

  IF v_reputation >= 1000 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'sage', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_reputation >= 200 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'expert', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_reputation >= 50 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'man', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  END IF;

  -- Referral badges (PROGRESSIVE - only keep highest tier)
  DELETE FROM user_badges 
  WHERE user_profile_id = p_user_id 
    AND badge IN ('referrer', 'hustler', 'ambassador') 
    AND is_manual = false;

  IF v_paying_referrals >= 20 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'ambassador', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_paying_referrals >= 10 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'hustler', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  ELSIF v_paying_referrals >= 5 THEN
    INSERT INTO user_badges (user_profile_id, badge, is_manual)
    VALUES (p_user_id, 'referrer', false)
    ON CONFLICT (user_profile_id, badge) DO NOTHING;
  END IF;
END;
$$;