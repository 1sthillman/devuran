import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleTimePickerProps {
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
  className?: string;
  minTime?: string; // "HH:MM" format - minimum selectable time
  maxTime?: string; // "HH:MM" format - maximum selectable time
  workingHours?: {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
  intervalMinutes?: number; // Time slot interval (e.g., 15, 30)
}

export function AppleTimePicker({ 
  value, 
  onChange, 
  className,
  minTime,
  maxTime,
  workingHours,
  intervalMinutes = 15 // Default: 15 dakika aralıklarla
}: AppleTimePickerProps) {
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [showPicker, setShowPicker] = useState(false);
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      if (h && m) {
        setHour(h.padStart(2, '0'));
        setMinute(m.padStart(2, '0'));
      }
    }
  }, [value]);

  // Calculate available hours based on working hours or min/max time
  const getAvailableHours = () => {
    let startHour = 0;
    let endHour = 23;

    if (workingHours) {
      const [startH] = workingHours.start.split(':').map(Number);
      const [endH] = workingHours.end.split(':').map(Number);
      startHour = startH;
      endHour = endH;
    } else if (minTime || maxTime) {
      if (minTime) {
        const [h] = minTime.split(':').map(Number);
        startHour = h;
      }
      if (maxTime) {
        const [h] = maxTime.split(':').map(Number);
        endHour = h;
      }
    }

    const hours: string[] = [];
    for (let i = startHour; i <= endHour; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };

  // Calculate available minutes based on interval
  const getAvailableMinutes = () => {
    const minutes: string[] = [];
    for (let i = 0; i < 60; i += intervalMinutes) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const hours = getAvailableHours();
  const minutes = getAvailableMinutes();

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    onChange(`${hour}:${newMinute}`);
  };

  const scrollToSelected = (ref: React.RefObject<HTMLDivElement>, value: string) => {
    const container = ref.current;
    if (!container) return;
    
    const items = container.querySelectorAll('[data-value]');
    const targetItem = Array.from(items).find(
      (item) => item.getAttribute('data-value') === value
    );
    
    if (targetItem) {
      const itemTop = (targetItem as HTMLElement).offsetTop;
      const containerHeight = container.clientHeight;
      const itemHeight = (targetItem as HTMLElement).clientHeight;
      container.scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
    }
  };

  useEffect(() => {
    if (showPicker) {
      setTimeout(() => {
        scrollToSelected(hourRef, hour);
        scrollToSelected(minuteRef, minute);
      }, 100);
    }
  }, [showPicker, hour, minute]);

  return (
    <div className={cn('relative z-50', className)}>
      {/* Display */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full h-14 px-5 rounded-[20px] bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] text-[var(--chrome-white)] text-lg font-medium outline-none transition-all flex items-center justify-between"
      >
        <span className="flex items-center gap-3">
          <Clock size={20} className="text-[var(--silver-frost)]" />
          {hour}:{minute}
        </span>
        <div className={cn(
          "text-[var(--silver-frost)] transition-transform text-xs",
          showPicker && "rotate-180"
        )}>
          ▼
        </div>
      </button>

      {/* Apple-style Picker */}
      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-[var(--slate-surface)] backdrop-blur-xl border border-white/[0.15] rounded-[24px] shadow-2xl overflow-hidden">
          <div className="flex items-center h-[240px] relative">
            {/* Selection indicator */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[50px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-y-2 border-purple-500/40 pointer-events-none z-10" />
            
            {/* Hour column */}
            <div 
              ref={hourRef}
              className="flex-1 h-full overflow-y-auto scrollbar-hide relative"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="py-[95px]">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-value={h}
                    onClick={() => handleHourChange(h)}
                    className={cn(
                      "w-full h-[50px] flex items-center justify-center text-lg font-medium transition-all",
                      h === hour
                        ? "text-[var(--chrome-white)] scale-110 font-bold"
                        : "text-[var(--muted-lead)] scale-90 opacity-50 hover:opacity-80"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="text-3xl font-bold text-[var(--chrome-white)] z-20 px-3">:</div>

            {/* Minute column */}
            <div 
              ref={minuteRef}
              className="flex-1 h-full overflow-y-auto scrollbar-hide relative"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="py-[95px]">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-value={m}
                    onClick={() => handleMinuteChange(m)}
                    className={cn(
                      "w-full h-[50px] flex items-center justify-center text-lg font-medium transition-all",
                      m === minute
                        ? "text-[var(--chrome-white)] scale-110 font-bold"
                        : "text-[var(--muted-lead)] scale-90 opacity-50 hover:opacity-80"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info text */}
          {workingHours && (
            <div className="px-4 py-2 text-xs text-center text-[var(--muted-lead)] border-t border-white/[0.08]">
              Çalışma Saatleri: {workingHours.start} - {workingHours.end}
            </div>
          )}

          {/* Done button */}
          <div className="p-3 border-t border-white/[0.08] bg-[var(--slate-surface)]">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full h-12 rounded-[16px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

