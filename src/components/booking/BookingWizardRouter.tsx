import { useBookingStore } from '@/store/bookingStore';
import { SlotBookingWizard } from './wizards/SlotBookingWizard';
import { DailyRentalWizard } from './wizards/DailyRentalWizard';
import { NightlyBookingWizard } from './wizards/NightlyBookingWizard';
import { ProjectBookingWizard } from './wizards/ProjectBookingWizard';
import { OrderBookingWizard } from './wizards/OrderBookingWizard';

export function BookingWizardRouter() {
  const bookingType = useBookingStore((state) => state.bookingType);

  if (!bookingType) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-lead)]">Rezervasyon tipi belirleniyor...</p>
      </div>
    );
  }

  switch (bookingType) {
    case 'table':
      // 🍽️ Restoran masa rezervasyonu - slot wizard kullan (aynı mantık)
      return <SlotBookingWizard />;
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
