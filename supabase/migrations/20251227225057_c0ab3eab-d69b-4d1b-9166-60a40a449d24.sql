-- Create table for support questions
CREATE TABLE public.support_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_telegram_id BIGINT NOT NULL,
  user_profile_id UUID REFERENCES public.profiles(id),
  question TEXT NOT NULL,
  answer TEXT,
  answered_by_telegram_id BIGINT,
  admin_message_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.support_questions ENABLE ROW LEVEL SECURITY;

-- Service role only policy
CREATE POLICY "Service role only" ON public.support_questions
  FOR ALL USING (false) WITH CHECK (true);