/**
 * CAPABILITIES MIGRATION SCRIPT
 * 
 * Mevcut salonlara category'den capabilities oluşturur.
 * 
 * KULLANIM:
 * 1. Firebase Admin SDK ile çalıştırılmalı
 * 2. Tüm salonları okur
 * 3. capabilities yoksa category'den oluşturur
 * 4. Firestore'a geri yazar
 */

import type { BusinessCapabilities } from '@/types/businessCapabilities';

// Category → Capabilities mapping
const CATEGORY_CAPABILITIES: Record<string, Partial<BusinessCapabilities>> = {
  // Randevu bazlı
  'kuafor': {
    bookingModels: ['appointment'],
    isDurationBased: true,
    hasStaff: true,
    hasTables: false,
    hasQueue: true,
    hasPhysicalLocation: true,
  },
  'berber': {
    bookingModels: ['appointment'],
    isDurationBased: true,
    hasStaff: true,
    hasTables: false,
    hasQueue: true,
    hasPhysicalLocation: true,
  },
  'guzellik': {
    bookingModels: ['appointment'],
    isDurationBased: true,
    hasStaff: true,
    hasTables: false,
    hasQueue: false,
    hasPhysicalLocation: true,
  },
  
  // Restoran/Kafe - Masa rezervasyonu
  'restoran': {
    bookingModels: ['reservation', 'order'],
    isDurationBased: false,
    isDateRangeBased: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Masa',
    capacityUnit: 'table',
    hasPhysicalLocation: true,
    hasProductCatalog: true,
  },
  'kafe': {
    bookingModels: ['reservation', 'order'],
    isDurationBased: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Masa',
    capacityUnit: 'table',
    hasPhysicalLocation: true,
    hasProductCatalog: true,
  },
  
  // Konaklama - Gecelik
  'otel': {
    bookingModels: ['reservation'],
    isDurationBased: false,
    isDateRangeBased: true,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Oda',
    capacityUnit: 'table',
    hasPhysicalLocation: true,
  },
  'villa': {
    bookingModels: ['reservation'],
    isDurationBased: false,
    isDateRangeBased: true,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Villa',
    capacityUnit: 'unit',
    hasPhysicalLocation: true,
  },
  'bungalov': {
    bookingModels: ['reservation'],
    isDurationBased: false,
    isDateRangeBased: true,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Bungalov',
    capacityUnit: 'unit',
    hasPhysicalLocation: true,
  },
  
  // Organizasyon - Proje bazlı
  'dugun-organizasyon': {
    bookingModels: ['reservation'],
    isDurationBased: false,
    isDateRangeBased: false,
    hasStaff: true,
    hasTables: false,
    hasPhysicalLocation: true,
  },
  'etkinlik-alani': {
    bookingModels: ['rental'],
    isDurationBased: false,
    isDateRangeBased: false,
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Alan',
    capacityUnit: 'table',
    hasPhysicalLocation: true,
  },
  
  // Sipariş bazlı
  'catering': {
    bookingModels: ['order'],
    isDurationBased: false,
    hasStaff: false,
    hasTables: false,
    hasProductCatalog: true,
    hasDelivery: true,
    hasPhysicalLocation: false,
    isMobileService: true,
  },
  'pasta-tatli': {
    bookingModels: ['order'],
    isDurationBased: false,
    hasStaff: false,
    hasTables: false,
    hasProductCatalog: true,
    hasDelivery: true,
    hasPhysicalLocation: true,
  },
};

/**
 * Bir salon için capabilities oluşturur
 */
export function generateCapabilitiesFromCategory(category: string): BusinessCapabilities {
  const template = CATEGORY_CAPABILITIES[category];
  
  if (!template) {
    // Bilinmeyen kategori - varsayılan randevu sistemi
    return {
      bookingModels: ['appointment'],
      isDurationBased: true,
      isDateRangeBased: false,
      hasStaff: true,
      hasTables: false,
      tableTerminology: 'Masa',
      capacityUnit: 'staff-slot' as const,
      hasPhysicalLocation: true,
      isMobileService: false,
      hasQueue: false,
      hasDelivery: false,
      hasProductCatalog: false,
      hasMultipleLocations: false,
      requiresDeposit: false,
      autoConfirmDefault: true,
      isSubscriptionBased: false,
    };
  }
  
  // Template'i tam capabilities'e dönüştür
  return {
    bookingModels: template.bookingModels || ['appointment'],
    isDurationBased: template.isDurationBased ?? false,
    isDateRangeBased: template.isDateRangeBased ?? false,
    hasStaff: template.hasStaff ?? false,
    hasTables: template.hasTables ?? false,
    tableTerminology: template.tableTerminology || 'Masa',
    capacityUnit: (template.capacityUnit as any) || 'staff-slot' as const,
    hasPhysicalLocation: template.hasPhysicalLocation ?? true,
    isMobileService: template.isMobileService ?? false,
    hasQueue: template.hasQueue ?? false,
    hasDelivery: template.hasDelivery ?? false,
    hasProductCatalog: template.hasProductCatalog ?? false,
    hasMultipleLocations: template.hasMultipleLocations ?? false,
    requiresDeposit: template.requiresDeposit ?? false,
    isSubscriptionBased: template.isSubscriptionBased ?? false,
  };
}

/**
 * Firebase'de migration için kullanılacak fonksiyon
 * NOT: Bu fonksiyon sadece Firebase Admin SDK ile çalıştırılmalı
 */
export async function migrateAllSalons() {
  console.log('⚠️  Bu script Firebase Admin SDK ile backendde çalıştırılmalı!');
  console.log('Frontendde çalıştırılamaz.');
  
  // Backend migration kodu buraya gelecek
  // Örnek:
  // const salons = await db.collection('salons').get();
  // for (const doc of salons.docs) {
  //   const salon = doc.data();
  //   if (!salon.capabilities) {
  //     const capabilities = generateCapabilitiesFromCategory(salon.category);
  //     await doc.ref.update({ capabilities });
  //   }
  // }
}

// Development: Console'da test için
if (typeof window !== 'undefined') {
  (window as any).__migrateCapabilities = generateCapabilitiesFromCategory;
}
