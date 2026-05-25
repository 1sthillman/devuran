import { Clock } from 'lucide-react';

interface WorkingHoursDisplayProps {
  workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
  label?: string;
  colorClass?: string;
}

export function WorkingHoursDisplay({ 
  workingHours, 
  label = 'Bugün',
  colorClass = 'text-cyan-400'
}: WorkingHoursDisplayProps) {
  if (!workingHours) return null;

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const dayName = dayNames[today.getDay()];
  const todayHours = workingHours[dayName];

  if (!todayHours) return null;

  // Sadece saatlere bak - isOpen field'ını görmezden gel
  // Eğer open ve close saatleri varsa, o gün açık demektir
  const isClosed = !todayHours.open || !todayHours.close;

  return (
    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
      <Clock size={14} className={colorClass} />
      <span className="text-xs text-[var(--chrome-white)]">
        {isClosed ? (
          <span className="text-red-400 font-semibold">Bugün Kapalı</span>
        ) : (
          <>
            {label}: <span className={`font-semibold ${colorClass}`}>{todayHours.open} - {todayHours.close}</span>
          </>
        )}
      </span>
    </div>
  );
}
