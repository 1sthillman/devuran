import type { SubscriptionPlanType, SubscriptionInterval, PlanFeatures } from '@/types/subscription';

export interface RestaurantSubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  description: string;
  popular?: boolean;
  customPricing?: boolean;
  pricing: {
    monthly: number;
    quarterly: number;
    'semi-annual': number;
    annual: number;
  };
  discounts: {
    monthly: number;
    quarterly: number;
    'semi-annual': number;
    annual: number;
  };
  features: PlanFeatures;
}

export const RESTAURANT_SUBSCRIPTION_PLANS: RestaurantSubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Başlangıç',
    description: 'Küçük kafeler ve restoranlar için ideal başlangıç paketi',
    pricing: {
      monthly: 2000,
      quarterly: 5400, // %10 indirim
      'semi-annual': 10200, // %15 indirim
      annual: 19200, // %20 indirim
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 10,
      maxMenuItems: 20,
      maxCategories: 5,
      maxMonthlyOrders: 300,
      qrCodeGeneration: true,
      kitchenDisplay: true,
      waiterApp: true,
      cashierPanel: true,
      tableManagement: true,
      orderTracking: true,
      customerNotifications: false,
      advancedAnalytics: false,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    description: 'Orta ölçekli restoranlar için gelişmiş özellikler',
    popular: true,
    pricing: {
      monthly: 4000,
      quarterly: 10800, // %10 indirim
      'semi-annual': 20400, // %15 indirim
      annual: 38400, // %20 indirim
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 25,
      maxMenuItems: 50,
      maxCategories: 15,
      maxMonthlyOrders: 1000,
      qrCodeGeneration: true,
      kitchenDisplay: true,
      waiterApp: true,
      cashierPanel: true,
      tableManagement: true,
      orderTracking: true,
      customerNotifications: true,
      advancedAnalytics: true,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: true,
      customBranding: true,
    },
  },
  {
    id: 'business',
    name: 'İşletme',
    description: 'Büyük restoranlar ve çoklu şubeler için',
    pricing: {
      monthly: 7000,
      quarterly: 18900, // %10 indirim
      'semi-annual': 35700, // %15 indirim
      annual: 67200, // %20 indirim
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 50,
      maxMenuItems: 100,
      maxCategories: 30,
      maxMonthlyOrders: 3000,
      qrCodeGeneration: true,
      kitchenDisplay: true,
      waiterApp: true,
      cashierPanel: true,
      tableManagement: true,
      orderTracking: true,
      customerNotifications: true,
      advancedAnalytics: true,
      multiLocation: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    description: 'Restoran zincirleri ve franchise\'lar için sınırsız hizmet',
    pricing: {
      monthly: 12000,
      quarterly: 32400, // %10 indirim
      'semi-annual': 61200, // %15 indirim
      annual: 115200, // %20 indirim
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 'unlimited',
      maxMenuItems: 'unlimited',
      maxCategories: 'unlimited',
      maxMonthlyOrders: 'unlimited',
      qrCodeGeneration: true,
      kitchenDisplay: true,
      waiterApp: true,
      cashierPanel: true,
      tableManagement: true,
      orderTracking: true,
      customerNotifications: true,
      advancedAnalytics: true,
      multiLocation: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
  {
    id: 'custom',
    name: 'Özel Çözüm',
    description: 'İhtiyaçlarınıza özel tasarlanmış restoran paketi',
    customPricing: true,
    pricing: {
      monthly: 0,
      quarterly: 0,
      'semi-annual': 0,
      annual: 0,
    },
    discounts: {
      monthly: 0,
      quarterly: 0,
      'semi-annual': 0,
      annual: 0,
    },
    features: {
      maxTables: 'unlimited',
      maxMenuItems: 'unlimited',
      maxCategories: 'unlimited',
      maxMonthlyOrders: 'unlimited',
      qrCodeGeneration: true,
      kitchenDisplay: true,
      waiterApp: true,
      cashierPanel: true,
      tableManagement: true,
      orderTracking: true,
      customerNotifications: true,
      advancedAnalytics: true,
      multiLocation: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
];

// Restoran Özellikleri Açıklamaları
export const RESTAURANT_FEATURE_DESCRIPTIONS: Record<string, string> = {
  maxTables: 'Yönetebileceğiniz masa sayısı',
  maxMenuItems: 'Menünüze ekleyebileceğiniz ürün sayısı',
  maxCategories: 'Oluşturabileceğiniz kategori sayısı',
  maxMonthlyOrders: 'Aylık sipariş limiti',
  qrCodeGeneration: 'Masa için QR kod oluşturma',
  kitchenDisplay: 'Mutfak ekranı sistemi',
  waiterApp: 'Garson mobil uygulaması',
  cashierPanel: 'Kasa yönetim paneli',
  tableManagement: 'Masa yönetimi ve durum takibi',
  orderTracking: 'Sipariş takip sistemi',
  customerNotifications: 'Müşteri SMS ve bildirim sistemi',
  advancedAnalytics: 'Gelişmiş analitik ve raporlama (satış, stok, performans)',
  multiLocation: 'Çoklu şube yönetimi',
  apiAccess: 'API erişimi ve entegrasyonlar',
  prioritySupport: 'Öncelikli müşteri desteği',
  customBranding: 'Özel logo ve marka görünümü',
};
