/**
 * ============================================================================
 * İŞLETME SETUP DOĞRULAMA ARACI
 * ============================================================================
 * 
 * Capabilities ve business setup'ın doğruluğunu test eder
 */

import type { BusinessCapabilities } from '@/types/businessCapabilities';
import type { Salon } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Capabilities nesnesini doğrula
 */
export function validateCapabilities(capabilities: BusinessCapabilities): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. bookingModels kontrolü
  if (!capabilities.bookingModels || capabilities.bookingModels.length === 0) {
    errors.push('En az bir booking model seçilmeli');
  }

  // 2. Çelişki kontrolleri
  
  // Masa var ama reservation yok
  if (capabilities.hasTables && !capabilities.bookingModels.includes('reservation')) {
    warnings.push('Masa/oda sistemi var ama reservation modeli yok. Reservation modeli eklenmeli.');
  }

  // Reservation var ama masa yok
  if (capabilities.bookingModels.includes('reservation') && !capabilities.hasTables && !capabilities.hasStaff) {
    errors.push('Reservation modeli için masa veya personel sistemi olmalı');
  }

  // Order var ama ürün kataloğu yok
  if (capabilities.bookingModels.includes('order') && !capabilities.hasProductCatalog) {
    warnings.push('Order modeli var ama ürün kataloğu yok. Ürün kataloğu eklenmeli.');
  }

  // Teslimat var ama order yok
  if (capabilities.hasDelivery && !capabilities.bookingModels.includes('order')) {
    warnings.push('Teslimat sistemi var ama order modeli yok. Order modeli eklenmeli.');
  }

  // Tarih aralığı var ama uygun model yok
  if (capabilities.isDateRangeBased && 
      !capabilities.bookingModels.includes('reservation') && 
      !capabilities.bookingModels.includes('rental')) {
    errors.push('Tarih aralığı bazlı sistem için reservation veya rental modeli gerekli');
  }

  // Personel var ama appointment yok
  if (capabilities.hasStaff && !capabilities.bookingModels.includes('appointment')) {
    warnings.push('Personel sistemi var ama appointment modeli yok. Appointment modeli eklenmeli.');
  }

  // 3. Terminology kontrolü
  if (capabilities.hasTables && !capabilities.tableTerminology) {
    errors.push('Masa/oda sistemi için terminology belirtilmeli');
  }

  // 4. capacityUnit kontrolü
  if (!capabilities.capacityUnit) {
    errors.push('capacityUnit belirtilmeli');
  }

  // 5. Mantıksal çelişkiler
  if (capabilities.hasPhysicalLocation === false && capabilities.isMobileService === false) {
    errors.push('İşletme ne fiziksel mekana ne de mobil hizmete sahip olamaz');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Salon nesnesini doğrula (capabilities dahil)
 */
export function validateSalon(salon: Salon): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Temel alanlar
  if (!salon.name || salon.name.trim().length < 2) {
    errors.push('İşletme adı en az 2 karakter olmalı');
  }

  if (!salon.description || salon.description.trim().length < 10) {
    errors.push('İşletme açıklaması en az 10 karakter olmalı');
  }

  if (!salon.category) {
    errors.push('Kategori belirtilmeli');
  }

  // 2. Capabilities kontrolü
  const anySalon = salon as any;
  if (!anySalon.capabilities) {
    warnings.push('Capabilities sistemi yok - eski sistem kullanılıyor');
  } else {
    const capResult = validateCapabilities(anySalon.capabilities);
    errors.push(...capResult.errors);
    warnings.push(...capResult.warnings);
  }

  // 3. Veri tutarlılığı
  if (anySalon.capabilities?.hasStaff && (!salon.staff || salon.staff.length === 0)) {
    warnings.push('Personel sistemi aktif ama personel eklenmemiş');
  }

  if (!salon.services || salon.services.length === 0) {
    warnings.push('Hizmet/paket eklenmemiş');
  }

  if (!salon.workingHours || (Array.isArray(salon.workingHours) && salon.workingHours.length === 0)) {
    warnings.push('Çalışma saatleri ayarlanmamış');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Wizard akışını simüle ederek test et
 */
export function testBookingFlow(salon: Salon, bookingType: 'slot' | 'daily' | 'nightly' | 'project' | 'order'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const anySalon = salon as any;
  const capabilities = anySalon.capabilities;

  if (!capabilities) {
    errors.push('Capabilities yok - test edilemez');
    return { isValid: false, errors, warnings };
  }

  // bookingType için gerekli şeyler var mı?
  switch (bookingType) {
    case 'slot':
      if (!capabilities.bookingModels.includes('appointment') && !capabilities.bookingModels.includes('reservation')) {
        errors.push('Slot booking için appointment veya reservation modeli gerekli');
      }
      
      if (capabilities.hasStaff && (!salon.staff || salon.staff.length === 0)) {
        errors.push('Personel sistemi aktif ama personel yok');
      }
      
      if (capabilities.hasTables && (!salon.services || salon.services.length === 0)) {
        errors.push('Masa sistemi aktif ama masa/hizmet yok');
      }
      break;

    case 'daily':
      if (!capabilities.bookingModels.includes('rental')) {
        warnings.push('Daily booking için rental modeli önerilir');
      }
      
      if (!salon.services || salon.services.length === 0) {
        errors.push('Günlük kiralama için paket/hizmet gerekli');
      }
      break;

    case 'nightly':
      if (!capabilities.isDateRangeBased) {
        errors.push('Gecelik konaklama için isDateRangeBased=true olmalı');
      }
      
      if (!capabilities.hasTables) {
        errors.push('Gecelik konaklama için oda sistemi gerekli');
      }
      break;

    case 'order':
      if (!capabilities.bookingModels.includes('order')) {
        errors.push('Sipariş için order modeli gerekli');
      }
      
      if (!capabilities.hasProductCatalog) {
        errors.push('Sipariş için ürün kataloğu gerekli');
      }
      break;

    case 'project':
      if (!capabilities.bookingModels.includes('appointment')) {
        warnings.push('Proje bazlı için appointment modeli önerilir');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Debug: Salon'un tüm ayarlarını logla
 */
export function debugSalonSetup(salon: Salon): void {
  console.group(`🔍 Salon Setup Debug: ${salon.name}`);
  
  const anySalon = salon as any;
  
  console.log('📋 Temel Bilgiler:', {
    id: salon.id,
    name: salon.name,
    category: salon.category,
    isActive: salon.isActive
  });

  if (anySalon.capabilities) {
    console.log('✨ Capabilities:', anySalon.capabilities);
    
    const validation = validateCapabilities(anySalon.capabilities);
    console.log('✅ Doğrulama:', validation);
  } else {
    console.warn('⚠️ Capabilities YOK - Legacy sistem');
  }

  console.log('👥 Personel:', {
    count: salon.staff?.length || 0,
    hasStaff: anySalon.capabilities?.hasStaff
  });

  console.log('💼 Hizmetler:', {
    count: salon.services?.length || 0,
    categories: [...new Set(salon.services?.map(s => s.category) || [])]
  });

  console.log('⏰ Çalışma Saatleri:', {
    configured: !!salon.workingHours && Array.isArray(salon.workingHours) && salon.workingHours.length > 0,
    openDays: Array.isArray(salon.workingHours) ? salon.workingHours.filter((wh: any) => wh.isOpen).length : 0
  });

  const salonValidation = validateSalon(salon);
  if (salonValidation.errors.length > 0) {
    console.error('❌ Hatalar:', salonValidation.errors);
  }
  if (salonValidation.warnings.length > 0) {
    console.warn('⚠️ Uyarılar:', salonValidation.warnings);
  }
  
  console.groupEnd();
}
