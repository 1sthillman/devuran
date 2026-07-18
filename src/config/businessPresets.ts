/**
 * ============================================================================
 * İŞLETME PRESET CAPABILITIES
 * ============================================================================
 * 
 * Hazır kategoriler için otomatik capabilities konfigürasyonları
 */

import type { BusinessCapabilities, BookingModel } from '@/types/businessCapabilities';

export const BUSINESS_PRESETS: Record<string, BusinessCapabilities> = {
  // GÜZELLİK & BAKIM
  hairdresser: {
    bookingModels: ['appointment'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: true,
    requiresDeposit: false,
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  barber: {
    bookingModels: ['appointment', 'walk-in-queue'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: true,
    requiresDeposit: false,
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  beauty: {
    bookingModels: ['appointment'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: true, // Evde güzellik hizmeti
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: true, // Ürün satışı olabilir
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: false,
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  nails: {
    bookingModels: ['appointment'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: false,
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  // RESTORAN & KAFE
  restaurant: {
    bookingModels: ['reservation', 'order', 'walk-in-queue'],
    capacityUnit: 'table',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false, // ✅ Müşteri RESTORANA gelir, restoran müşteriye gitmez
    hasMultipleLocations: false,
    hasStaff: false, // ✅ Masa rezervasyonu personel bazlı değil
    hasTables: true,
    tableTerminology: 'Masa',
    hasProductCatalog: true, // Menü
    hasDelivery: true, // ✅ Sipariş varsa teslimat olabilir (order booking model)
    hasQueue: true,
    requiresDeposit: false, // ✅ Masa rezervasyonu ücretsiz olabilir
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  cafe: {
    bookingModels: ['reservation', 'walk-in-queue'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false, // ✅ Müşteri kafeye gelir
    hasMultipleLocations: false,
    hasStaff: false, // ✅ Masa rezervasyonu personel bazlı değil
    hasTables: true,
    tableTerminology: 'Masa',
    hasProductCatalog: false,
    hasDelivery: false, // ✅ Kafede genelde teslimat yok
    hasQueue: true,
    requiresDeposit: false,
    isSubscriptionBased: false,
    autoConfirmDefault: true
  },

  // KONAKLAMA
  hotel: {
    bookingModels: ['reservation'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: true, // ✅ Check-in / Check-out
    hasPhysicalLocation: true,
    isMobileService: false, // ✅ Müşteri otele gelir
    hasMultipleLocations: false,
    hasStaff: false, // ✅ Oda rezervasyonu personel bazlı değil
    hasTables: true,
    tableTerminology: 'Oda',
    hasProductCatalog: false,
    hasDelivery: false, // ✅ Otelde teslimat mantıklı değil
    hasQueue: false,
    requiresDeposit: true, // ✅ Otel rezervasyonu genelde kapora ister
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  villa: {
    bookingModels: ['reservation'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: true,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Villa',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  bungalow: {
    bookingModels: ['reservation'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: true,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Bungalov',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  // ETKİNLİK ALANLARI
  wedding_hall: {
    bookingModels: ['rental'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: false, // Tek gün
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Salon',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  event_venue: {
    bookingModels: ['rental', 'reservation'],
    capacityUnit: 'table',
    isDurationBased: true, // Saatlik kiralama da olabilir
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Alan',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  // MEDYA & FOTOĞRAF
  photographer: {
    bookingModels: ['appointment'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: true, // Dış çekim
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  videographer: {
    bookingModels: ['appointment'],
    capacityUnit: 'staff-slot',
    isDurationBased: true,
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: true,
    hasMultipleLocations: false,
    hasStaff: true,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  // SİPARİŞ BAZLI
  catering: {
    bookingModels: ['order'],
    capacityUnit: 'unit',
    isDurationBased: false,
    isDateRangeBased: false,
    hasPhysicalLocation: false,
    isMobileService: true,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: false,
    tableTerminology: '',
    hasProductCatalog: true,
    hasDelivery: true,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  // ARAÇ KİRALAMA
  car_rental: {
    bookingModels: ['rental', 'reservation'],
    capacityUnit: 'table',
    isDurationBased: false,
    isDateRangeBased: true, // Başlangıç - Bitiş
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: true, // Havalimanı, ofis vb.
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Araç',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: true,
    isSubscriptionBased: false,
    autoConfirmDefault: false
  },

  // SPOR TESİSLERİ
  sport_facility: {
    bookingModels: ['reservation', 'appointment'],
    capacityUnit: 'table',
    isDurationBased: true, // Saatlik
    isDateRangeBased: false,
    hasPhysicalLocation: true,
    isMobileService: false,
    hasMultipleLocations: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Saha',
    hasProductCatalog: false,
    hasDelivery: false,
    hasQueue: false,
    requiresDeposit: false,
    isSubscriptionBased: true, // Üyelik sistemi
    autoConfirmDefault: true
  }
};

/**
 * Preset ID'sinden capabilities al
 */
export function getPresetCapabilities(presetId: string): BusinessCapabilities | null {
  return BUSINESS_PRESETS[presetId] || null;
}
