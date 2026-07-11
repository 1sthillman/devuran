/**
 * ============================================================================
 * ESKİ İŞLETMELERİ YENİ SİSTEME GÜNCELLEME ARACI
 * ============================================================================
 * 
 * Legacy kategori sisteminden capabilities sistemine geçiş için
 * otomatik migration aracı
 */

import type { Salon } from '@/types';
import type { BusinessCapabilities } from '@/types/businessCapabilities';
import { BUSINESS_PRESETS } from '@/config/businessPresets';

/**
 * Legacy kategori string'inden preset ID'sine mapping
 */
const LEGACY_CATEGORY_TO_PRESET: Record<string, string> = {
  // Güzellik & Bakım
  'kuafor': 'hairdresser',
  'berber': 'barber',
  'guzellik': 'beauty',
  'tirnak': 'nails',
  
  // Restoran & Kafe
  'restoran': 'restaurant',
  'kafe': 'cafe',
  
  // Konaklama
  'otel': 'hotel',
  'villa': 'villa',
  'bungalov': 'bungalow',
  'kamp-alani': 'bungalow',
  
  // Etkinlik
  'dugun-salonu': 'wedding_hall',
  'etkinlik-alani': 'event_venue',
  
  // Medya
  'fotograf': 'photographer',
  'video-produksiyon': 'videographer',
  'drone-cekim': 'videographer',
  
  // Sipariş
  'catering': 'catering',
  'pasta-tatli': 'catering',
  'kahve-ikram': 'catering',
  
  // Organizasyon (custom capabilities gerekir)
  'dugun-organizasyon': 'photographer', // En yakın preset
  'nisan-organizasyon': 'photographer',
  'evlilik-teklifi': 'photographer',
  'dogum-gunu': 'event_venue',
  'kurumsal-etkinlik': 'event_venue'
};

/**
 * Kategori bazlı default açıklamalar
 */
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  'kuafor': 'Profesyonel kuaför hizmetleri ile saç kesimi, boyama, bakım ve şekillendirme hizmetleri sunuyoruz.',
  'berber': 'Geleneksel berber hizmetleri, saç ve sakal kesimi, tıraş ve bakım hizmetleri.',
  'guzellik': 'Güzellik merkezi olarak cilt bakımı, makyaj, epilasyon ve estetik hizmetler sunuyoruz.',
  'tirnak': 'Profesyonel tırnak bakımı, manikür, pedikür ve protez tırnak uygulamaları.',
  'restoran': 'Lezzetli yemekler ve kaliteli hizmet anlayışı ile hizmetinizdeyiz.',
  'kafe': 'Özel kahveler, tatlılar ve sıcak bir ortamda hizmet veriyoruz.',
  'otel': 'Konforlu konaklama ve kaliteli hizmet anlayışı ile misafirlerimizi ağırlıyoruz.',
  'villa': 'Özel villa kiralama hizmeti ile unutulmaz tatil deneyimi sunuyoruz.',
  'fotograf': 'Profesyonel fotoğraf çekimi hizmetleri ile özel anlarınızı ölümsüzleştiriyoruz.',
  'default': 'Kaliteli hizmet anlayışı ile müşterilerimize en iyi deneyimi sunmak için çalışıyoruz.'
};

/**
 * Eski salonu yeni capabilities ile güncelle + EKSİK ALANLARI DOLDUR
 */
export function migrateToCapabilities(salon: Salon): Salon & { capabilities: BusinessCapabilities } {
  const anySalon = salon as any;
  
  // Zaten capabilities varsa, dokunma
  if (anySalon.capabilities) {
    return anySalon;
  }
  
  // Legacy kategoriyi preset'e çevir
  const presetId = LEGACY_CATEGORY_TO_PRESET[salon.category] || 'hairdresser';
  const capabilities = { ...BUSINESS_PRESETS[presetId] };
  
  // ✅ EKSİK ALANLARI OTOMATIK DOLDUR (validasyon için)
  const migratedSalon = { ...salon };
  
  // Description eksikse veya çok kısaysa
  if (!migratedSalon.description || migratedSalon.description.length < 10) {
    migratedSalon.description = DEFAULT_DESCRIPTIONS[salon.category] || DEFAULT_DESCRIPTIONS['default'];
  }
  
  // Phone eksikse (bazı eski salonlarda olabilir)
  if (!migratedSalon.phone) {
    migratedSalon.phone = '0000000000'; // Placeholder - kullanıcı sonra güncelleyebilir
  }
  
  // Address eksikse
  if (!migratedSalon.address) {
    migratedSalon.address = {
      full: 'Adres bilgisi güncellenecek',
      district: '',
      city: '',
      coordinates: { lat: 0, lng: 0 }
    } as any;
  }
  
  // WorkingHours eksikse - default ekle
  if (!migratedSalon.workingHours) {
    migratedSalon.workingHours = {
      monday: { isOpen: true, open: '09:00', close: '18:00' },
      tuesday: { isOpen: true, open: '09:00', close: '18:00' },
      wednesday: { isOpen: true, open: '09:00', close: '18:00' },
      thursday: { isOpen: true, open: '09:00', close: '18:00' },
      friday: { isOpen: true, open: '09:00', close: '18:00' },
      saturday: { isOpen: true, open: '09:00', close: '18:00' },
      sunday: { isOpen: false, open: '', close: '' }
    };
  }
  
  // Salon'daki mevcut verilere göre override yap
  
  // 1. Personel kontrolü
  if (salon.staff && Array.isArray(salon.staff) && salon.staff.length > 0) {
    capabilities.hasStaff = true;
  }
  
  // 2. Kuyruk sistemi
  if (salon.settings?.allowQueue) {
    capabilities.hasQueue = true;
    if (!capabilities.bookingModels.includes('walk-in-queue')) {
      capabilities.bookingModels.push('walk-in-queue');
    }
  }
  
  // 3. Organizasyon kategorileri için özel ayarlar
  if (['dugun-organizasyon', 'nisan-organizasyon', 'evlilik-teklifi'].includes(salon.category)) {
    capabilities.bookingModels = ['appointment'];
    capabilities.isDurationBased = true;
    capabilities.requiresDeposit = true;
    capabilities.autoConfirmDefault = false;
  }
  
  return {
    ...migratedSalon,
    capabilities
  };
}

/**
 * Toplu migration - tüm salonları güncelle
 */
export function bulkMigrateToCapabilities(salons: Salon[]): (Salon & { capabilities: BusinessCapabilities })[] {
  return salons.map(migrateToCapabilities);
}

/**
 * Salon capabilities'i eksik mi kontrol et
 */
export function needsCapabilitiesMigration(salon: Salon): boolean {
  const anySalon = salon as any;
  return !anySalon.capabilities;
}

/**
 * Capabilities eksik olan salonların sayısını al
 */
export function countSalonsNeedingMigration(salons: Salon[]): number {
  return salons.filter(needsCapabilitiesMigration).length;
}
