import { cn } from '@/lib/utils';
import type { Staff } from '@/types';
import { StarRating } from '@/components/ui/StarRating';

interface StaffCardProps {
  staff: Staff;
  selected?: boolean;
  onSelect?: (id: string) => void;
  variant?: 'compact' | 'detailed';
}

export function StaffCard({ staff, selected, onSelect, variant = 'detailed' }: StaffCardProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={() => onSelect?.(staff.id)}
        className="flex flex-col items-center gap-2 min-w-[100px]"
      >
        <div
          className={cn(
            'w-20 h-20 rounded-full overflow-hidden transition-all duration-300',
            selected
              ? 'ring-2 ring-[var(--chrome-white)] shadow-[0_0_20px_rgba(240,240,240,0.15)]'
              : 'ring-1 ring-[var(--obsidian-rim)] hover:ring-[var(--liquid-chrome)]'
          )}
        >
          {staff.photo ? (
            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-[var(--chrome-white)] font-heading font-bold text-xl">
                {staff.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="font-heading font-medium text-sm text-[var(--chrome-white)] text-center">
          {staff.name}
        </span>
        <span className="font-body text-xs text-[var(--muted-lead)]">{staff.title}</span>
        {staff.priceRange && staff.priceRange.min > 0 && staff.priceRange.max > 0 && (
          <span className="font-mono text-xs text-[var(--silver-frost)]">
            {staff.priceRange.min} - {staff.priceRange.max} TL
          </span>
        )}
        <StarRating score={staff.rating} size={12} showValue />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 obsidian-card">
      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
        {staff.photo ? (
          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <span className="text-[var(--chrome-white)] font-heading font-bold">
              {staff.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-semibold text-[var(--chrome-white)]">{staff.name}</h4>
        <p className="font-body text-sm text-[var(--muted-lead)]">{staff.title}</p>
        {staff.priceRange && staff.priceRange.min > 0 && staff.priceRange.max > 0 && (
          <p className="font-mono text-sm text-[var(--silver-frost)] mt-1">
            {staff.priceRange.min} - {staff.priceRange.max} TL
          </p>
        )}
        <StarRating score={staff.rating} size={12} showValue />
      </div>
    </div>
  );
}
