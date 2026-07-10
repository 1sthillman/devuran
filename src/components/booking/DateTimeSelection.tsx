/**
 * Date and Time Selection Component
 * 
 * Calendar widget + time slot selection
 */

import React, { useState, useEffect } from 'react';
import { Service, TimeSlot, GroupedTimeSlots } from '@/types/booking.types';
import { bookingApiService } from '@/services/booking-api.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DateTimeSelectionProps {
  businessId: string;
  service: Service;
  onDateTimeSelected: (date: Date, slot: TimeSlot) => void;
  onBack: () => void;
}

export const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  businessId,
  service,
  onDateTimeSelected,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [groupedSlots, setGroupedSlots] = useState<GroupedTimeSlots | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability(selectedDate);
  }, [selectedDate]);

  const loadAvailability = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const slots = await bookingApiService.getGroupedAvailability({
        businessId,
        serviceId: service.serviceId,
        date: dateStr,
        duration: service.duration,
      });

      setGroupedSlots(slots);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
      setError('Müsaitlik bilgisi yüklenemedi');
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSlotSelected = (slot: TimeSlot) => {
    onDateTimeSelected(selectedDate, slot);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tarih ve Saat Seçin</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Geri
        </button>
      </div>

      {/* Selected Service Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Seçilen Hizmet</p>
            <p className="text-lg font-semibold text-gray-900">{service.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{service.duration} dakika</p>
            <p className="text-lg font-bold text-blue-600">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: service.currency || 'TRY',
              }).format(service.price)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarih</h3>
          <MiniCalendar selectedDate={selectedDate} onDateChange={handleDateChange} />
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Müsait Saatler - {selectedDate.toLocaleDateString('tr-TR', { 
              day: 'numeric', 
              month: 'long',
              weekday: 'short'
            })}
          </h3>

          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">{error}</div>
          )}

          {!loading && !error && groupedSlots && (
            <TimeSlotGroups
              groupedSlots={groupedSlots}
              onSlotSelected={handleSlotSelected}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Mini Calendar Component
const MiniCalendar: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}> = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      onDateChange(newDate);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold">
          {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array(startingDayOfWeek).fill(null).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              disabled={isPast(day)}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg
                ${isSelected(day) ? 'bg-blue-600 text-white font-bold' : ''}
                ${isToday(day) && !isSelected(day) ? 'border-2 border-blue-600 text-blue-600 font-semibold' : ''}
                ${isPast(day) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                ${!isSelected(day) && !isToday(day) && !isPast(day) ? 'text-gray-700' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Time Slot Groups Component
const TimeSlotGroups: React.FC<{
  groupedSlots: GroupedTimeSlots;
  onSlotSelected: (slot: TimeSlot) => void;
}> = ({ groupedSlots, onSlotSelected }) => {
  const hasSlots = 
    groupedSlots.morning.length > 0 ||
    groupedSlots.afternoon.length > 0 ||
    groupedSlots.evening.length > 0;

  if (!hasSlots) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>Bu tarih için müsait saat bulunmamaktadır.</p>
        <p className="text-sm mt-2">Lütfen başka bir tarih seçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {groupedSlots.morning.length > 0 && (
        <SlotPeriod
          title="Sabah (08:00 - 12:00)"
          slots={groupedSlots.morning}
          onSlotSelected={onSlotSelected}
        />
      )}
      {groupedSlots.afternoon.length > 0 && (
        <SlotPeriod
          title="Öğleden Sonra (12:00 - 17:00)"
          slots={groupedSlots.afternoon}
          onSlotSelected={onSlotSelected}
        />
      )}
      {groupedSlots.evening.length > 0 && (
        <SlotPeriod
          title="Akşam (17:00 - 21:00)"
          slots={groupedSlots.evening}
          onSlotSelected={onSlotSelected}
        />
      )}
    </div>
  );
};

// Slot Period Component
const SlotPeriod: React.FC<{
  title: string;
  slots: TimeSlot[];
  onSlotSelected: (slot: TimeSlot) => void;
}> = ({ title, slots, onSlotSelected }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {slots.map(slot => (
          <button
            key={slot.slotId}
            onClick={() => onSlotSelected(slot)}
            className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {slot.startTime.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </button>
        ))}
      </div>
    </div>
  );
};
