import { useState, useEffect } from 'react';
import { Star, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewsModal } from './ReviewsModal';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/use-telegram';

interface ReviewsSectionProps {
  className?: string;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
}

export function ReviewsSection({ className }: ReviewsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<ReviewStats>({ totalReviews: 0, avgRating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { getInitData } = useTelegram();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const initData = getInitData();
      if (!initData) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('tg-reviews', {
        body: { initData, action: 'list' },
      });

      if (!error && data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading review stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <section
        className={cn(
          'mx-4 rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-accent/50',
          className
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold">Отзывы</h3>
              {!isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {renderStars(stats.avgRating)}
                  <span>{stats.avgRating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{stats.totalReviews} отзывов</span>
                </div>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </section>

      <ReviewsModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          loadStats();
        }} 
      />
    </>
  );
}
