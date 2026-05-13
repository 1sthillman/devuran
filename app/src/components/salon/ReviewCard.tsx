import type { Review } from '@/types';
import { StarRating } from '@/components/ui/StarRating';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="obsidian-card p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--slate-surface)]">
          <img src={review.customerAvatar} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div>
          <h4 className="font-heading font-medium text-sm text-[var(--chrome-white)]">
            {review.customerName}
          </h4>
          <span className="font-body text-xs text-[var(--muted-lead)]">{review.date}</span>
        </div>
      </div>
      <div className="mt-2">
        <StarRating score={review.rating} size={14} />
      </div>
      <p className="mt-2 font-body text-sm text-[var(--silver-frost)] leading-relaxed line-clamp-3">
        {review.comment}
      </p>
    </div>
  );
}
