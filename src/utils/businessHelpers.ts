/**
 * İŞLETME YARDIMCI FONKSİYONLARI
 * Capabilities bazlı davranış kontrolleri
 */

import type { BusinessCapabilities } from '@/types/businessCapabilities';
import type { Salon } from '@/types';
import { determineBookingType, getBookingTerminology } from './bookingTypeResolver';

/**
 * İşletme masa/oda bazlı mı?
 */
export function isSalonTableBased(salon?: Salon | null): boolean {
  if (!salon) return false;
  
  const anySalon = salon as any;
  if (anySalon.capabilities) {
    return anySalon.capabilities.hasTables === true;
  }
  
  // Legacy: kategori bazlı
  return ['restoran', 'kafe', 'otel', 'villa'].includes(salon.category);
}

/**
 * İşletme personel bazlı mı?
 */
export function isSalonStaffBased(salon?: Salon | null): boolean {
  if (!salon) return false;
  
  const anySalon = salon as any;
  if (anySalon.capabilities) {
    return anySalon.capabilities.hasStaff === true;
  }
  
  // Legacy
  return ['kuafor', 'berber', 'guzellik'].includes(salon.category);
}

/**
 * Service seçim step başlığını türet
 */
export function getServiceStepTitle(salon?: Salon | null): string {
  if (isSalonTableBased(salon)) {
    const anySalon = salon as any;
    const terminology = anySalon?.capabilities?.tableTerminology || 'Masa';
    return `${terminology} Seçimi`;
  }
  
  return 'Hizmet Seçimi';
}

/**
 * İşletme terminology'sini al
 */
export function getSalonTerminology(salon?: Salon | null) {
  if (!salon) {
    return {
      bookingUnit: 'Randevu',
      actionVerb: 'Randevu Al',
      resourceUnit: 'Personel',
      singular: 'Randevu',
      plural: 'Randevular',
      action: 'Randevu Al',
      unit: 'saat',
      capacityUnitLabel: 'Personel',
      serviceUnitLabel: 'Hizmet',
      bookingUnitPlural: 'Randevular'
    };
  }
  
  const anySalon = salon as any;
  const terminology = getBookingTerminology(anySalon.capabilities);
  
  return {
    ...terminology,
    capacityUnitLabel: anySalon.capabilities?.tableTerminology || 'Personel',
    serviceUnitLabel: 'Hizmet',
    bookingUnitPlural: terminology.plural,
    actionVerb: terminology.action
  };
}

/**
 * Rezervasyon/Randevu aksiyon metnini al
 */
export function getBookingActionText(salon?: Salon | null): string {
  const terminology = getSalonTerminology(salon);
  return terminology.action;
}

/**
 * Rezervasyon otomatik onaylanmalı mı?
 */
export function shouldAutoConfirm(salon?: Salon | null): boolean {
  if (!salon) return false;
  
  const anySalon = salon as any;
  if (anySalon.capabilities) {
    return anySalon.capabilities.autoConfirmDefault === true;
  }
  
  // Legacy: kuaför, berber otomatik
  return ['kuafor', 'berber'].includes(salon.category);
}

/**
 * Kapora gerekli mi?
 */
export function requiresDeposit(salon?: Salon | null): boolean {
  if (!salon) return false;
  
  const anySalon = salon as any;
  if (anySalon.capabilities) {
    return anySalon.capabilities.requiresDeposit === true;
  }
  
  // Legacy: büyük etkinlikler kapora alır
  return ['dugun-salonu', 'etkinlik-alani', 'otel', 'villa'].includes(salon.category);
}
