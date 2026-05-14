import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  availableDates?: string[];
  bookedDates?: string[];
  minDate?: string;
  maxDate?: string;
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function CalendarView({
  selectedDate,
  onSelectDate,
  availableDates = [],
  bookedDates = [],
  minDate,
  maxDate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const days: Array<{
      date: Date;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isAvailable: boolean;
      isBooked: boolean;
      isDisabled: boolean;
    }> = [];

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateString = formatDate(date);
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isAvailable: false,
        isBooked: false,
        isDisabled: true,
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = formatDate(date);
      const today = formatDate(new Date());
      
      const isDisabled = 
        (minDate && dateString < minDate) ||
        (maxDate && dateString > maxDate) ||
        dateString < today;

      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        isAvailable: availableDates.length === 0 || availableDates.includes(dateString),
        isBooked: bookedDates.includes(dateString),
        isDisabled,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = formatDate(date);
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isAvailable: false,
        isBooked: false,
        isDisabled: true,
      });
    }

    return days;
  }, [currentMonth, selectedDate, availableDates, bookedDates, minDate, maxDate]);

  const goToPreviousMonth = () => {
    setDirection(-1);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-chrome-white">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-silver-frost hover:text-chrome-white transition-colors rounded-lg hover:bg-liquid-glass"
          >
            Bugün
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-liquid-glass transition-colors"
            aria-label="Önceki ay"
          >
            <ChevronLeft className="w-5 h-5 text-silver-frost" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-liquid-glass transition-colors"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="w-5 h-5 text-silver-frost" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-lead py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div
        key={currentMonth.toISOString()}
        initial={{ opacity: 0, x: direction * 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-7 gap-2"
      >
        {calendarDays.map((day, index) => {
          const isSelectable = day.isCurrentMonth && !day.isDisabled && day.isAvailable;
          
          return (
            <button
              key={`${day.dateString}-${index}`}
              onClick={() => isSelectable && onSelectDate(day.dateString)}
              disabled={!isSelectable}
              className={cn(
                'relative aspect-square rounded-lg transition-all duration-200',
                'flex items-center justify-center text-sm font-medium',
                
                // Base styles
                day.isCurrentMonth ? 'text-chrome-white' : 'text-ash',
                
                // Disabled state
                !isSelectable && 'cursor-not-allowed opacity-40',
                
                // Hover state
                isSelectable && 'hover:bg-liquid-glass hover:scale-105',
                
                // Today
                day.isToday && 'ring-1 ring-chrome-glow',
                
                // Selected
                day.isSelected && [
                  'bg-gradient-to-br from-chrome-white/20 to-chrome-white/10',
                  'ring-2 ring-chrome-white/40',
                  'shadow-lg shadow-chrome-glow/20',
                ],
                
                // Booked (has appointments)
                day.isBooked && !day.isSelected && 'bg-liquid-glass/50',
              )}
            >
              <span className="relative z-10">{day.date.getDate()}</span>
              
              {/* Availability indicator */}
              {day.isAvailable && day.isCurrentMonth && !day.isDisabled && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success" />
              )}
              
              {/* Booked indicator */}
              {day.isBooked && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-warning" />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-lead">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>Müsait</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span>Randevulu</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full ring-1 ring-chrome-glow" />
          <span>Bugün</span>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
