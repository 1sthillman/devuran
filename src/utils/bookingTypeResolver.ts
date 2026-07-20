/**
 * AKILLI BOOKING TYPE BELİRLEYİCİ
 * 
 * BusinessCapabilities nesnesinden otomatik olarak doğru booking wizard'ını
 * ve sistem davranışını belirler.
 */

import type { BusinessCapabilities } from '@/types/businessCapabilities';

export type BookingType = 'slot' | 'daily' | 'nightly' | 'project' | 'order';

export interface BookingTypeInfo {
  primary: BookingType;
  supports: BookingType[];
  hasQueue: boolean;
  requiresStaff: boolean;
  requiresTables: boolean;
  isMultiModel: boolean;
}

/**
 * Capabilities'den primary booking type'ı belirler
 */
export function determineBookingType(capabilities?: BusinessCapabilities): BookingTypeInfo {
  // Varsayılan capabilities
  if (!capabilities || !capabilities.bookingModels || capabilities.bookingModels.length === 0) {
    return {
      primary: 'slot',
      supports: ['slot'],
      hasQueue: false,
      requiresStaff: false,
      requiresTables: false,
      isMultiModel: false,
    };
  }

  const models = capabilities.bookingModels;
  const supportedTypes: BookingType[] = [];

  // BookingModel → BookingType mapping
  if (models.includes('appointment')) {
    supportedTypes.push('slot');
  }
  
  if (models.includes('reservation')) {
    // Tarih aralığı bazlıysa
    if (capabilities.isDateRangeBased) {
      supportedTypes.push('nightly');
    } else {
      // Saatlik/slot bazlı rezervasyon (masa/saha)
      supportedTypes.push('slot');
    }
  }
  
  if (models.includes('order')) {
    supportedTypes.push('order');
  }
  
  if (models.includes('rental')) {
    supportedTypes.push('daily');
  }
  
  // ✅ KRİTİK: Consultation (proje/etkinlik) model eksikti
  // Date: 2026-07-20
  // Issue: Düğün/etkinlik organizasyonları yanlış wizard'a yönlendiriliyor
  if (models.includes('consultation')) {
    supportedTypes.push('project');
  }

  // Multi-model kontrolü
  const isMultiModel = supportedTypes.length > 1;
  
  // Primary type belirleme (öncelik sırası)
  let primary: BookingType = 'slot';
  if (supportedTypes.includes('nightly')) {
    primary = 'nightly';
  } else if (supportedTypes.includes('project')) {
    primary = 'project';
  } else if (supportedTypes.includes('daily')) {
    primary = 'daily';
  } else if (supportedTypes.includes('order')) {
    primary = 'order';
  } else if (supportedTypes.includes('slot')) {
    primary = 'slot';
  }

  return {
    primary,
    supports: supportedTypes.length > 0 ? supportedTypes : ['slot'],
    hasQueue: capabilities.hasQueue || models.includes('walk-in-queue'),
    requiresStaff: capabilities.hasStaff || false,
    requiresTables: capabilities.hasTables || false,
    isMultiModel,
  };
}

/**
 * Legacy category string'den booking type belirler (geriye uyumluluk için)
 */
export function getBookingTypeFromCategory(category: string): BookingType {
  // Restoran masa rezervasyonu - slot olarak işle
  if (category === 'restoran' || category === 'kafe') {
    return 'slot';
  }
  // Slot bazlı kategoriler
  if (['kuafor', 'berber', 'guzellik', 'tirnak', 'fotograf', 'video-produksiyon', 'drone-cekim'].includes(category)) {
    return 'slot';
  }
  // Günlük kiralama
  if (['dugun-salonu', 'etkinlik-alani'].includes(category)) {
    return 'daily';
  }
  // Gecelik konaklama
  if (['otel', 'villa', 'bungalov', 'kamp-alani'].includes(category)) {
    return 'nightly';
  }
  // Proje bazlı
  if (['dugun-organizasyon', 'nisan-organizasyon', 'evlilik-teklifi', 'dogum-gunu', 'kurumsal-etkinlik'].includes(category)) {
    return 'project';
  }
  // Sipariş bazlı
  if (['catering', 'pasta-tatli', 'kahve-ikram'].includes(category)) {
    return 'order';
  }
  return 'slot'; // Varsayılan
}

/**
 * Dashboard'da hangi sekmelerin gösterileceğini belirler
 */
export function getDashboardModules(capabilities?: BusinessCapabilities) {
  if (!capabilities) {
    return {
      showStaff: true,
      showServices: true,
      showTables: false,
      showQueue: false,
      showRestaurant: false,
      showOrders: false,
    };
  }

  const bookingInfo = determineBookingType(capabilities);

  return {
    showStaff: capabilities.hasStaff,
    showServices: true, // Her zaman göster
    showTables: capabilities.hasTables,
    showQueue: bookingInfo.hasQueue,
    showRestaurant: capabilities.bookingModels.includes('reservation') && capabilities.hasTables,
    showOrders: capabilities.bookingModels.includes('order'),
  };
}

/**
 * Kullanıcıya gösterilecek terminology'yi belirler
 */
export function getBookingTerminology(capabilities?: BusinessCapabilities) {
  if (!capabilities) {
    return {
      singular: 'Randevu',
      plural: 'Randevular',
      action: 'Randevu Al',
      unit: 'saat',
    };
  }

  const models = capabilities.bookingModels;

  if (models.includes('reservation') && capabilities.isDateRangeBased) {
    return {
      singular: 'Rezervasyon',
      plural: 'Rezervasyonlar',
      action: 'Rezervasyon Yap',
      unit: 'gece',
    };
  }

  if (models.includes('reservation')) {
    return {
      singular: 'Rezervasyon',
      plural: 'Rezervasyonlar',
      action: 'Rezervasyon Yap',
      unit: capabilities.tableTerminology || 'masa',
    };
  }

  if (models.includes('order')) {
    return {
      singular: 'Sipariş',
      plural: 'Siparişler',
      action: 'Sipariş Ver',
      unit: 'adet',
    };
  }

  if (models.includes('rental')) {
    return {
      singular: 'Kiralama',
      plural: 'Kiralamalar',
      action: 'Kirala',
      unit: 'gün',
    };
  }

  // Default: appointment
  return {
    singular: 'Randevu',
    plural: 'Randevular',
    action: 'Randevu Al',
    unit: 'saat',
  };
}
