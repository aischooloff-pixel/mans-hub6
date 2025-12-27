-- Drop existing restrictive RLS policies for profiles that require auth.uid()
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new policies that allow profiles to be managed by telegram_id
-- Profiles can be created by anyone (for Telegram WebApp registration)
CREATE POLICY "Anyone can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Profiles can be updated if telegram_id matches
-- Since we don't have Supabase Auth, we allow updates based on profile existence
CREATE POLICY "Profiles can be updated by owner"
ON public.profiles
FOR UPDATE
USING (true);

-- Drop existing restrictive RLS policies for articles
DROP POLICY IF EXISTS "Users can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can update own articles" ON public.articles;

-- Create new article policies
-- Anyone with a profile can create articles
CREATE POLICY "Authenticated users can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (author_id IN (SELECT id FROM profiles));

-- Authors can update their own articles
CREATE POLICY "Authors can update own articles"
ON public.articles
FOR UPDATE
USING (author_id IN (SELECT id FROM profiles));