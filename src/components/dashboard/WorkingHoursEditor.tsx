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
      
      console.log('Saving working hours:', normalizedHours);
      await onSave(normalizedHours);
      console.log('Working hours saved successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Hata: Çalışma saatleri kaydedilemedi. Konsolu kontrol edin.');
    }
    setLoading(false);
  };

  return (
    <div className="obsidian-card overflow-hidden">
      <div className="p-6 border-b border-[var(--obsidian-rim)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-3xl bg-[var(--liquid-chrome)]/10 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-[var(--liquid-chrome)] md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-xl md:text-2xl text-[var(--chrome-white)]">
              Çalışma Saatleri
            </h3>
            <p className="font-body text-sm md:text-base text-[var(--muted-lead)] mt-1">
              Haftanın her günü için çalışma saatlerinizi belirleyin
            </p>
          </div>
        </div>

        {/* Hızlı Ayar - Tüm Haftayı Güncelle */}
        <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <Clock size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <h4 className="font-heading font-semibold text-sm text-[var(--chrome-white)]">
              Hızlı Ayar - Tüm Haftayı Güncelle
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <input
                type="time"
                value={bulkOpen}
                onChange={(e) => setBulkOpen(e.target.value)}
                className="flex-1 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-purple-500 transition-all"
              />
              <span className="text-[var(--muted-lead)] font-medium">—</span>
              <input
                type="time"
                value={bulkClose}
                onChange={(e) => setBulkClose(e.target.value)}
                className="flex-1 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[var(--chrome-white)] font-mono text-sm outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <button
              onClick={handleApplyToAll}
              className="px-4 py-2 rounded-full bg-purple-500 text-white font-heading font-semibold text-sm hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
            >
              Tümüne Uygula
            </button>
          </div>
          <p className="text-xs text-[var(--muted-lead)] mt-2">
            Bu saatleri tüm günlere uygulamak için "Tümüne Uygula" butonuna tıklayın
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3">
        {DAYS.map((day, index) => {
          const dayHours = hours[day.key] || { open: '09:00', close: '21:30', isOpen: true };
          
          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 md:p-5 rounded-3xl bg-white/[0.02] border border-[var(--obsidian-rim)] hover:border-[var(--liquid-chrome)]/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Day Label and Toggle */}
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Day Toggle */}
                  <button
                    onClick={() => handleToggleDay(day.key)}
                    className={`relative w-14 h-8 md:w-16 md:h-9 rounded-full transition-all duration-300 flex-shrink-0 ${
                      dayHours.isOpen 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20' 
                        : 'bg-[var(--slate-elevated)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white shadow-lg transition-all duration-300 ${
                        dayHours.isOpen ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Day Label */}
                  <span className={`font-heading font-semibold text-base md:text-lg w-24 md:w-32 ${
                    dayHours.isOpen ? 'text-[var(--chrome-white)]' : 'text-[var(--muted-lead)]'
                  }`}>
                    {day.label}
                  </span>
                </div>

                {/* Time Inputs */}
                {dayHours.isOpen ? (
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                      className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm md:text-base outline-none focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-all"
                    />
                    <span className="text-[var(--muted-lead)] font-medium flex-shrink-0">—</span>
                    <input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                      className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-full bg-[var(--void)] border border-[var(--obsidian-rim)] text-[var(--chrome-white)] font-mono text-sm md:text-base outline-none focus:border-[var(--liquid-chrome)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-all"
                    />
                  </div>
                ) : (
                  <span className="font-body text-sm md:text-base text-[var(--muted-lead)] flex-1 italic">
                    Kapalı
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 md:p-6 border-t border-[var(--obsidian-rim)] flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <ChromaticButton
          onClick={handleSave}
          loading={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Save size={18} />
          <span>Değişiklikleri Kaydet</span>
        </ChromaticButton>

        {saved && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 justify-center sm:justify-start"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="font-body text-sm text-green-400 font-medium">Kaydedildi</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

