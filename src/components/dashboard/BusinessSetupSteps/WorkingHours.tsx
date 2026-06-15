import { Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkingHoursProps {
  data: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  onChange: (data: any) => void;
}

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' }
];

export function WorkingHours({ data, onChange }: WorkingHoursProps) {
  const handleDayToggle = (dayKey: string) => {
    onChange({
      ...data,
      [dayKey]: {
        ...data[dayKey],
        isOpen: !data[dayKey].isOpen
      }
    });
  };

  const handleTimeChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    onChange({
      ...data,
      [dayKey]: {
        ...data[dayKey],
        [field]: value
      }
    });
  };

  const setAllDays = (isOpen: boolean) => {
    const newData = { ...data };
    DAYS.forEach(day => {
      newData[day.key] = {
        ...newData[day.key],
        isOpen
      };
    });
    onChange(newData);
  };

  const copyToAllDays = (dayKey: string) => {
    const templateDay = data[dayKey];
    const newData = { ...data };
    DAYS.forEach(day => {
      if (day.key !== dayKey && newData[day.key].isOpen) {
        newData[day.key] = {
          ...newData[day.key],
          open: templateDay.open,
          close: templateDay.close
        };
      }
    });
    onChange(newData);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Info Badge */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
        <p className="text-sm text-[var(--silver-frost)] text-center">
          İşletmenizin haftalık çalışma saatlerini belirleyin
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAllDays(true)}
          className="flex-1 h-10 px-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-heading font-semibold text-xs transition-all"
        >
          Tümünü Aç
        </button>
        <button
          type="button"
          onClick={() => setAllDays(false)}
          className="flex-1 h-10 px-3 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-heading font-semibold text-xs transition-all"
        >
          Tümünü Kapat
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {DAYS.map((day, index) => {
          const dayData = data[day.key];
          const isOpen = dayData?.isOpen ?? true;

          return (
            <div
              key={day.key}
              className={cn(
                "p-4 rounded-3xl border transition-all",
                isOpen
                  ? "bg-white/[0.02] border-white/10"
                  : "bg-white/[0.01] border-white/5 opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isOpen
                      ? "bg-gradient-to-br from-purple-500 to-pink-500"
                      : "bg-white/5"
                  )}>
                    <Clock size={18} className={isOpen ? "text-white" : "text-[var(--muted-lead)]"} />
                  </div>
                  <span className={cn(
                    "font-heading font-bold text-sm",
                    isOpen ? "text-[var(--chrome-white)]" : "text-[var(--muted-lead)]"
                  )}>
                    {day.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDayToggle(day.key)}
                  className="flex items-center gap-2"
                >
                  {isOpen ? (
                    <ToggleRight size={32} className="text-emerald-400" strokeWidth={2} />
                  ) : (
                    <ToggleLeft size={32} className="text-[var(--muted-lead)]" strokeWidth={2} />
                  )}
                </button>
              </div>

              {isOpen && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-heading font-semibold text-[var(--silver-frost)] mb-1.5">
                        Açılış
                      </label>
                      <input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                        className="w-full h-10 px-3 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-semibold text-[var(--silver-frost)] mb-1.5">
                        Kapanış
                      </label>
                      <input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                        className="w-full h-10 px-3 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] text-sm outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToAllDays(day.key)}
                    className="w-full h-9 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--silver-frost)] font-heading font-medium text-xs transition-all"
                  >
                    Bu saatleri diğer günlere kopyala
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
