import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockUsers, mockArticles } from '@/data/mockData';

interface ReputationEvent {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  article_id: string;
  article_title: string;
  value: 1 | -1;
  created_at: string;
}

// Mock reputation history
const mockReputationHistory: ReputationEvent[] = [
  {
    id: '1',
    user_id: '2',
    user_name: mockUsers[1].first_name,
    user_avatar: mockUsers[1].avatar_url || '',
    article_id: '1',
    article_title: mockArticles[0].title,
    value: 1,
    created_at: '2024-03-15T14:30:00Z',
  },
  {
    id: '2',
    user_id: '5',
    user_name: mockUsers[4].first_name,
    user_avatar: mockUsers[4].avatar_url || '',
    article_id: '1',
    article_title: mockArticles[0].title,
    value: 1,
    created_at: '2024-03-15T12:00:00Z',
  },
  {
    id: '3',
    user_id: '3',
    user_name: mockUsers[2].first_name,
    user_avatar: mockUsers[2].avatar_url || '',
    article_id: '6',
    article_title: mockArticles[5].title,
    value: -1,
    created_at: '2024-03-14T18:45:00Z',
  },
  {
    id: '4',
    user_id: '4',
    user_name: mockUsers[3].first_name,
    user_avatar: mockUsers[3].avatar_url || '',
    article_id: '6',
    article_title: mockArticles[5].title,
    value: 1,
    created_at: '2024-03-14T10:20:00Z',
  },
  {
    id: '5',
    user_id: '6',
    user_name: mockUsers[5].first_name,
    user_avatar: mockUsers[5].avatar_url || '',
    article_id: '1',
    article_title: mockArticles[0].title,
    value: 1,
    created_at: '2024-03-13T09:15:00Z',
  },
];

interface ReputationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReputationHistoryModal({ isOpen, onClose }: ReputationHistoryModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Сегодня';
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return `${days} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
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
          <h2 className="font-heading text-lg font-semibold">История репутации</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {mockReputationHistory.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">История репутации пуста</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockReputationHistory.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-4"
                >
                  <img
                    src={event.user_avatar}
                    alt={event.user_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.user_name}</span>
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-sm font-semibold',
                          event.value > 0 ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {event.value > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            +1
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            -1
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {event.article_title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(event.created_at)}
                    </p>
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
