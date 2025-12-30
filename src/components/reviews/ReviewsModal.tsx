import { useState, useEffect } from 'react';
import { Star, Send, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/use-telegram';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user: {
    first_name: string | null;
    username: string | null;
    avatar_url: string | null;
    show_name: boolean;
    show_username: boolean;
    show_avatar: boolean;
  } | null;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
}

export function ReviewsModal({ isOpen, onClose }: ReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ totalReviews: 0, avgRating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [userReviewStatus, setUserReviewStatus] = useState<string | null>(null);
  const { getInitData } = useTelegram();

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const initData = getInitData();
      if (!initData) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('tg-reviews', {
        body: { initData, action: 'list' },
      });

      if (error) {
        console.error('Error loading reviews:', error);
        return;
      }

      setReviews(data.reviews || []);
      setStats(data.stats || { totalReviews: 0, avgRating: 0 });
      
      if (data.userReview) {
        setCanSubmit(false);
        setUserReviewStatus(data.userReview.status);
      } else {
        setCanSubmit(true);
        setUserReviewStatus(null);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0 || !reviewText.trim()) {
      toast.error('Укажите рейтинг и напишите отзыв');
      return;
    }

    setIsSubmitting(true);
    try {
      const initData = getInitData();
      if (!initData) {
        toast.error('Ошибка авторизации');
        return;
      }

      const { data, error } = await supabase.functions.invoke('tg-reviews', {
        body: { 
          initData, 
          action: 'submit',
          rating,
          reviewText: reviewText.trim(),
          suggestions: suggestions.trim() || null,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Ошибка отправки');
        return;
      }

      toast.success('Отзыв отправлен на модерацию');
      setShowForm(false);
      setRating(0);
      setReviewText('');
      setSuggestions('');
      setCanSubmit(false);
      setUserReviewStatus('pending');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Ошибка отправки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              interactive ? 'h-8 w-8 cursor-pointer' : 'h-4 w-4',
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
            onClick={interactive ? () => setRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const getAuthorDisplay = (user: Review['user']) => {
    if (!user) return 'Пользователь';
    
    if (user.show_name && user.first_name) {
      return user.first_name;
    }
    if (user.show_username && user.username) {
      return `@${user.username}`;
    }
    return 'Пользователь';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-md p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="flex items-center justify-between">
            <span>Отзывы</span>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              {renderStars(stats.avgRating)}
              <span>{stats.avgRating.toFixed(1)}</span>
              <span>({stats.totalReviews})</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : showForm ? (
            <div className="space-y-4 py-4">
              <div>
                <p className="mb-2 text-sm font-medium">Ваша оценка</p>
                {renderStars(rating, true)}
              </div>
              
              <div>
                <p className="mb-2 text-sm font-medium">Отзыв *</p>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Расскажите о вашем опыте..."
                  rows={4}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Пожелания/проблемы (опционально)</p>
                <Textarea
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Что можно улучшить?"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0 || !reviewText.trim()}
                >
                  <Send className="h-4 w-4" />
                  Отправить
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Пока нет отзывов. Будьте первым!
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {review.user?.show_avatar && review.user?.avatar_url ? (
                          <AvatarImage src={review.user.avatar_url} />
                        ) : null}
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getAuthorDisplay(review.user)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm">{review.review_text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {!showForm && !isLoading && (
          <div className="border-t border-border p-4">
            {canSubmit ? (
              <Button className="w-full gap-2" onClick={() => setShowForm(true)}>
                <Send className="h-4 w-4" />
                Написать отзыв
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                {userReviewStatus === 'pending' 
                  ? 'Ваш отзыв на модерации'
                  : 'Вы уже оставили отзыв'
                }
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
