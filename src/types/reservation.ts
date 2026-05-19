import type { CategoryId } from '@/config/categories';

// Rezervasyon tipleri - her kategori için farklı
export type ReservationType = 
  | 'slot'        // Saatlik slot (kuaför, berber, güzellik, tırnak, fotoğraf)
  | 'project'     // Proje bazlı (düğün org, nişan org, evlilik teklifi, doğum günü, kurumsal)
  | 'rental'      // Kiralama (düğün salonu, etkinlik alanı)
  | 'booking'     // Geceleme (otel, villa, bungalov, kamp alanı)
  | 'order'       // Sipariş (catering, pasta, kahve)
  | 'session';    // Seans (drone çekim, video prodüksiyon)

// Her kategori için rezervasyon tipi mapping
export const CATEGORY_RESERVATION_TYPE: Record<CategoryId, ReservationType> = {
  // Slot bazlı - saatlik randevu
  'kuafor': 'slot',
  'berber': 'slot',
  'guzellik': 'slot',
  'tirnak': 'slot',
  
  // Proje bazlı - uzun vadeli planlama
  'dugun-organizasyon': 'project',
  'nisan-organizasyon': 'project',
  'evlilik-teklifi': 'project',
  'dogum-gunu': 'project',
  'kurumsal-etkinlik': 'project',
  
  // Kiralama - tam gün/yarım gün
  'dugun-salonu': 'rental',
  'etkinlik-alani': 'rental',
  
  // Geceleme - giriş/çıkış tarihi
  'bungalov': 'booking',
  'otel': 'booking',
  'villa': 'booking',
  'kamp-alani': 'booking',
  
  // Medya - seans bazlı
  'fotograf': 'session',
  'video-produksiyon': 'session',
  'drone-cekim': 'session',
  
  // Sipariş - teslimat bazlı
  'catering': 'order',
  'pasta-tatli': 'order',
  'kahve-ikram': 'order',
};

// Sıra sistemi sadece bu kategorilerde aktif
export const QUEUE_ENABLED_CATEGORIES: CategoryId[] = [
  'kuafor',
  'berber',
  'guzellik',
  'tirnak'
];

// Temel rezervasyon interface
export interface BaseReservation {
  id: string;
  type: ReservationType;
  businessId: string;
  businessName: string;
  businessCategory: CategoryId;
  userId: string;
  userName: string;
  userPhone: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

// Slot bazlı rezervasyon (Kuaför, Berber, Güzellik)
export interface SlotReservation extends BaseReservation {
  type: 'slot';
  date: Date;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  duration: number;  // dakika
  staffId: string;
  staffName: string;
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  totalPrice: number;
  // Sıra sistemi için
  queueNumber?: number;
  isWalkIn?: boolean; // Randevusuz geldi mi?
}

// Proje bazlı rezervasyon (Düğün Organizasyonu)
export interface ProjectReservation extends BaseReservation {
  type: 'project';
  eventDate: Date;
  eventType: string; // "Düğün", "Nişan", "Doğum Günü"
  guestCount: number;
  package: {
    id: string;
    name: string; // "Ekonomik", "Standart", "Premium", "Lüks"
    price: number;
    features: string[];
  };
  // Aşamalı süreç
  milestones: {
    id: string;
    name: string; // "Ön Görüşme", "Sözleşme", "Planlama", "Final"
    date: Date;
    status: 'pending' | 'completed';
    notes?: string;
  }[];
  // Ek hizmetler
  extras: {
    id: string;
    name: string; // "Fotoğraf", "Video", "Müzik", "Çiçek"
    provider?: string;
    price: number;
  }[];
  // Ödeme planı
  payment: {
    total: number;
    deposit: number;
    depositPaid: boolean;
    depositDate?: Date;
    remaining: number;
    finalPaymentDate: Date;
    finalPaid: boolean;
  };
  // Sözleşme
  contract?: {
    signed: boolean;
    signedDate?: Date;
    documentUrl?: string;
  };
}

// Kiralama bazlı rezervasyon (Düğün Salonu, Etkinlik Alanı)
export interface RentalReservation extends BaseReservation {
  type: 'rental';
  date: Date;
  startTime: string; // "14:00"
  endTime: string;   // "23:00"
  duration: number;  // saat
  capacity: number;  // kişi
  package: {
    id: string;
    name: string; // "Sadece Mekan", "Mekan + Catering", "Full Paket"
    price: number;
    includes: string[];
  };
  extras: {
    id: string;
    name: string; // "Dekorasyon", "Ses Sistemi", "Işık Show"
    price: number;
  }[];
  totalPrice: number;
  // Ödeme
  payment: {
    deposit: number;
    depositPaid: boolean;
    remaining: number;
    finalPaid: boolean;
  };
  // Hazırlık süresi
  setupTime: number; // saat
  cleanupTime: number; // saat
}

// Geceleme bazlı rezervasyon (Otel, Villa, Bungalov)
export interface BookingReservation extends BaseReservation {
  type: 'booking';
  checkIn: Date;
  checkOut: Date;
  nights: number;
  roomType: string; // "Standart Oda", "Suit", "Villa"
  roomNumber?: string;
  guestCount: {
    adults: number;
    children: number;
  };
  // Ek hizmetler
  extras: {
    id: string;
    name: string; // "Kahvaltı", "Havuz", "Spa", "Transfer"
    pricePerNight?: number;
    priceTotal?: number;
  }[];
  totalPrice: number;
  pricePerNight: number;
  // Ödeme
  payment: {
    deposit: number;
    depositPaid: boolean;
    remaining: number;
    finalPaid: boolean;
  };
  // Özel istekler
  specialRequests?: string;
}

// Sipariş bazlı rezervasyon (Catering, Pasta)
export interface OrderReservation extends BaseReservation {
  type: 'order';
  deliveryDate: Date;
  deliveryTime: string; // "14:00"
  deliveryAddress: string;
  eventType: string; // "Düğün", "Doğum Günü", "Kurumsal"
  guestCount: number;
  menu: {
    id: string;
    name: string; // "Açık Büfe", "Oturmalı Yemek", "Kokteyl"
    pricePerPerson: number;
    items: string[];
  };
  extras: {
    id: string;
    name: string; // "Pasta", "İçecek", "Servis Elemanı"
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  // Ödeme
  payment: {
    deposit: number;
    depositPaid: boolean;
    remaining: number;
    finalPaid: boolean;
  };
  // Tadım randevusu
  tastingAppointment?: {
    date: Date;
    completed: boolean;
  };
}

// Seans bazlı rezervasyon (Fotoğraf, Video, Drone)
export interface SessionReservation extends BaseReservation {
  type: 'session';
  date: Date;
  startTime: string;
  duration: number; // saat
  sessionType: string; // "Düğün", "Bebek", "Aile", "Ürün", "Dış Mekan"
  location: {
    type: 'studio' | 'outdoor' | 'client-location';
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  package: {
    id: string;
    name: string; // "Temel", "Standart", "Premium"
    price: number;
    includes: string[]; // "2 saat çekim", "50 fotoğraf", "Online galeri"
  };
  extras: {
    id: string;
    name: string; // "Ek saat", "Albüm", "Video klip"
    price: number;
  }[];
  totalPrice: number;
  // Ödeme
  payment: {
    deposit: number;
    depositPaid: boolean;
    remaining: number;
    finalPaid: boolean;
  };
  // Teslimat
  delivery: {
    digitalDate: Date; // Dijital teslimat
    physicalDate?: Date; // Albüm teslimat
    delivered: boolean;
  };
  // Hava durumu yedek (dış mekan için)
  backupDate?: Date;
}

// Union type - tüm rezervasyon tipleri
export type Reservation = 
  | SlotReservation 
  | ProjectReservation 
  | RentalReservation 
  | BookingReservation 
  | OrderReservation 
  | SessionReservation;

// İptal politikası
export interface CancellationPolicy {
  allowed: boolean;
  deadline: Date; // Bu tarihten sonra iptal edilemez
  refundPercentage: number; // İade oranı (0-100)
  penaltyAmount?: number; // Sabit ceza bedeli
}

// Sıra sistemi
export interface QueueEntry {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userPhone: string;
  queueNumber: number;
  serviceType: string;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no-show';
  estimatedWaitTime: number; // dakika
  createdAt: Date;
  calledAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

// Müsaitlik kontrolü için helper
export function getReservationType(category: CategoryId): ReservationType {
  return CATEGORY_RESERVATION_TYPE[category];
}

export function canUseQueue(category: CategoryId): boolean {
  return QUEUE_ENABLED_CATEGORIES.includes(category);
}

// Rezervasyon durumu renkleri
export const RESERVATION_STATUS_COLORS = {
  'pending': 'text-yellow-400 bg-yellow-400/10',
  'confirmed': 'text-blue-400 bg-blue-400/10',
  'in-progress': 'text-purple-400 bg-purple-400/10',
  'completed': 'text-green-400 bg-green-400/10',
  'cancelled': 'text-red-400 bg-red-400/10',
  'no-show': 'text-gray-400 bg-gray-400/10',
};

// Rezervasyon durumu etiketleri
export const RESERVATION_STATUS_LABELS = {
  'pending': 'Beklemede',
  'confirmed': 'Onaylandı',
  'in-progress': 'Devam Ediyor',
  'completed': 'Tamamlandı',
  'cancelled': 'İptal Edildi',
  'no-show': 'Gelmedi',
};
