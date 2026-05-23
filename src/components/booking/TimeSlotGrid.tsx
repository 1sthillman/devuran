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

  const renderSection = (title: string, sectionSlots: TimeSlot[], gradient: string) => {
    if (sectionSlots.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${gradient}`} />
          <h4 className="font-heading font-bold text-base text-[var(--chrome-white)]">{title}</h4>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {sectionSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={(e) => {
                e.stopPropagation();
                if (slot.available) onSelect(slot.time);
              }}
              disabled={!slot.available}
              className={cn(
                'group relative h-14 rounded-2xl font-mono text-base font-semibold transition-all duration-300',
                selectedTime === slot.time
                  ? 'bg-gradient-to-br from-[var(--liquid-chrome)] to-purple-500 text-[var(--void)] shadow-xl shadow-[var(--liquid-chrome)]/30 scale-105'
                  : slot.available
                  ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.04] border-2 border-white/[0.08] text-[var(--chrome-white)] hover:border-[var(--liquid-chrome)]/50 hover:shadow-lg hover:scale-105'
                  : 'bg-gradient-to-br from-white/[0.02] to-transparent border-2 border-red-500/20 text-[var(--muted-lead)] cursor-not-allowed opacity-50'
              )}
            >
              <span className="relative z-10">{slot.time}</span>
              {!slot.available && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {selectedTime === slot.time && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liquid-chrome)]/20 to-purple-500/20 rounded-2xl animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-sm text-[var(--muted-lead)] flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Dolu saatler için sıraya alınabilirsiniz
        </p>
      </div>
      {renderSection('Sabah', morning, 'from-amber-400 to-orange-400')}
      {renderSection('Öğle', afternoon, 'from-blue-400 to-cyan-400')}
      {renderSection('Akşam', evening, 'from-purple-400 to-pink-400')}
    </div>
  );
}
