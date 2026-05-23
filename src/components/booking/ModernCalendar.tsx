import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
  className?: string;
}

const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function ModernCalendar({ 
  selectedDate, 
  onSelect, 
  minDate, 
  maxDate,
  workingHours,
  className 
}: ModernCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());

  const isDayClosed = (dateObj: Date): boolean => {
    if (!workingHours) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    const dayHours = workingHours[dayName];
    if (!dayHours) return true;
    
    return dayHours.isOpen === false || 
           dayHours.isOpen === undefined || 
           !dayHours.open || 
           !dayHours.close;
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi başlangıç
    const days: Array<{
      date: number;
      dateObj: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isClosed: boolean;
      isDisabled: boolean;
    }> = [];

    // Önceki ay padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      days.push({
        date: prevDate.getDate(),
        dateObj: prevDate,
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isClosed: false,
        isDisabled: true,
      });
    }

    // Mevcut ay günleri
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0, 0, 0, 0);
      
      const isClosed = isDayClosed(dateObj);
      const isPast = dateObj < today;
      const isBeforeMin = minDate ? dateObj < minDate : false;
      const isAfterMax = maxDate ? dateObj > maxDate : false;
      
      days.push({
        date: d,
        dateObj,
        isCurrentMonth: true,
        isToday: dateObj.getTime() === today.getTime(),
        isPast,
        isClosed,
        isDisabled: isPast || isClosed || isBeforeMin || isAfterMax,
      });
    }

    // Sonraki ay padding (42 gün için - 6 satır)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date: nextDate.getDate(),
        dateObj: nextDate,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        isClosed: false,
        isDisabled: true,
      });
    }

    return days;
  }, [currentMonth, currentYear, minDate, maxDate, workingHours]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isSelected = (dateObj: Date) => {
    if (!selectedDate) return false;
    return dateObj.getTime() === selectedDate.getTime();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevMonth();
          }}
          className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/[0.06] hover:border-[var(--liquid-chrome)]/30 flex items-center justify-center transition-all"
          aria-label="Önceki ay"
        >
          <ChevronLeft size={16} className="text-[var(--chrome-white)]" />
        </button>
        <h3 className="font-heading font-bold text-base bg-gradient-to-r from-[var(--liquid-chrome)] to-purple-400 bg-clip-text text-transparent">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextMonth();
          }}
          className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/[0.06] hover:border-[var(--liquid-chrome)]/30 flex items-center justify-center transition-all"
          aria-label="Sonraki ay"
        >
          <ChevronRight size={16} className="text-[var(--chrome-white)]" />
        </button>
      </div>

      {/* Gün isimleri */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div 
            key={d} 
            className="text-center font-heading font-medium text-[10px] text-[var(--muted-lead)] uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Günler grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const selected = isSelected(day.dateObj);
          
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (!day.isDisabled && day.isCurrentMonth) {
                  onSelect(day.dateObj);
                }
              }}
              disabled={day.isDisabled}
              className={cn(
                'relative aspect-square rounded-full font-body text-xs flex items-center justify-center transition-all duration-200',
                'min-h-[40px]',
                !day.isCurrentMonth && 'text-[var(--ash)]/20 cursor-default',
                day.isCurrentMonth && day.isDisabled && 'text-[var(--ash)] cursor-not-allowed opacity-30',
                day.isCurrentMonth && !day.isDisabled && !selected && 
                  'text-[var(--chrome-white)] bg-white/[0.03] border border-white/[0.06] hover:border-[var(--liquid-chrome)]/40 hover:bg-white/[0.06] active:scale-95',
                day.isToday && !day.isDisabled && !selected && 
                  'border border-[var(--liquid-chrome)]/60 text-[var(--liquid-chrome)] font-semibold',
                selected && 
                  'bg-gradient-to-br from-[var(--liquid-chrome)] to-purple-600 text-white font-bold border border-[var(--liquid-chrome)] shadow-lg shadow-[var(--liquid-chrome)]/30',
                day.isClosed && 'line-through'
              )}
              title={day.isClosed ? 'Kapalı' : day.isPast ? 'Geçmiş tarih' : ''}
            >
              <span className="relative z-10">{day.date}</span>
              {selected && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend - Kompakt */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--muted-lead)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-[var(--liquid-chrome)]/60" />
          <span>Bugün</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-[var(--liquid-chrome)] to-purple-600" />
          <span>Seçili</span>
        </div>
      </div>
    </div>
  );
}
