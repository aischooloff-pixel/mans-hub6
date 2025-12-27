import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleCarousel } from '@/components/articles/ArticleCarousel';
import { PodcastCarousel } from '@/components/podcasts/PodcastCarousel';
import { PremiumBanner } from '@/components/premium/PremiumBanner';
import { CategoryList } from '@/components/categories/CategoryList';
import { TelegramCTA } from '@/components/cta/TelegramCTA';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { PremiumModal } from '@/components/profile/PremiumModal';
import { WelcomeModal, useWelcomeModal } from '@/components/welcome/WelcomeModal';
import { Skeleton } from '@/components/ui/skeleton';
import { mockPodcasts, mockCategories } from '@/data/mockData';
import { Category } from '@/types';
import { useProfile } from '@/hooks/use-profile';
import { useArticles, Article } from '@/hooks/use-articles';

export default function Index() {
  const { profile, loading: profileLoading } = useProfile();
  const { getApprovedArticles } = useArticles();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const { showWelcome, closeWelcome } = useWelcomeModal();
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Load articles
  useEffect(() => {
    const loadArticles = async () => {
      setArticlesLoading(true);
      const data = await getApprovedArticles(20);
      setArticles(data);
      setArticlesLoading(false);
    };
    loadArticles();
  }, [getApprovedArticles]);

  // Sort by likes descending for "Популярное"
  const featuredArticles = [...articles]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 4);
  
  const latestArticles = articles.slice(0, 10);

  const filteredArticles = selectedCategory
    ? latestArticles.filter((a) => a.category_id === selectedCategory.id)
    : latestArticles;

  const userName = profile?.first_name || 'друг';
  const isPremium = profile?.is_premium || false;

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <Header />

      <main className="py-6">
        {/* Welcome Section */}
        <section className="mb-8 px-4">
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : (
            <>
              <h1 className="mb-2 font-heading text-2xl font-bold">
                Привет, {userName}
              </h1>
              <p className="text-muted-foreground">
                Что нового в сообществе сегодня
              </p>
            </>
          )}
        </section>

        {/* Categories */}
        <CategoryList
          categories={mockCategories}
          selectedId={selectedCategory?.id}
          onSelect={setSelectedCategory}
          className="mb-8"
        />

        {/* Featured Articles */}
        {articlesLoading ? (
          <section className="mb-8 px-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-64 flex-shrink-0 rounded-xl" />
              ))}
            </div>
          </section>
        ) : featuredArticles.length > 0 ? (
          <ArticleCarousel
            title="Популярное"
            articles={featuredArticles.map(a => ({
              id: a.id,
              author_id: a.author_id || '',
              author: a.author ? {
                id: a.author.id,
                telegram_id: 0,
                username: a.author.username || '',
                first_name: a.author.first_name || '',
                last_name: a.author.last_name || undefined,
                avatar_url: a.author.avatar_url || undefined,
                reputation: a.author.reputation || 0,
                articles_count: 0,
                is_premium: a.author.is_premium || false,
                created_at: '',
              } : undefined,
              category_id: a.category_id || '',
              topic_id: '',
              title: a.title,
              preview: a.preview || '',
              body: a.body,
              media_url: a.media_url || undefined,
              media_type: a.media_type as 'image' | 'youtube' | undefined,
              is_anonymous: a.is_anonymous || false,
              status: (a.status || 'pending') as 'draft' | 'pending' | 'approved' | 'rejected',
              likes_count: a.likes_count || 0,
              comments_count: a.comments_count || 0,
              favorites_count: a.favorites_count || 0,
              rep_score: a.rep_score || 0,
              allow_comments: a.allow_comments !== false,
              created_at: a.created_at || '',
              updated_at: a.updated_at || '',
            }))}
            className="mb-8"
          />
        ) : null}

        {/* Podcasts */}
        <PodcastCarousel
          title="Подкасты"
          podcasts={mockPodcasts}
          className="mb-8"
        />

        {/* Premium Banner */}
        {!isPremium && (
          <PremiumBanner 
            className="mb-8" 
            onClick={() => setIsPremiumOpen(true)}
          />
        )}

        {/* Latest Articles */}
        <section className="mb-8 px-4">
          <h2 className="mb-4 font-heading text-xl font-semibold">
            Последние статьи
          </h2>
          {articlesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={{
                    id: article.id,
                    author_id: article.author_id || '',
                    author: article.author ? {
                      id: article.author.id,
                      telegram_id: 0,
                      username: article.author.username || '',
                      first_name: article.author.first_name || '',
                      last_name: article.author.last_name || undefined,
                      avatar_url: article.author.avatar_url || undefined,
                      reputation: article.author.reputation || 0,
                      articles_count: 0,
                      is_premium: article.author.is_premium || false,
                      created_at: '',
                    } : undefined,
                    category_id: article.category_id || '',
                    topic_id: '',
                    title: article.title,
                    preview: article.preview || '',
                    body: article.body,
                    media_url: article.media_url || undefined,
                    media_type: article.media_type as 'image' | 'youtube' | undefined,
                    is_anonymous: article.is_anonymous || false,
                    status: (article.status || 'pending') as 'draft' | 'pending' | 'approved' | 'rejected',
                    likes_count: article.likes_count || 0,
                    comments_count: article.comments_count || 0,
                    favorites_count: article.favorites_count || 0,
                    rep_score: article.rep_score || 0,
                    allow_comments: article.allow_comments !== false,
                    created_at: article.created_at || '',
                    updated_at: article.updated_at || '',
                  }}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Пока нет опубликованных статей</p>
              <p className="text-sm mt-2">Будьте первым, кто напишет статью!</p>
            </div>
          )}
        </section>

        {/* Telegram CTA */}
        <TelegramCTA className="mb-8" />
      </main>

      <BottomNav />
      
      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
      
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
    </div>
  );
}
