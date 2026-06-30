import { useState, useEffect } from 'react';
import { Clock, Sunrise, Sun, Sunset, Moon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { availabilityService } from '@/services/availabilityService';

interface ModernTimePickerProps {
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
  className?: string;
  minTime?: string; // "HH:MM" format
  maxTime?: string; // "HH:MM" format
  workingHours?: {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
  intervalMinutes?: number; // Time slot interval (default: 30)
  label?: string;
  // 🆕 Slot çakışması kontrolü için
  businessId?: string;
  selectedDate?: string; // ISO date string
  duration?: number; // dakika
  staffId?: string;
  serviceId?: string; // 🍽️ Masa rezervasyonu için
  businessCategory?: string; // 🆕 İşletme kategorisi
}

export function ModernTimePicker({ 
  value, 
  onChange, 
  className,
  minTime,
  maxTime,
  workingHours,
  intervalMinutes = 30,
  label = 'Saat Seçin',
  // 🆕 Slot çakışması kontrolü için
  businessId,
  selectedDate,
  duration = 30,
  staffId,
  serviceId, // 🍽️ Masa ID
  businessCategory // 🆕 İşletme kategorisi
}: ModernTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 🔥 Dolu slotları çek - selectedDate değiştiğinde
  useEffect(() => {
    if (businessId && selectedDate && workingHours) {
      console.log('🎯 useEffect tetiklendi - fetchBookedSlots çağrılacak:', {
        businessId,
        selectedDate,
        serviceId,
        staffId,
        duration
      });
      fetchBookedSlots();
    } else {
      console.log('⚠️ Slot kontrolü YAPILMAYACAK:', {
        businessId: !!businessId,
        selectedDate: !!selectedDate,
        workingHours: !!workingHours
      });
      setBookedSlots(new Set());
    }
  }, [businessId, selectedDate, staffId, serviceId, duration]); // 🔥 duration da eklendi

  const fetchBookedSlots = async () => {
    if (!businessId || !selectedDate || !workingHours) return;
    
    console.log('🎯 fetchBookedSlots çağrıldı:', {
      businessId,
      selectedDate,
      serviceId, // 🔥 Hangi masa için kontrol ediyoruz?
      duration
    });
    
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      
      // availabilityService kullanarak dolu slotları al
      const availableSlots = await availabilityService.getAvailableSlots({
        businessId,
        date,
        duration,
        staffId,
        serviceId, // 🍽️ Masa ID
        workingHours: {
          [getDayName(date)]: {
            open: workingHours.start,
            close: workingHours.end
          }
        }
      });
      
      console.log(`📊 availabilityService'den ${availableSlots.length} slot döndü`);
      
      // 🔥 KRİTİK DÜZELTME: availabilityService'den dönen slotlardaki 
      // available:false olanları direkt booked olarak işaretle
      const booked = new Set<string>();
      
      availableSlots.forEach(slot => {
        if (!slot.available) {
          booked.add(slot.startTime);
        }
      });
      
      setBookedSlots(booked);
      console.log(`🔴 ${booked.size} dolu slot bulundu:`, Array.from(booked));
    } catch (error) {
      console.error('❌ Dolu slotlar alınamadı:', error);
      setBookedSlots(new Set());
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Calculate available time slots based on working hours
  const getAvailableTimeSlots = () => {
    let startHour = 0;
    let startMinute = 0;
    let endHour = 23;
    let endMinute = 59;

    // 🍽️ RESTORAN/KAFE için makul saat aralığı (07:00-24:00)
    const isRestaurantCategory = businessCategory === 'restoran' || businessCategory === 'kafe';
    
    if (isRestaurantCategory) {
      startHour = 7;  // 07:00
      startMinute = 0;
      endHour = 23;   // 23:59
      endMinute = 59;
    }

    // Use working hours if provided (override defaults)
    if (workingHours) {
      const [startH, startM] = workingHours.start.split(':').map(Number);
      const [endH, endM] = workingHours.end.split(':').map(Number);
      
      // 🍽️ Restoran için çalışma saatlerini uygula ama makul aralıkta tut
      if (isRestaurantCategory) {
        startHour = Math.max(7, startH);  // En erken 07:00
        startMinute = startM;
        endHour = Math.min(23, endH);     // En geç 23:59
        endMinute = endM;
      } else {
        // Diğer kategoriler için direkt çalışma saatlerini kullan
        startHour = startH;
        startMinute = startM;
        endHour = endH;
        endMinute = endM;
      }
    } else if (minTime || maxTime) {
      if (minTime) {
        const [h, m] = minTime.split(':').map(Number);
        startHour = h;
        startMinute = m;
      }
      if (maxTime) {
        const [h, m] = maxTime.split(':').map(Number);
        endHour = h;
        endMinute = m;
      }
    }

    const slots: string[] = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    // Round start minute to nearest interval
    currentMinute = Math.ceil(currentMinute / intervalMinutes) * intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute <= endMinute)
    ) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeStr);

      currentMinute += intervalMinutes;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }

      // Break if we've gone past end time
      if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
        break;
      }
    }

    return slots;
  };

  const timeSlots = getAvailableTimeSlots();

  // Group slots by time period
  const groupedSlots = {
    morning: {
      title: 'Sabah',
      icon: Sunrise,
      gradient: 'from-amber-400 via-orange-400 to-rose-400',
      iconColor: 'text-amber-400',
      slots: timeSlots.filter(t => {
        const hour = parseInt(t.split(':')[0]);
        return hour >= 6 && hour < 12;
      })
    },
    afternoon: {
      title: 'Öğleden Sonra',
      icon: Sun,
      gradient: 'from-cyan-400 via-sky-400 to-blue-400',
      iconColor: 'text-cyan-400',
      slots: timeSlots.filter(t => {
        const hour = parseInt(t.split(':')[0]);
        return hour >= 12 && hour < 17;
      })
    },
    evening: {
      title: 'Akşam',
      icon: Sunset,
      gradient: 'from-purple-400 via-fuchsia-400 to-pink-400',
      iconColor: 'text-purple-400',
      slots: timeSlots.filter(t => {
        const hour = parseInt(t.split(':')[0]);
        return hour >= 17 && hour < 24;
      })
    },
    night: {
      title: 'Gece',
      icon: Moon,
      gradient: 'from-indigo-500 via-purple-500 to-pink-500',
      iconColor: 'text-indigo-400',
      slots: timeSlots.filter(t => {
        const hour = parseInt(t.split(':')[0]);
        return hour >= 0 && hour < 6;
      })
    }
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setShowPicker(false);
  };

  const renderTimeGroup = (group: typeof groupedSlots.morning) => {
    const Icon = group.icon;
    const hasSlots = group.slots.length > 0;

    return (
      <div className="mb-6 last:mb-2">
        {/* Header with Icon - Her zaman göster */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            `bg-gradient-to-br ${group.gradient.replace('400', '500/20')}`
          )}>
            <Icon size={16} className={group.iconColor} strokeWidth={2.5} />
          </div>
          <h4 className="text-sm font-bold text-[var(--chrome-white)] tracking-wide">
            {group.title}
          </h4>
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {/* Time Buttons Grid veya Boş Mesaj */}
        {hasSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {group.slots.map((time) => {
              const isSelected = value === time;
              const isBooked = bookedSlots.has(time); // 🔥 Dolu mu kontrol et
              const isDisabled = isBooked;
              
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => !isDisabled && handleTimeSelect(time)}
                  disabled={isDisabled}
                  className={cn(
                    "relative h-14 rounded-full font-bold text-base transition-all duration-200",
                    "flex items-center justify-center overflow-hidden",
                    "border-2",
                    isDisabled
                      ? "bg-red-500/10 border-red-500/30 text-red-400/50 cursor-not-allowed line-through"
                      : isSelected
                      ? `bg-gradient-to-br ${group.gradient} border-transparent text-white shadow-xl scale-105`
                      : "bg-[var(--slate-surface)] hover:bg-white/[0.08] text-[var(--chrome-white)] border-white/[0.08] hover:border-white/20 hover:scale-105 active:scale-95"
                  )}
                  title={isBooked ? 'Bu saat dolu' : ''}
                >
                  {/* Seçili durum için glow efekti */}
                  {isSelected && !isDisabled && (
                    <>
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-30 blur-xl",
                        group.gradient
                      )} />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    </>
                  )}
                  
                  <span className="relative z-10">{time}</span>
                  
                  {/* Dolu göstergesi */}
                  {isBooked && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-sm text-[var(--muted-lead)] text-center">
              Bu zaman diliminde müsait saat bulunmamaktadır
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Display Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "w-full h-14 px-5 rounded-2xl transition-all duration-200",
          "flex items-center justify-between",
          "font-semibold text-base",
          showPicker
            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-2 border-purple-500/60 text-white shadow-xl shadow-purple-500/20 scale-[1.02]"
            : value
            ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/60"
            : "bg-white/[0.05] border-2 border-white/[0.08] hover:border-white/[0.15] text-[var(--chrome-white)]"
        )}
      >
        <span className="flex items-center gap-3">
          <Clock size={20} className={showPicker ? "text-purple-300" : value ? "text-emerald-400" : "text-[var(--silver-frost)]"} />
          <span>{value || label}</span>
        </span>
        <div className={cn(
          "text-xs transition-transform duration-200",
          showPicker && "rotate-180",
          showPicker ? "text-purple-300" : value ? "text-emerald-400" : "text-[var(--silver-frost)]"
        )}>
          ▼
        </div>
      </button>

      {/* Time Picker Dropdown */}
      {showPicker && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
            onClick={() => setShowPicker(false)}
          />
          
          {/* Dropdown */}
          <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[60] bg-[var(--slate-surface)] backdrop-blur-xl border-2 border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-w-lg mx-auto">
            <div className="p-5 pb-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {/* Working Hours Info */}
              {workingHours && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock size={18} className="text-blue-400" />
                    <span className="text-blue-300 font-semibold">
                      Çalışma Saatleri: {workingHours.start} - {workingHours.end}
                    </span>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="mb-5 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="text-purple-400 animate-spin" />
                  <p className="text-sm text-purple-300 font-semibold">Müsait saatler kontrol ediliyor...</p>
                </div>
              )}

            {/* Time Groups - Her zaman tüm grupları göster */}
            {!loading && (
              <>
                {renderTimeGroup(groupedSlots.morning)}
                {renderTimeGroup(groupedSlots.afternoon)}
                {renderTimeGroup(groupedSlots.evening)}
                {renderTimeGroup(groupedSlots.night)}
              </>
            )}
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-white/[0.08] bg-[var(--slate-surface)] sticky bottom-0">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full h-14 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 text-white font-bold text-base hover:shadow-2xl hover:shadow-purple-500/40 transition-all active:scale-[0.98]"
            >
              {value ? 'Seçimi Onayla' : 'Kapat'}
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
