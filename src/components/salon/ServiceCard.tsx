import { cn } from '@/lib/utils';
import type { Service } from '@/types';
import { Check } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onToggle?: (service: Service) => void;
  salonCategory?: string;
}

export function ServiceCard({ service, selected, onToggle, salonCategory }: ServiceCardProps) {
  const showDuration = salonCategory && ['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(salonCategory);
  
  return (
    <button
      onClick={() => onToggle?.(service)}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left',
        selected
          ? 'bg-white/[0.03] border-l-2 border-[var(--chrome-white)]'
          : 'hover:bg-white/[0.02] border-l-2 border-transparent'
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
          selected
            ? 'bg-[var(--chrome-white)] border-[var(--chrome-white)]'
            : 'border-[var(--obsidian-rim)]'
        )}
      >
        {selected && <Check size={14} className="text-[var(--void)]" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-body text-[15px] text-[var(--chrome-white)]">{service.name}</h4>
        {showDuration && (
          <p className="font-body text-[13px] text-[var(--muted-lead)]">{service.duration} dk</p>
        )}
      </div>

      {/* Price */}
      <span className="font-mono font-medium text-base text-[var(--silver-frost)]">
        {service.price} TL
      </span>
    </button>
  );
}
