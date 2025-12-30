-- Fix notification triggers to handle null names properly
-- Drop and recreate create_comment_reply_notification
CREATE OR REPLACE FUNCTION public.create_comment_reply_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_parent_author_id uuid;
  v_article_title text;
  v_replier_name text;
BEGIN
  -- Only process replies (comments with parent_id)
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get parent comment author
  SELECT author_id INTO v_parent_author_id
  FROM article_comments
  WHERE id = NEW.parent_id;
  
  -- Don't notify if user replies to their own comment
  IF v_parent_author_id IS NULL OR v_parent_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get article title
  SELECT title INTO v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Get replier name - prioritize username over first_name
  SELECT COALESCE(NULLIF(username, ''), NULLIF(first_name, ''), 'Пользователь') INTO v_replier_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_parent_author_id,
    'reply',
    v_replier_name || ' ответил на ваш комментарий к статье "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '"',
    NEW.article_id,
    NEW.author_id,
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Fix create_like_notification
CREATE OR REPLACE FUNCTION public.create_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_liker_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user likes their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.user_profile_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker name - prioritize username over first_name
  SELECT COALESCE(NULLIF(username, ''), NULLIF(first_name, ''), 'Пользователь') INTO v_liker_name
  FROM profiles
  WHERE id = NEW.user_profile_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'like',
    v_liker_name || ' понравилась ваша статья "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '"',
    NEW.article_id,
    NEW.user_profile_id,
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Fix create_comment_notification
CREATE OR REPLACE FUNCTION public.create_comment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_commenter_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user comments on their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name - prioritize username over first_name
  SELECT COALESCE(NULLIF(username, ''), NULLIF(first_name, ''), 'Пользователь') INTO v_commenter_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'comment',
    v_commenter_name || ' прокомментировал вашу статью "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '"',
    NEW.article_id,
    NEW.author_id,
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Fix create_favorite_notification
CREATE OR REPLACE FUNCTION public.create_favorite_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_article_author_id uuid;
  v_article_title text;
  v_user_name text;
BEGIN
  -- Get article author
  SELECT author_id, title INTO v_article_author_id, v_article_title
  FROM articles
  WHERE id = NEW.article_id;
  
  -- Don't notify if user favorites their own article
  IF v_article_author_id IS NULL OR v_article_author_id = NEW.user_profile_id THEN
    RETURN NEW;
  END IF;
  
  -- Get user name - prioritize username over first_name
  SELECT COALESCE(NULLIF(username, ''), NULLIF(first_name, ''), 'Пользователь') INTO v_user_name
  FROM profiles
  WHERE id = NEW.user_profile_id;
  
  -- Create notification
  INSERT INTO notifications (user_profile_id, type, message, article_id, from_user_id, is_read)
  VALUES (
    v_article_author_id,
    'favorite',
    v_user_name || ' добавил вашу статью "' || COALESCE(LEFT(v_article_title, 30), 'Статья') || '" в избранное',
    NEW.article_id,
    NEW.user_profile_id,
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  suggestions text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by everyone when approved" 
ON public.reviews 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Service role can manage reviews" 
ON public.reviews 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_user ON public.reviews(user_profile_id);