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
 * Eski salonu yeni capabilities ile güncelle
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
    ...salon,
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
