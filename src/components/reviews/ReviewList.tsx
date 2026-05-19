import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { reviewService } from '@/services/reviewService';
import type { Review } from '@/types';

interface ReviewListProps {
  salonId: string;
  limit?: number;
}

export function ReviewList({ salonId, limit = 10 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  } | null>(null);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [salonId]);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getSalonReviews(salonId, limit);
      setReviews(data);
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await reviewService.getReviewStats(salonId);
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.totalReviews > 0 && (
        <div className="obsidian-card p-6 rounded-3xl">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--liquid-chrome)] mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[var(--muted-lead)]'
                    }
                  />
                ))}
              </div>
              <p className="font-body text-sm text-[var(--muted-lead)]">
                {stats.totalReviews} değerlendirme
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="font-body text-sm text-[var(--chrome-white)]">
                        {rating}
                      </span>
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-[var(--slate-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-body text-sm text-[var(--muted-lead)] w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="obsidian-card p-12 rounded-3xl text-center">
          <MessageSquare size={48} className="text-[var(--muted-lead)] mx-auto mb-4" />
          <p className="font-heading text-lg text-[var(--chrome-white)] mb-2">
            Henüz değerlendirme yok
          </p>
          <p className="font-body text-sm text-[var(--muted-lead)]">
            İlk değerlendirmeyi siz yapın
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="obsidian-card p-6 rounded-3xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <span className="font-heading font-bold text-lg text-purple-400">
                      {review.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-[var(--chrome-white)]">
                      {review.customerName}
                    </p>
                    <p className="font-body text-sm text-[var(--muted-lead)]">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-[var(--muted-lead)]'
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="font-body text-[var(--chrome-white)] mb-4 leading-relaxed">
                {review.comment}
              </p>

              {/* Staff Rating */}
              {review.staffName && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-body text-sm text-[var(--muted-lead)]">
                    {review.staffName}:
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= review.staffRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-[var(--muted-lead)]'
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Response */}
              {review.ownerResponse && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="font-heading font-semibold text-sm text-blue-400 mb-2">
                    İşletme Yanıtı
                  </p>
                  <p className="font-body text-sm text-blue-300/90">
                    {review.ownerResponse}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
