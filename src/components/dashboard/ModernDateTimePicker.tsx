import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface SimpleDateTimePickerProps {
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  onDateChange: (date: string) => void;
  onTimeChange?: (time: string) => void;
  label: string;
  minDate?: string; // YYYY-MM-DD
  showTime?: boolean;
  timeLabel?: string;
}

export function ModernDateTimePicker({
  date,
  time = '00:00',
  onDateChange,
  onTimeChange,
  label,
  minDate,
  showTime = true,
  timeLabel = 'Saat'
}: SimpleDateTimePickerProps) {
  
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return format(d, 'd MMMM yyyy, EEEE', { locale: tr });
    } catch {
      return dateStr;
    }
  };

  const minDateStr = minDate || new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div>
        <label className="text-sm font-semibold text-white/70 mb-2 block">{label}</label>
        
        {/* Display formatted date */}
        {date && (
          <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">{formatDisplayDate(date)}</span>
          </div>
        )}
        
        {/* Native date input with custom styling */}
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none z-10" />
          <input
            type="date"
            value={date}
            min={minDateStr}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base font-medium
                       focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all
                       [color-scheme:dark] cursor-pointer
                       hover:bg-white/10 hover:border-purple-500/30"
          />
        </div>
      </div>

      {/* Time Picker */}
      {showTime && onTimeChange && (
        <div>
          <label className="text-sm font-semibold text-white/70 mb-2 block">{timeLabel}</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 pointer-events-none z-10" />
            <input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-mono font-bold
                         focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all
                         [color-scheme:dark] cursor-pointer
                         hover:bg-white/10 hover:border-blue-500/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}
