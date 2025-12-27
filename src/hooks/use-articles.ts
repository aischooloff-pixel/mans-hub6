import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './use-profile';
import { toast } from 'sonner';

export interface Article {
  id: string;
  author_id: string | null;
  category_id: string | null;
  title: string;
  preview: string | null;
  body: string;
  media_url: string | null;
  media_type: string | null;
  is_anonymous: boolean | null;
  status: string | null;
  rejection_reason: string | null;
  likes_count: number | null;
  comments_count: number | null;
  favorites_count: number | null;
  rep_score: number | null;
  allow_comments: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean | null;
    reputation: number | null;
  } | null;
}

export interface CreateArticleData {
  category_id: string;
  title: string;
  body: string;
  preview?: string;
  media_url?: string;
  media_type?: 'image' | 'youtube';
  is_anonymous?: boolean;
  allow_comments?: boolean;
  sources?: string[];
}

export function useArticles() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);

  // Get approved articles
  const getApprovedArticles = useCallback(async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          author:author_id(id, first_name, last_name, username, avatar_url, is_premium, reputation)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Article[];
    } catch (err) {
      console.error('Error fetching articles:', err);
      return [];
    }
  }, []);

  // Get user's articles
  const getUserArticles = useCallback(async () => {
    if (!profile?.id) return [];

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Article[];
    } catch (err) {
      console.error('Error fetching user articles:', err);
      return [];
    }
  }, [profile?.id]);

  // Create article
  const createArticle = useCallback(async (articleData: CreateArticleData) => {
    if (!profile?.id) {
      toast.error('Необходимо авторизоваться');
      return null;
    }

    setLoading(true);
    try {
      // Generate preview from body if not provided
      const preview = articleData.preview || articleData.body.substring(0, 200);

      // Determine media type from URL
      let mediaType = articleData.media_type;
      if (articleData.media_url && !mediaType) {
        if (articleData.media_url.includes('youtube.com') || articleData.media_url.includes('youtu.be')) {
          mediaType = 'youtube';
        } else {
          mediaType = 'image';
        }
      }

      const { data: article, error } = await supabase
        .from('articles')
        .insert({
          author_id: profile.id,
          category_id: articleData.category_id || null,
          title: articleData.title,
          body: articleData.body,
          preview: preview,
          media_url: articleData.media_url || null,
          media_type: mediaType || null,
          is_anonymous: articleData.is_anonymous || false,
          allow_comments: articleData.allow_comments !== false,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating article:', error);
        throw error;
      }

      // Send moderation request
      try {
        await supabase.functions.invoke('send-moderation', {
          body: { articleId: article.id },
        });
      } catch (modError) {
        console.error('Error sending moderation request:', modError);
        // Don't fail the whole operation if moderation request fails
      }

      toast.success('Статья отправлена на модерацию');
      return article;
    } catch (err: any) {
      console.error('Error creating article:', err);
      toast.error(err.message || 'Ошибка создания статьи');
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Update article
  const updateArticle = useCallback(async (articleId: string, updates: Partial<CreateArticleData>) => {
    if (!profile?.id) {
      toast.error('Необходимо авторизоваться');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          ...updates,
          status: 'pending', // Re-submit for moderation
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .eq('author_id', profile.id);

      if (error) throw error;

      // Send moderation request
      try {
        await supabase.functions.invoke('send-moderation', {
          body: { articleId },
        });
      } catch (modError) {
        console.error('Error sending moderation request:', modError);
      }

      toast.success('Статья обновлена и отправлена на модерацию');
      return true;
    } catch (err: any) {
      console.error('Error updating article:', err);
      toast.error(err.message || 'Ошибка обновления статьи');
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  return {
    loading,
    getApprovedArticles,
    getUserArticles,
    createArticle,
    updateArticle,
  };
}
