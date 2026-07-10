import type { Service } from '@/types';

export type ExtraPriceType = 'fixed' | 'per-night' | 'per-person' | 'per-person-per-night';

/**
 * Ek hizmetin fiyatlandırma tipini belirler
 * Önce pricingRules.priceType'a bakar, yoksa isimden tahmin eder
 */
export function getExtraPriceType(extra: Service): ExtraPriceType {
  // Önce explicit pricingRules'a bak
  if (extra.pricingRules && 'priceType' in extra.pricingRules && extra.pricingRules.priceType) {
    return extra.pricingRules.priceType;
  }
  
  // İsimden akıllı tahmin
  const name = extra.name.toLowerCase();
  
  // Kahvaltı, yemek gibi her gün her kişi için olanlar
  if (
    name.includes('kahvaltı') || 
    name.includes('breakfast') ||
    name.includes('yemek') ||
    name.includes('meal') ||
    name.includes('kişi başı') || 
    name.includes('per person')
  ) {
    return 'per-person-per-night';
  }
  
  // Gece başı (ekstra yatak, oda gibi)
  if (
    name.includes('gece başı') || 
    name.includes('per night') || 
    name.includes('günlük') ||
    name.includes('yatak') ||
    name.includes('bed')
  ) {
    return 'per-night';
  }
  
  // Sadece kişi başı tek seferlik (spa, masaj, aktivite)
  if (
    name.includes('spa') || 
    name.includes('masaj') || 
    name.includes('massage') ||
    name.includes('aktivite') ||
    name.includes('activity')
  ) {
    return 'per-person';
  }
  
  // Varsayılan: sabit fiyat
  return 'fixed';
}

/**
 * Ek hizmet toplam fiyatını hesaplar
 */
export function calcExtraTotal(
  extra: Service, 
  quantity: number, 
  totalGuests: number
): number {
  const priceType = getExtraPriceType(extra);
  
  switch (priceType) {
    case 'per-night':
      // Gece başı (örn: ekstra yatak)
      return extra.price * quantity;
      
    case 'per-person':
      // Kişi başı tek seferlik (örn: spa, masaj)
      return extra.price * totalGuests;
      
    case 'per-person-per-night':
      // Kişi başı × gece (örn: kahvaltı)
      return extra.price * totalGuests * quantity;
      
    case 'fixed':
    default:
      // Sabit fiyat (örn: havaalanı transferi)
      return extra.price;
  }
}

/**
 * Ek hizmet için varsayılan miktar belirler
 */
export function getDefaultQuantity(extra: Service, nights: number): number {
  const priceType = getExtraPriceType(extra);
  
  switch (priceType) {
    case 'per-night':
    case 'per-person-per-night':
      // Gece sayısı kadar varsayılan
      return nights;
      
    case 'per-person':
    case 'fixed':
    default:
      // Tek seferlik için 1
      return 1;
  }
}

/**
 * Fiyat etiketi döndürür (UI için)
 */
export function getPriceLabel(priceType: ExtraPriceType): string {
  switch (priceType) {
    case 'per-night':
      return '/gece';
    case 'per-person':
      return '/kişi';
    case 'per-person-per-night':
      return '/kişi/gece';
    case 'fixed':
    default:
      return '';
  }
}

/**
 * Fiyat hesaplama formülü açıklaması döndürür (debug/log için)
 */
export function getPriceFormula(
  extra: Service,
  quantity: number,
  totalGuests: number,
  totalPrice: number
): string {
  const priceType = getExtraPriceType(extra);
  
  switch (priceType) {
    case 'per-night':
      return `${extra.price}₺ × ${quantity} gece = ${totalPrice}₺`;
      
    case 'per-person':
      return `${extra.price}₺ × ${totalGuests} kişi = ${totalPrice}₺`;
      
    case 'per-person-per-night':
      return `${extra.price}₺ × ${totalGuests} kişi × ${quantity} gece = ${totalPrice}₺`;
      
    case 'fixed':
    default:
      return `${totalPrice}₺ (sabit)`;
  }
}
