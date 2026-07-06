// Abonelik Paket Tipleri
export type SubscriptionPlanType = 'starter' | 'professional' | 'business' | 'enterprise' | 'custom';
export type SubscriptionInterval = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'pending';

// Özellik Limitleri
export interface PlanFeatures {
  // Personel Yönetimi (Sadece salon için - restoran için kullanılmaz)
  maxStaff?: number | 'unlimited';
  
  // Hizmet Yönetimi (salon için)
  maxServices?: number | 'unlimited';
  
  // Randevu & Rezervasyon
  maxMonthlyBookings?: number | 'unlimited';
  
  // Restoran Özellikleri
  maxTables?: number | 'unlimited';
  maxMenuItems?: number | 'unlimited';
  maxCategories?: number | 'unlimited';
  maxMonthlyOrders?: number | 'unlimited';
  qrCodeGeneration?: boolean;
  kitchenDisplay?: boolean;
  waiterApp?: boolean;
  cashierPanel?: boolean;
  tableManagement?: boolean;
  orderTracking?: boolean;
  customerNotifications?: boolean;
  
  // Müşteri Yönetimi
  customerManagement?: boolean;
  customerNotes?: boolean;
  customerTags?: boolean;
  loyaltyProgram?: boolean;
  
  // Analitik & Raporlama
  basicAnalytics?: boolean;
  advancedAnalytics?: boolean;
  customReports?: boolean;
  exportData?: boolean;
  
  // İletişim
  smsNotifications?: boolean;
  emailNotifications?: boolean;
  whatsappIntegration?: boolean;
  
  // Sıra Sistemi
  queueManagement?: boolean;
  
  // Değerlendirme & Yorumlar
  reviewManagement?: boolean;
  reviewResponses?: boolean;
  
  // Ödeme
  onlinePayments?: boolean;
  depositPayments?: boolean;
  
  // Özelleştirme
  customBranding?: boolean;
  customDomain?: boolean;
  
  // Destek
  supportLevel?: 'email' | 'priority' | 'dedicated';
  prioritySupport?: boolean; // Restoran için
  
  // Diğer
  multiLocation?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
}

// Abonelik Planı
export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  description: string;
  features: PlanFeatures;
  pricing: {
    monthly: number;
    quarterly: number; // 3 aylık (indirimli)
    'semi-annual': number; // 6 aylık (daha fazla indirimli)
    annual: number; // Yıllık (en fazla indirimli)
  };
  discounts: {
    monthly: number; // % indirim
    quarterly: number; // % indirim
    'semi-annual': number;
    annual: number;
  };
  popular?: boolean;
  customPricing?: boolean;
}

// İşletme Aboneliği
export interface BusinessSubscription {
  id: string;
  businessId: string;
  businessName: string;
  
  // Plan Bilgileri
  planType: SubscriptionPlanType;
  interval: SubscriptionInterval;
  
  // Durum
  status: SubscriptionStatus;
  
  // Tarihler
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  cancelledAt?: string;
  
  // Fiyatlandırma
  price: number;
  currency: 'TRY';
  
  // Özelleştirilmiş Özellikler (custom plan için - sadece admin verebilir)
  customFeatures?: Partial<PlanFeatures>;
  // ⚠️ customPrice kaldırıldı - güvenlik nedeniyle artık desteklenmiyor
  
  // Ödeme Bilgileri
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  nextPaymentDate?: string;
  
  // Kullanım İstatistikleri
  usage: {
    staffCount: number;
    serviceCount: number;
    monthlyBookings: number;
    lastUpdated: string;
    lastResetDate?: string; // ✅ Son sayaç sıfırlama tarihi (CRITICAL FIX #7)
  };
  
  // ✅ CRITICAL FIX #12: Trial bypass prevention
  // Date: 2026-07-03
  // Permanent flag: Once set to true, never changes
  trialUsed?: boolean;
  
  // Bekleyen Plan Değişikliği (Admin onayı için)
  pendingPlanChange?: {
    requestedPlanType: SubscriptionPlanType;
    requestedPrice: number;
    requestedAt: string;
    requestStatus: 'pending' | 'approved' | 'rejected';
  };
  
  // Admin Onay Bilgileri
  approvedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  planChangedAt?: string;
  planChangedBy?: string;
  
  // Notlar
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Abonelik Geçmişi
export interface SubscriptionHistory {
  id: string;
  businessId: string;
  subscriptionId: string;
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'cancelled' | 'expired' | 'suspended';
  fromPlan?: SubscriptionPlanType;
  toPlan?: SubscriptionPlanType;
  amount?: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

// Özellik Erişim Kontrolü
export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  requiredPlan?: SubscriptionPlanType;
}
