import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleListCard } from '@/components/articles/ArticleListCard';
import { SettingsModal } from '@/components/profile/SettingsModal';
import { PremiumModal } from '@/components/profile/PremiumModal';
import { UserArticlesModal } from '@/components/profile/UserArticlesModal';
import { ReputationHistoryModal } from '@/components/profile/ReputationHistoryModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Crown, FileText, Bookmark, History, Star } from 'lucide-react';
import { currentUser, mockArticles } from '@/data/mockData';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('articles');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isArticlesOpen, setIsArticlesOpen] = useState(false);
  const [isRepHistoryOpen, setIsRepHistoryOpen] = useState(false);

  const userArticles = mockArticles.filter((a) => a.author_id === currentUser.id);
  const favoriteArticles = mockArticles.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <Header />

      <main className="py-6">
        {/* Profile Header */}
        <section className="mb-6 px-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar_url || '/placeholder.svg'}
                alt={currentUser.first_name}
                className="h-20 w-20 rounded-full object-cover"
              />
              {currentUser.is_premium && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Crown className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-xl font-bold">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => setIsRepHistoryOpen(true)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{currentUser.reputation} rep</span>
                </button>
                <button
                  onClick={() => setIsArticlesOpen(true)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hover:text-primary">
                    {currentUser.articles_count} статей
                  </span>
                </button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Premium Banner */}
        {!currentUser.is_premium && (
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
                  {userArticles.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setIsArticlesOpen(true)}>
                      Все
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {userArticles.length > 0 ? (
                    userArticles.slice(0, 3).map((article, index) => (
                      <ArticleListCard
                        key={article.id}
                        article={article}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      />
                    ))
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      У вас пока нет статей
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              <div className="rounded-2xl bg-card p-4">
                <h2 className="mb-4 font-heading text-lg font-semibold">Избранное</h2>
                <div className="space-y-3">
                  {favoriteArticles.map((article, index) => (
                    <ArticleListCard
                      key={article.id}
                      article={article}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    />
                  ))}
                </div>
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
        articles={userArticles}
      />
      <ReputationHistoryModal
        isOpen={isRepHistoryOpen}
        onClose={() => setIsRepHistoryOpen(false)}
      />
    </div>
  );
}
