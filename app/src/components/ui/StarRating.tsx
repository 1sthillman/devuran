import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  score: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ score, size = 14, showValue = false, className }: StarRatingProps) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < fullStars
              ? 'fill-[#E5A522] text-[#E5A522]'
              : i === fullStars && hasHalf
              ? 'fill-[#E5A522]/50 text-[#E5A522]'
              : 'fill-transparent text-[var(--obsidian-rim)]'
          )}
        />
      ))}
      {showValue && (
        <span className="font-mono text-[var(--silver-frost)] text-sm ml-1">{score}</span>
      )}
    </div>
  );
}
