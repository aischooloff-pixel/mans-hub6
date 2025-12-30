-- Add parent_id column for comment replies
ALTER TABLE public.article_comments
ADD COLUMN parent_id uuid REFERENCES public.article_comments(id) ON DELETE CASCADE;

-- Create index for faster reply lookups
CREATE INDEX idx_article_comments_parent_id ON public.article_comments(parent_id);

-- Create function for reply notifications
CREATE OR REPLACE FUNCTION public.create_comment_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_author_id uuid;
  v_article_title text;
  v_replier_name text;
  v_article_id uuid;
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
  
  -- Get replier name
  SELECT COALESCE(first_name, username, 'Кто-то') INTO v_replier_name
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for reply notifications
CREATE TRIGGER on_comment_reply_notification
  AFTER INSERT ON public.article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_reply_notification();