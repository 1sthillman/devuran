import type { CategoryId } from '@/config/categories';
import type { Service, ServiceAddOn } from '@/types';

// Gelişmiş fiyatlandırma gerektiren kategoriler
export const CATEGORIES_WITH_ADVANCED_PRICING: CategoryId[] = [
  // Konaklama
  'bungalov',
  'otel',
  'villa',
  'kamp-alani',
  // Mekanlar
  'dugun-salonu',
  'etkinlik-alani',
  // Organizasyon
  'dugun-organizasyon',
  'nisan-organizasyon',
  'dogum-gunu',
  'kurumsal-etkinlik',
  // Catering
  'catering',
];

export function needsAdvancedPricing(category: CategoryId): boolean {
  return CATEGORIES_WITH_ADVANCED_PRICING.includes(category);
}

// Yaygın ek hizmet şablonları
export const COMMON_ADDONS: Record<string, ServiceAddOn[]> = {
  // Konaklama ek hizmetleri
  accommodation: [
    {
      id: 'breakfast',
      name: 'Kahvaltı',
      description: 'Açık büfe kahvaltı',
      price: 100,
      priceType: 'per-person',
      icon: 'Coffee',
      isActive: true,
    },
    {
      id: 'airport-transfer',
      name: 'Havaalanı Transferi',
      description: 'Gidiş-dönüş transfer hizmeti',
      price: 500,
      priceType: 'fixed',
      icon: 'Plane',
      isActive: true,
    },
    {
      id: 'extra-bed',
      name: 'Ekstra Yatak',
      description: 'Ek yatak hizmeti',
      price: 200,
      priceType: 'per-night',
      icon: 'Bed',
      isActive: true,
      maxQuantity: 2,
    },
    {
      id: 'spa',
      name: 'Spa & Masaj',
      description: 'Spa ve masaj hizmeti',
      price: 300,
      priceType: 'per-person',
      icon: 'Sparkles',
      isActive: true,
    },
  ],
  // Etkinlik ek hizmetleri
  event: [
    {
      id: 'decoration',
      name: 'Dekorasyon',
      description: 'Özel dekorasyon hizmeti',
      price: 2000,
      priceType: 'fixed',
      icon: 'Sparkles',
      isActive: true,
    },
    {
      id: 'photography',
      name: 'Fotoğraf Çekimi',
      description: 'Profesyonel fotoğraf hizmeti',
      price: 1500,
      priceType: 'fixed',
      icon: 'Camera',
      isActive: true,
    },
    {
      id: 'music',
      name: 'Müzik & DJ',
      description: 'DJ ve ses sistemi',
      price: 1000,
      priceType: 'fixed',
      icon: 'Music',
      isActive: true,
    },
  ],
  // Catering ek hizmetleri
  catering: [
    {
      id: 'waiter',
      name: 'Garson Hizmeti',
      description: 'Profesyonel garson hizmeti',
      price: 50,
      priceType: 'per-person',
      icon: 'Users',
      isActive: true,
    },
    {
      id: 'equipment',
      name: 'Ekipman Kiralama',
      description: 'Masa, sandalye, çadır vb.',
      price: 500,
      priceType: 'fixed',
      icon: 'Package',
      isActive: true,
    },
  ],
};

// Fiyat hesaplama
export function calculateServicePrice(
  service: Service,
  guests: number,
  nights: number = 1
): { basePrice: number; addOnsTotal: number; total: number; breakdown: any[] } {
  const breakdown: any[] = [];
  let basePrice = service.price;
  
  // Gelişmiş fiyatlandırma varsa
  if (service.pricingRules) {
    const rules = service.pricingRules;
    basePrice = rules.basePrice;
    
    // Kişi başı ücret
    if (rules.perPerson && guests > 1) {
      const extraGuests = guests - 1;
      const perPersonTotal = extraGuests * rules.perPerson;
      basePrice += perPersonTotal;
      breakdown.push({
        label: `Ekstra ${extraGuests} kişi`,
        amount: perPersonTotal,
      });
    }
    
    // Gece başı ücret
    if (rules.perNight && nights > 1) {
      const extraNights = nights - 1;
      const perNightTotal = extraNights * rules.perNight;
      basePrice += perNightTotal;
      breakdown.push({
        label: `Ekstra ${extraNights} gece`,
        amount: perNightTotal,
      });
    }
  }
  
  return {
    basePrice,
    addOnsTotal: 0,
    total: basePrice,
    breakdown,
  };
}
