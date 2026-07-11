import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { determineBookingType } from '@/utils/bookingTypeResolver';
import { BookingTypeSelector } from './BookingTypeSelector';
import { SlotBookingWizard } from './wizards/SlotBookingWizard';
import { DailyRentalWizard } from './wizards/DailyRentalWizard';
import { NightlyBookingWizard } from './wizards/NightlyBookingWizard';
import { ProjectBookingWizard } from './wizards/ProjectBookingWizard';
import { OrderBookingWizard } from './wizards/OrderBookingWizard';
import type { BookingType } from '@/utils/bookingTypeResolver';

export function BookingWizardRouter() {
  const salon = useBookingStore((state) => state.salon);
  const bookingType = useBookingStore((state) => state.bookingType);
  const [selectedType, setSelectedType] = useState<BookingType | null>(bookingType);

  // Salon capabilities'e göre desteklenen tipleri belirle
  const anySalon = salon as any;
  const bookingInfo = anySalon?.capabilities 
    ? determineBookingType(anySalon.capabilities) 
    : null;

  // Eğer sadece bir tip destekleniyorsa otomatik seç
  useEffect(() => {
    if (bookingInfo && bookingInfo.supports.length === 1 && !selectedType) {
      const autoType = bookingInfo.supports[0];
      setSelectedType(autoType);
      useBookingStore.setState({ bookingType: autoType });
    }
  }, [bookingInfo, selectedType]);

  // Multi-model: Kullanıcı seçim yapmalı
  if (bookingInfo && bookingInfo.isMultiModel && !selectedType && !bookingType) {
    return (
      <BookingTypeSelector
        availableTypes={bookingInfo.supports}
        onSelect={(type) => {
          setSelectedType(type);
          // Store'da persist et
          useBookingStore.setState({ bookingType: type });
        }}
        businessName={salon?.name || 'İşletme'}
      />
    );
  }

  // Aktif booking type'ı belirle
  const activeType = bookingType || selectedType || bookingInfo?.primary;

  if (!activeType) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-lead)]">Rezervasyon tipi belirleniyor...</p>
      </div>
    );
  }

  // İlgili wizard'ı render et
  switch (activeType) {
    case 'slot':
      return <SlotBookingWizard />;
    case 'daily':
      return <DailyRentalWizard />;
    case 'nightly':
      return <NightlyBookingWizard />;
    case 'project':
      return <ProjectBookingWizard />;
    case 'order':
      return <OrderBookingWizard />;
    default:
      return <SlotBookingWizard />;
  }
}
