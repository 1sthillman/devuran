import type { SubscriptionPlanType, SubscriptionInterval } from '@/types/subscription';

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
  features: {
    maxTables: number | 'unlimited';
    maxMenuItems: number | 'unlimited';
    maxCategories: number | 'unlimited';
    maxStaff: number | 'unlimited';
    maxMonthlyOrders: number | 'unlimited';
    qrCodeGeneration: boolean;
    kitchenDisplay: boolean;
    waiterApp: boolean;
    cashierPanel: boolean;
    tableManagement: boolean;
    orderTracking: boolean;
    customerNotifications: boolean;
    advancedAnalytics: boolean;
    multiLocation: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
}

export const RESTAURANT_SUBSCRIPTION_PLANS: RestaurantSubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Başlangıç',
    description: 'Küçük kafeler ve restoranlar için',
    pricing: {
      monthly: 499,
      quarterly: 1347,
      'semi-annual': 2543,
      annual: 4790,
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 10,
      maxMenuItems: 50,
      maxCategories: 10,
      maxStaff: 3,
      maxMonthlyOrders: 500,
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
    description: 'Orta ölçekli restoranlar için',
    popular: true,
    pricing: {
      monthly: 999,
      quarterly: 2697,
      'semi-annual': 5093,
      annual: 9590,
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 30,
      maxMenuItems: 200,
      maxCategories: 20,
      maxStaff: 10,
      maxMonthlyOrders: 2000,
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
      customBranding: false,
    },
  },
  {
    id: 'business',
    name: 'İşletme',
    description: 'Büyük restoranlar ve zincirler için',
    pricing: {
      monthly: 1999,
      quarterly: 5397,
      'semi-annual': 10193,
      annual: 19190,
    },
    discounts: {
      monthly: 0,
      quarterly: 10,
      'semi-annual': 15,
      annual: 20,
    },
    features: {
      maxTables: 100,
      maxMenuItems: 500,
      maxCategories: 50,
      maxStaff: 30,
      maxMonthlyOrders: 10000,
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
    description: 'Restoran zincirleri ve franchise\'lar için',
    pricing: {
      monthly: 3999,
      quarterly: 10797,
      'semi-annual': 20393,
      annual: 38390,
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
      maxStaff: 'unlimited',
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
    name: 'Özel',
    description: 'Özel ihtiyaçlarınıza göre tasarlanmış çözüm',
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
      maxStaff: 'unlimited',
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
