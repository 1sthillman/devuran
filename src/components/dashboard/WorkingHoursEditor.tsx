import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save } from 'lucide-react';
import { ChromaticButton } from '@/components/ui/ChromaticButton';

interface WorkingHours {
  [key: string]: { open: string; close: string; isOpen: boolean };
}

interface WorkingHoursEditorProps {
  initialHours: WorkingHours;
  onSave: (hours: WorkingHours) => Promise<void>;
}

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Sali' },
  { key: 'wednesday', label: 'Carsamba' },
  { key: 'thursday', label: 'Persembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

export function WorkingHoursEditor({ initialHours, onSave }: WorkingHoursEditorProps) {
  const [hours, setHours] = useState<WorkingHours>(initialHours);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkOpen, setBulkOpen] = useState('09:00');
  const [bulkClose, setBulkClose] = useState('21:30');

  const handleToggleDay = (day: string) => {
    setHours(prev => {
      const currentDay = prev[day] || { open: '09:00', close: '21:30', isOpen: true };
      return {
        ...prev,
        [day]: {
          ...currentDay,
          isOpen: !currentDay.isOpen, // Toggle isOpen
        },
      };
    });
  };

  const handleApplyToAll = () => {
    const newHours: WorkingHours = {};
    DAYS.forEach(day => {
      newHours[day.key] = {
        open: bulkOpen,
        close: bulkClose,
        isOpen: true,
      };
    });
    setHours(newHours);
  };

  const handleTimeChange = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => {
      const currentDay = prev[day] || { open: '09:00', close: '21:30', isOpen: true };
      return {
        ...prev,
        [day]: {
          ...currentDay,
          [field]: value,
          isOpen: currentDay.isOpen !== undefined ? currentDay.isOpen : true, // Ensure isOpen exists
        },
      };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      // CRITICAL: Ensure ALL days have isOpen field
      const normalizedHours: WorkingHours = {};
      DAYS.forEach(day => {
        const dayHours = hours[day.key] || { open: '09:00', close: '21:30', isOpen: true };
        normalizedHours[day.key] = {
          open: dayHours.open || '09:00',
          close: dayHours.close || '21:30',
          isOpen: dayHours.isOpen !== undefined ? dayHours.isOpen : true, // Default to true if undefined
        };
      });
      
      await onSave(normalizedHours);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Hata: Çalışma saatleri kaydedilemedi. Konsolu kontrol edin.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Hızlı Ayar - Compact */}
      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-slate-400" />
          <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
            Hızlı Ayar
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="time"
              value={bulkOpen}
              onChange={(e) => setBulkOpen(e.target.value)}
              className="flex-1 h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-mono text-xs outline-none focus:border-[var(--liquid-chrome)] transition-all"
            />
            <span className="text-[var(--muted-lead)] text-sm">—</span>
            <input
              type="time"
              value={bulkClose}
              onChange={(e) => setBulkClose(e.target.value)}
              className="flex-1 h-9 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-mono text-xs outline-none focus:border-[var(--liquid-chrome)] transition-all"
            />
          </div>
          <button
            onClick={handleApplyToAll}
            className="h-9 px-4 rounded-2xl bg-slate-500/20 border border-slate-400/50 text-[var(--chrome-white)] font-heading font-semibold text-xs hover:bg-slate-500/30 transition-all active:scale-95"
          >
            Tümüne Uygula
          </button>
        </div>
      </div>

      {/* Günler - 2 Sıra Compact Grid (Her zaman 2 sütun) */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {DAYS.map((day, index) => {
          const dayHours = hours[day.key] || { open: '09:00', close: '21:30', isOpen: true };
          
          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="p-3 md:p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                {/* Day Toggle - Compact */}
                <button
                  onClick={() => handleToggleDay(day.key)}
                  className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${
                    dayHours.isOpen 
                      ? 'bg-[var(--success)]' 
                      : 'bg-[var(--slate-elevated)]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      dayHours.isOpen ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Day Label */}
                <span className={`font-heading font-semibold text-[10px] md:text-xs flex-1 ${
                  dayHours.isOpen ? 'text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
                }`}>
                  {day.label}
                </span>
              </div>

              {/* Time Inputs - Vertical Layout for Mobile */}
              {dayHours.isOpen ? (
                <div className="space-y-1.5">
                  <input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                    className="w-full h-8 px-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-mono text-[10px] md:text-xs outline-none focus:border-[var(--liquid-chrome)] transition-all"
                  />
                  <input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                    className="w-full h-8 px-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--chrome-white)] font-mono text-[10px] md:text-xs outline-none focus:border-[var(--liquid-chrome)] transition-all"
                  />
                </div>
              ) : (
                <div className="text-center py-1.5">
                  <span className="font-body text-[9px] md:text-[10px] text-[var(--muted-lead)] italic uppercase tracking-wider">
                    Kapalı
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Save Button - Compact */}
      <div className="flex items-center gap-3 pt-2">
        <ChromaticButton
          onClick={handleSave}
          loading={loading}
          className="flex items-center justify-center gap-2 h-10 px-6"
        >
          <Save size={16} />
          <span className="text-sm">Kaydet</span>
        </ChromaticButton>

        {saved && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-green-500/10 border border-green-500/30"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="font-body text-xs text-green-400 font-medium">Kaydedildi</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

