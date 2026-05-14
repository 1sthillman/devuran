import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
}

const dayNames = ['Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct', 'Pz'];
const monthNames = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
];

export function CalendarPicker({ selectedDate, onSelect, workingHours }: CalendarPickerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Check if a day is closed based on working hours
  const isDayClosed = (dateObj: Date): boolean => {
    if (!workingHours) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    const dayHours = workingHours[dayName];
    if (!dayHours) return true;
    
    // CRITICAL: isOpen undefined or false means CLOSED
    const isClosed = 
      dayHours.isOpen === false || 
      dayHours.isOpen === undefined || 
      !dayHours.open || 
      !dayHours.close || 
      dayHours.open === '' || 
      dayHours.close === '';
    
    return isClosed;
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday start
    const days: { date: number; fullDate: string; isCurrentMonth: boolean; isToday: boolean; isPast: boolean; isClosed: boolean }[] = [];

    // Previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(currentYear, currentMonth, -i);
      days.unshift({
        date: prevDate.getDate(),
        fullDate: '',
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isClosed: false,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(currentYear, currentMonth, d);
      const isClosed = isDayClosed(dateObj);
      
      days.push({
        date: d,
        fullDate,
        isCurrentMonth: true,
        isToday: dateObj.toDateString() === today.toDateString(),
        isPast: dateObj < today && dateObj.toDateString() !== today.toDateString(),
        isClosed,
      });
    }

    return days;
  }, [currentMonth, currentYear, workingHours]);

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={20} className="text-[var(--silver-frost)]" />
        </button>
        <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ChevronRight size={20} className="text-[var(--silver-frost)]" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center font-heading font-medium text-[11px] text-[var(--muted-lead)] uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isDisabled = !day.isCurrentMonth || day.isPast || day.isClosed;
          
          return (
            <button
              key={i}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                if (day.isCurrentMonth && !day.isPast && !day.isClosed) {
                  onSelect(day.fullDate);
                }
              }}
              disabled={isDisabled}
              style={isDisabled ? { pointerEvents: 'none', cursor: 'not-allowed' } : {}}
              className={cn(
                'w-10 h-10 rounded-full font-body text-sm flex items-center justify-center transition-all relative',
                !day.isCurrentMonth && 'invisible',
                day.isCurrentMonth && (day.isPast || day.isClosed) && 'text-[var(--ash)] cursor-not-allowed opacity-40',
                day.isCurrentMonth && !day.isPast && !day.isClosed && !day.isToday && selectedDate !== day.fullDate &&
                  'text-[var(--silver-frost)] hover:bg-white/5',
                day.isToday && !day.isClosed && 'border border-[var(--liquid-chrome)] text-[var(--chrome-white)]',
                selectedDate === day.fullDate && !day.isClosed && 'bg-[var(--chrome-white)] text-[var(--void)] font-medium',
                day.isClosed && 'line-through'
              )}
              title={day.isClosed ? 'Kapalı' : ''}
            >
              {day.date}
            </button>
          );
        })}
      </div>
    </div>
  );
}
