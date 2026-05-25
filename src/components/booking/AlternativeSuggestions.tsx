import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bed, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { availabilityService, type TimeSlot } from '@/services/availabilityService';
import type { Staff, Service } from '@/types';
import { cn } from '@/lib/utils';

interface AlternativeSuggestionsProps {
  type: 'staff' | 'room';
  selectedId: string;
  selectedName: string;
  date: Date;
  duration: number;
  workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
  allStaff?: Staff[];
  allRooms?: Service[];
  onSelect: (id: string, name: string) => void;
}

interface Alternative {
  id: string;
  name: string;
  availableSlots: TimeSlot[];
  photo?: string;
  title?: string;
}

export function AlternativeSuggestions({
  type,
  selectedId,
  selectedName,
  date,
  duration,
  workingHours,
  allStaff,
  allRooms,
  onSelect
}: AlternativeSuggestionsProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadAlternatives();
  }, [selectedId, date, type]);

  const loadAlternatives = async () => {
    setLoading(true);
    try {
      const items = type === 'staff' ? allStaff : allRooms;
      if (!items || items.length === 0) {
        setAlternatives([]);
        setLoading(false);
        return;
      }

      // Seçili olanı hariç tut
      const otherItems = items.filter(item => item.id !== selectedId);
      
      const alternativesWithSlots: Alternative[] = [];

      for (const item of otherItems) {
        if (type === 'staff' && 'isActive' in item && !item.isActive) continue;

        let slots: TimeSlot[] = [];
        
        if (type === 'staff' && workingHours) {
          // Personel için slot kontrolü
          slots = await availabilityService.getAvailableSlots({
            businessId: '',
            date,
            duration,
            staffId: item.id,
            workingHours
          });
        } else if (type === 'room') {
          // Oda için müsaitlik kontrolü (basitleştirilmiş)
          // Gerçek implementasyonda oda rezervasyonlarını kontrol etmeli
          slots = [{ startTime: '09:00', endTime: '18:00', available: true }];
        }

        if (slots.length > 0) {
          alternativesWithSlots.push({
            id: item.id,
            name: item.name,
            availableSlots: slots,
            photo: 'photo' in item ? item.photo : undefined,
            title: 'title' in item ? item.title : undefined
          });
        }
      }

      setAlternatives(alternativesWithSlots);
      setShowSuggestions(alternativesWithSlots.length > 0);
    } catch (error) {
      console.error('Alternatif yükleme hatası:', error);
      setAlternatives([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (alternatives.length === 0) {
    return null;
  }

  const Icon = type === 'staff' ? User : Bed;

  return (
    <AnimatePresence>
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 overflow-hidden"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-1">
                  {type === 'staff' ? 'Alternatif Personel Önerileri' : 'Alternatif Oda Önerileri'}
                </h4>
                <p className="text-xs text-amber-300/80">
                  {selectedName} bu tarihte dolu. Aşağıdaki {type === 'staff' ? 'personellerimiz' : 'odalarımız'} müsait:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => onSelect(alt.id, alt.name)}
                  className="w-full p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    {type === 'staff' && alt.photo ? (
                      <img
                        src={alt.photo}
                        alt={alt.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Icon size={20} className="text-amber-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <h5 className="font-heading font-bold text-sm text-[var(--chrome-white)] mb-0.5">
                        {alt.name}
                      </h5>
                      {alt.title && (
                        <p className="text-xs text-[var(--muted-lead)]">{alt.title}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-semibold">
                          {alt.availableSlots.length} müsait saat
                        </span>
                      </div>
                    </div>
                    <div className="text-amber-400">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
