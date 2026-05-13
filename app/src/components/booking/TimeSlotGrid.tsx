import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, selectedTime, onSelect }: TimeSlotGridProps) {
  const morning = slots.filter((s) => parseInt(s.time) < 12);
  const afternoon = slots.filter((s) => parseInt(s.time) >= 12 && parseInt(s.time) < 17);
  const evening = slots.filter((s) => parseInt(s.time) >= 17);

  const renderSection = (title: string, sectionSlots: TimeSlot[]) => {
    if (sectionSlots.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="font-heading font-semibold text-sm text-[var(--muted-lead)] mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {sectionSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => onSelect(slot.time)}
              className={cn(
                'h-11 rounded-2xl font-mono text-sm transition-all relative',
                selectedTime === slot.time
                  ? 'bg-[var(--chrome-white)] text-[var(--void)] font-medium'
                  : slot.available
                  ? 'liquid-glass-pill text-[var(--silver-frost)] hover:border-[var(--liquid-chrome)]'
                  : 'liquid-glass-pill text-[var(--muted-lead)] border-[var(--error)]/30 hover:border-[var(--error)]'
              )}
            >
              {slot.time}
              {!slot.available && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--error)] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 className="font-heading font-semibold text-[15px] text-[var(--chrome-white)] mb-2">
        Saat Seçin
      </h3>
      <p className="font-body text-xs text-[var(--muted-lead)] mb-4">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 bg-[var(--error)] rounded-full"></span>
          Dolu saatler için sıraya alınabilirsiniz
        </span>
      </p>
      {renderSection('Sabah', morning)}
      {renderSection('Ogle', afternoon)}
      {renderSection('Aksam', evening)}
    </div>
  );
}
