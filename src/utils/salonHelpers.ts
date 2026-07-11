/**
 * SALON HELPER UTILITIES
 * 
 * Salon ile ilgili yardımcı fonksiyonlar
 */

import type { Salon } from '@/types';
import { determineBookingType, getBookingTerminology } from './bookingTypeResolver';

/**
 * Salon için rezervasyon buton metnini döner
 */
export function getBookingButtonText(salon: Salon): string {
  const anySalon = salon as any;
  
  if (anySalon.capabilities) {
    const terminology = getBookingTerminology(anySalon.capabilities);
    return terminology.action;
  }
  
  // Legacy fallback
  const category = salon.category;
  if (category === 'restoran' || category === 'kafe') {
    return 'Rezervasyon Yap';
  }
  if (category === 'otel' || category === 'villa' || category === 'bungalov') {
    return 'Rezervasyon Yap';
  }
  if (['catering', 'pasta-tatli', 'kahve-ikram'].includes(category)) {
    return 'Sipariş Ver';
  }
  
  return 'Randevu Al';
}

/**
 * Salon için doğru ikonları döner
 */
export function getBookingIcons(salon: Salon) {
  const anySalon = salon as any;
  
  if (anySalon.capabilities) {
    const models = anySalon.capabilities.bookingModels || [];
    
    return {
      hasAppointment: models.includes('appointment'),
      hasReservation: models.includes('reservation'),
      hasOrder: models.includes('order'),
      hasQueue: models.includes('walk-in-queue') || anySalon.capabilities.hasQueue,
    };
  }
  
  // Legacy fallback
  return {
    hasAppointment: true,
    hasReservation: false,
    hasOrder: false,
    hasQueue: salon.settings?.allowQueue || false,
  };
}

/**
 * Salon'un birden fazla booking modeli olup olmadığını kontrol eder
 */
export function isMultiModelBusiness(salon: Salon): boolean {
  const anySalon = salon as any;
  
  if (anySalon.capabilities) {
    const typeInfo = determineBookingType(anySalon.capabilities);
    return typeInfo.isMultiModel;
  }
  
  return false;
}
