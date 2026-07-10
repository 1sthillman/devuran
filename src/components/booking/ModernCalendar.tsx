import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDateToString } from '@/lib/utils';
import { availabilityService } from '@/services/availabilityService';

interface ModernCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  workingHours?: Record<string, { open: string; close: string; isOpen?: boolean }>;
  className?: string;
  businessId?: string;
  serviceDuration?: number;
  staffId?: string;
  staff?: any[];  // Staff listesi
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
  className,
  businessId,
  serviceDuration = 30,
  staffId,
  staff
}: ModernCalendarProps) {
  // 🔥 KRİTİK: Her render'da fresh today objesi oluştur
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
  const today = getTodayStart();
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, boolean>>(new Map());
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Availability kontrolü - sadece businessId varsa çalışır
  useEffect(() => {
    if (businessId && workingHours) {
      checkMonthAvailability();
    } else {
      setAvailabilityMap(new Map());
    }
  }, [currentMonth, currentYear, businessId, serviceDuration, workingHours, staff]);

  const checkMonthAvailability = async () => {
    if (!businessId) return;
    
    setLoadingAvailability(true);
    const newMap = new Map<string, boolean>();
    
    // Ayın tüm günlerini kontrol et
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // 🔥 BUGÜN KONTROLÜ: Sistem saati ile bugünün başlangıcını al
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const promises: Promise<void>[] = [];
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0, 0, 0, 0);
      
      // Geçmiş tarihler için kontrol yapma (bugün dahil DEĞİL - bugün kontrol edilmeli)
      if (dateObj.getTime() < todayStart.getTime()) {
        continue;
      }
      
      // Timezone-safe date key
      const dateKey = formatDateToString(dateObj);
      
      promises.push(
        availabilityService.getAvailableSlots({
          businessId,
          date: dateObj,
          duration: serviceDuration,
          staffId,
          workingHours,
          staff
        }).then(slots => {
          const hasSlots = slots.length > 0;
          newMap.set(dateKey, hasSlots);
        }).catch(error => {
          console.warn(`❌ ${dateKey}: Error checking availability`, error);
          newMap.set(dateKey, false);
        })
      );
    }
    
    await Promise.all(promises);
    setAvailabilityMap(newMap);
    setLoadingAvailability(false);
  };

  const isDayClosed = (dateObj: Date): boolean => {
    // Eğer workingHours tanımlı değilse, hiçbir gün kapalı değil (konaklama gibi)
    if (!workingHours) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    
    const dayHours = workingHours[dayName];
    // Eğer o gün için saat tanımı yoksa kapalı
    if (!dayHours) return true;
    
    // Sadece saatlere bak - isOpen field'ını görmezden gel
    // Eğer open ve close saatleri varsa, o gün açık demektir
    if (!dayHours.open || !dayHours.close) return true;
    
    return false;
  };

  const calendarDays = useMemo(() => {
    const todayStart = getTodayStart(); // Fresh today
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi başlangıç (0 = Pazartesi)
    const days: Array<{
      date: number;
      dateObj: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isClosed: boolean;
      isDisabled: boolean;
      hasAvailability: boolean;
    }> = [];

    // Önceki ay padding - boş alanlar
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
      const prevMonthDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - (startDayOfWeek - i - 1));
      days.push({
        date: prevMonthDate.getDate(),
        dateObj: prevMonthDate,
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isClosed: false,
        isDisabled: true,
        hasAvailability: false,
      });
    }

    // Mevcut ay günleri
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      dateObj.setHours(0, 0, 0, 0);
      
      // 🔥 KRİTİK: Her gün için fresh kontrol
      const now = new Date();
      const todayDate = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();
      
      const isToday = (d === todayDate && currentMonth === todayMonth && currentYear === todayYear);
      
      const isClosed = isDayClosed(dateObj);
      
      // BUGÜN ASLA PAST OLAMAZ
      const isPast = isToday ? false : dateObj.getTime() < todayStart.getTime();
      
      const isBeforeMin = minDate ? dateObj < minDate : false;
      const isAfterMax = maxDate ? dateObj > maxDate : false;
      
      // Timezone-safe date key
      const dateKey = formatDateToString(dateObj);
      const hasAvailability = availabilityMap.get(dateKey) ?? true; // Default true if not checked yet
      
      // BUGÜN İÇİN ÖZEL: isPast kontrolünü atla
      const isDisabled = isToday ? (isClosed || isBeforeMin || isAfterMax) : (isPast || isBeforeMin || isAfterMax || isClosed);
      
      days.push({
        date: d,
        dateObj,
        isCurrentMonth: true,
        isToday,
        isPast,
        isClosed,
        isDisabled,
        hasAvailability,
      });
    }

    // Sonraki ay padding - boş alanlar (42 gün için - 6 satır)
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
        hasAvailability: false,
      });
    }

    return days;
  }, [currentMonth, currentYear, minDate, maxDate, workingHours, availabilityMap, businessId]);

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
          
          // Diğer ayın günlerini gösterme
          if (!day.isCurrentMonth) {
            return (
              <div 
                key={i} 
                className="aspect-square min-h-[40px]"
              />
            );
          }
          
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!day.isDisabled) {
                  onSelect(day.dateObj);
                }
              }}
              disabled={day.isDisabled}
              className={cn(
                'relative aspect-square rounded-[16px] font-medium text-sm flex items-center justify-center transition-all duration-200',
                'min-h-[44px]',
                // Kapalı günler - en yüksek öncelik
                day.isClosed && 
                  'text-[var(--ash)]/40 cursor-not-allowed bg-white/[0.02] line-through',
                // Geçmiş günler
                !day.isClosed && day.isPast && 
                  'text-[var(--ash)]/30 cursor-not-allowed opacity-30',
                // Normal müsait günler
                !day.isDisabled && !selected && 
                  'text-[var(--chrome-white)] bg-white/[0.06] border-2 border-white/[0.08] hover:border-purple-500/50 hover:bg-white/[0.1] hover:scale-105 active:scale-95 cursor-pointer',
                // Bugün - seçili değilse özel stil
                day.isToday && !day.isDisabled && !selected && 
                  'ring-2 ring-purple-500/60 ring-inset font-bold',
                // Seçili gün - Apple tarzı belirgin
                selected && 
                  'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold border-2 border-purple-400 shadow-xl shadow-purple-500/50 scale-110 z-10',
              )}
              title={
                day.isClosed ? 'Kapalı' : 
                day.isPast ? 'Geçmiş tarih' : 
                !day.hasAvailability && businessId ? 'Müsait saat yok (devam edebilirsiniz)' : 
                ''
              }
            >
              <span className="relative z-10">{day.date}</span>
              {selected && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[16px]" />
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[18px] blur-md -z-10" />
                </>
              )}
              {/* Dolu gün göstergesi (advisory only - engellemiyor) */}
              {!day.isDisabled && !day.hasAvailability && businessId && !selected && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400" title="Az slot kaldı" />
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
