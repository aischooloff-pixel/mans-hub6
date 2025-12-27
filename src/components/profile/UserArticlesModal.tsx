import { X, Clock, Check, XCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Article } from '@/types';
import { cn } from '@/lib/utils';

interface UserArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  title?: string;
}

export function UserArticlesModal({
  isOpen,
  onClose,
  articles,
  title = 'Ваши статьи',
}: UserArticlesModalProps) {
  if (!isOpen) return null;

  const getStatusBadge = (status: Article['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-500">
            <Clock className="h-3 w-3" />
            На модерации
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-500">
            <Check className="h-3 w-3" />
            Опубликовано
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-500">
            <XCircle className="h-3 w-3" />
            Отклонено
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-card animate-slide-up',
          'md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl'
        )}
      >
        {/* Handle bar for mobile */}
        <div className="flex shrink-0 justify-center bg-card pt-3 md:hidden">
          <div className="h-1 w-12 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {articles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Вы ничего не написали</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl bg-secondary/50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium line-clamp-2">{article.title}</h3>
                    {getStatusBadge(article.status)}
                  </div>
                  
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {article.preview}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>❤️ {article.likes_count}</span>
                      <span>💬 {article.comments_count}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
