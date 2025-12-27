import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './use-telegram';

export interface Profile {
  id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  reputation: number;
  is_premium: boolean;
  telegram_channel: string | null;
  website: string | null;
  created_at: string | null;
}

export function useProfile() {
  const { user: tgUser, webApp } = useTelegram();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articlesCount, setArticlesCount] = useState(0);

  // Sync profile with Telegram data
  const syncProfile = useCallback(async () => {
    if (!tgUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get photo URL from Telegram WebApp
      let photoUrl = tgUser.photo_url;
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        // Update existing profile with latest Telegram data
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            username: tgUser.username || existingProfile.username,
            first_name: tgUser.first_name || existingProfile.first_name,
            last_name: tgUser.last_name || existingProfile.last_name,
            avatar_url: photoUrl || existingProfile.avatar_url,
            is_premium: tgUser.is_premium || existingProfile.is_premium,
            updated_at: new Date().toISOString(),
          })
          .eq('telegram_id', tgUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        setProfile({
          ...updatedProfile,
          reputation: updatedProfile.reputation || 0,
          is_premium: updatedProfile.is_premium || false,
        });

        // Count user's articles
        const { count } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', updatedProfile.id);
        
        setArticlesCount(count || 0);
      } else {
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            telegram_id: tgUser.id,
            username: tgUser.username || null,
            first_name: tgUser.first_name || 'User',
            last_name: tgUser.last_name || null,
            avatar_url: photoUrl || null,
            is_premium: tgUser.is_premium || false,
            reputation: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        setProfile({
          ...newProfile,
          reputation: 0,
          is_premium: newProfile.is_premium || false,
        });
        setArticlesCount(0);
      }
    } catch (err: any) {
      console.error('Profile sync error:', err);
      setError(err.message || 'Ошибка синхронизации профиля');
    } finally {
      setLoading(false);
    }
  }, [tgUser]);

  // Update social links
  const updateSocialLinks = async (telegramChannel: string, website: string) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_channel: telegramChannel || null,
          website: website || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        telegram_channel: telegramChannel || null,
        website: website || null,
      });

      return true;
    } catch (err) {
      console.error('Error updating social links:', err);
      return false;
    }
  };

  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  return {
    profile,
    loading,
    error,
    articlesCount,
    updateSocialLinks,
    refetch: syncProfile,
  };
}
