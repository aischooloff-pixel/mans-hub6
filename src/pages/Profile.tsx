import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleListCard } from '@/components/articles/ArticleListCard';
import { SettingsModal } from '@/components/profile/SettingsModal';
import { PremiumModal } from '@/components/profile/PremiumModal';
import { UserArticlesModal } from '@/components/profile/UserArticlesModal';
import { ReputationHistoryModal } from '@/components/profile/ReputationHistoryModal';
import { SocialLinksModal } from '@/components/profile/SocialLinksModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Crown, FileText, Bookmark, History, Star, Send, Globe } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { useArticles, Article } from '@/hooks/use-articles';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, loading: profileLoading, articlesCount, updateSocialLinks } = useProfile();
  const { getUserArticles } = useArticles();
  const [activeTab, setActiveTab] = useState('articles');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isArticlesOpen, setIsArticlesOpen] = useState(false);
  const [isRepHistoryOpen, setIsRepHistoryOpen] = useState(false);
  const [isSocialLinksOpen, setIsSocialLinksOpen] = useState(false);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Load user's articles
  useEffect(() => {
    const loadArticles = async () => {
      if (!profile?.id) return;
      setArticlesLoading(true);
      const articles = await getUserArticles();
      setUserArticles(articles);
      setArticlesLoading(false);
    };
    loadArticles();
  }, [profile?.id, getUserArticles]);

  const handleSaveSocialLinks = async (telegram: string, website: string) => {
    const success = await updateSocialLinks(telegram, website);
    if (success) {
      toast.success('Социальные ссылки обновлены');
      setIsSocialLinksOpen(false);
    } else {
      toast.error('Ошибка сохранения');
    }
  };

  // Convert Article to the format expected by ArticleListCard
  const mapArticleToListFormat = (article: Article) => ({
    id: article.id,
    author_id: article.author_id || '',
    category_id: article.category_id || '',
    topic_id: '',
    title: article.title,
    preview: article.preview || '',
    body: article.body,
    media_url: article.media_url || undefined,
    media_type: article.media_type as 'image' | 'youtube' | undefined,
    is_anonymous: article.is_anonymous || false,
    status: (article.status || 'pending') as 'draft' | 'pending' | 'approved' | 'rejected',
    rejection_reason: article.rejection_reason || undefined,
    likes_count: article.likes_count || 0,
    comments_count: article.comments_count || 0,
    favorites_count: article.favorites_count || 0,
    rep_score: article.rep_score || 0,
    allow_comments: article.allow_comments !== false,
    created_at: article.created_at || '',
    updated_at: article.updated_at || '',
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">Опубликовано</span>;
      case 'pending':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">На модерации</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Отклонено</span>;
      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 pt-16">
        <Header />
        <main className="py-6 px-4">
          <div className="flex items-start gap-4 mb-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-24 pt-16">
        <Header />
        <main className="py-6 px-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Откройте приложение через Telegram бота для авторизации</p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <Header />

      <main className="py-6">
        {/* Profile Header */}
        <section className="mb-6 px-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || profile.first_name}`}
                alt={profile.first_name || 'User'}
                className="h-20 w-20 rounded-full object-cover"
              />
              {profile.is_premium && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Crown className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">@{profile.username || 'user'}</p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => setIsRepHistoryOpen(true)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{profile.reputation} rep</span>
                </button>
                <button
                  onClick={() => setIsArticlesOpen(true)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hover:text-primary">
                    {articlesCount} статей
                  </span>
                </button>
              </div>
              
              {/* Social Links for Premium Users */}
              {profile.is_premium && (
                <div className="mt-3 flex items-center gap-3">
                  {profile.telegram_channel && (
                    <a
                      href={profile.telegram_channel.startsWith('@') 
                        ? `https://t.me/${profile.telegram_channel.slice(1)}` 
                        : profile.telegram_channel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      <span>{profile.telegram_channel}</span>
                    </a>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="max-w-[120px] truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsSocialLinksOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Premium Banner */}
        {!profile.is_premium && (
          <section className="mb-6 px-4">
            <button
              onClick={() => setIsPremiumOpen(true)}
              className="w-full rounded-2xl bg-gradient-to-r from-card to-card-foreground/5 p-4 text-left transition-all hover:from-card/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-sm font-semibold">Перейти на Premium</h3>
                  <p className="text-xs text-muted-foreground">
                    Безлимитные публикации и приоритетная модерация
                  </p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Tabs */}
        <section className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="articles" className="flex-1 gap-2">
                <FileText className="h-4 w-4" />
                Статьи
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1 gap-2">
                <Bookmark className="h-4 w-4" />
                Избранное
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 gap-2">
                <History className="h-4 w-4" />
                Активность
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              <div className="rounded-2xl bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">Мои статьи</h2>
                  {userArticles.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => setIsArticlesOpen(true)}>
                      Все
                    </Button>
                  )}
                </div>
                {articlesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userArticles.length > 0 ? (
                      userArticles.slice(0, 5).map((article, index) => (
                        <div key={article.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium truncate flex-1">{article.title}</span>
                            {getStatusBadge(article.status)}
                          </div>
                          {article.status === 'rejected' && article.rejection_reason && (
                            <p className="text-xs text-red-400 mb-2">
                              Причина: {article.rejection_reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {article.preview || article.body.substring(0, 100)}
                          </p>
                          <hr className="mt-3 border-border/50" />
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">
                        У вас пока нет статей
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              <div className="rounded-2xl bg-card p-4">
                <h2 className="mb-4 font-heading text-lg font-semibold">Избранное</h2>
                <p className="py-8 text-center text-muted-foreground">
                  Избранных статей пока нет
                </p>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="rounded-2xl bg-card p-4">
                <h2 className="mb-4 font-heading text-lg font-semibold">История активности</h2>
                <p className="py-8 text-center text-muted-foreground">История пуста</p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <BottomNav />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
      <UserArticlesModal
        isOpen={isArticlesOpen}
        onClose={() => setIsArticlesOpen(false)}
        articles={userArticles.map(mapArticleToListFormat)}
      />
      <ReputationHistoryModal
        isOpen={isRepHistoryOpen}
        onClose={() => setIsRepHistoryOpen(false)}
      />
      <SocialLinksModal
        isOpen={isSocialLinksOpen}
        onClose={() => setIsSocialLinksOpen(false)}
        initialTelegram={profile.telegram_channel || ''}
        initialWebsite={profile.website || ''}
        onSave={handleSaveSocialLinks}
      />
    </div>
  );
}
