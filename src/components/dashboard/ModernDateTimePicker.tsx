import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { tr } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-day-picker/dist/style.css';

interface ModernDateTimePickerProps {
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  onDateChange: (date: string) => void;
  onTimeChange?: (time: string) => void;
  label: string;
  minDate?: Date;
  showTime?: boolean;
  timeLabel?: string;
}

export function ModernDateTimePicker({
  date,
  time = '00:00',
  onDateChange,
  onTimeChange,
  label,
  minDate = new Date(),
  showTime = true,
  timeLabel = 'Saat'
}: ModernDateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedDate = date ? new Date(date + 'T00:00:00') : undefined;
  
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const formatted = format(newDate, 'yyyy-MM-dd');
      onDateChange(formatted);
      setShowCalendar(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Tarih seçin';
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, 'd MMMM yyyy, EEEE', { locale: tr });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };

  return (
    <div className="space-y-3">
      {/* Date Picker */}
      <div className="relative">
        <label className="text-sm font-semibold text-white/70 mb-2 block">{label}</label>
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl text-white transition-all group"
        >
          <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <span className="flex-1 text-left">{formatDisplayDate(date)}</span>
        </button>

        <AnimatePresence>
          {showCalendar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCalendar(false)}
                className="fixed inset-0 z-40 bg-black/20"
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 z-50 bg-gray-800 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-4">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={{ before: minDate }}
                    locale={tr}
                    className="modern-calendar"
                    modifiersClassNames={{
                      selected: 'bg-purple-500 text-white font-bold',
                      today: 'text-blue-400 font-semibold',
                      disabled: 'text-white/20'
                    }}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Time Picker */}
      {showTime && onTimeChange && (
        <div className="relative">
          <label className="text-sm font-semibold text-white/70 mb-2 block">{timeLabel}</label>
          <button
            type="button"
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl text-white transition-all"
          >
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="flex-1 text-left text-lg font-mono">{time}</span>
          </button>

          <AnimatePresence>
            {showTimePicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowTimePicker(false)}
                  className="fixed inset-0 z-40 bg-black/20"
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 z-50 w-full bg-gray-800 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {generateTimeOptions().map((timeOption) => (
                      <button
                        key={timeOption}
                        type="button"
                        onClick={() => {
                          onTimeChange(timeOption);
                          setShowTimePicker(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg text-left font-mono transition-colors ${
                          time === timeOption
                            ? 'bg-blue-500 text-white font-bold'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {timeOption}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
