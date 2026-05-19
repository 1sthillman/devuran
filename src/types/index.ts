export interface Service {
  id: string;
  salonId?: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  gender: 'male' | 'female' | 'all';
  staffIds: string[];
  image?: string; // Hizmet görseli
  isActive: boolean;
}

export interface Staff {
  id: string;
  salonId?: string;
  name: string;
  title: string;
  photo: string;
  media?: MediaItem[]; // Yeni: Personel medyası
  phone?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  workingDays: number[];
  workingHours?: Record<string, { start: string; end: string }>;
  color: string;
  isActive: boolean;
  // Fiyat aralığı
  priceRange?: {
    min: number; // Minimum fiyat
    max: number; // Maximum fiyat
  };
}

export interface Review {
  id: string;
  salonId: string;
  staffId: string; // Staff ID for staff-specific reviews
  userId: string;
  customerName: string;
  customerAvatar: string;
  rating: number; // Salon rating
  staffRating: number; // Staff rating (separate)
  comment: string;
  serviceNames: string[];
  staffName: string;
  media?: MediaItem[]; // Yeni: Yorum medyası
  ownerResponse?: string;
  date: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  base64: string;
  thumbnail?: string;
  size: number;
  width: number;
  height: number;
  duration?: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  category: 
    | 'kuafor' | 'berber' | 'guzellik' | 'tirnak'
    | 'dugun-organizasyon' | 'nisan-organizasyon' | 'evlilik-teklifi'
    | 'dogum-gunu' | 'kurumsal-etkinlik'
    | 'dugun-salonu' | 'etkinlik-alani'
    | 'bungalov' | 'otel' | 'villa' | 'kamp-alani'
    | 'fotograf' | 'video-produksiyon' | 'drone-cekim'
    | 'catering' | 'pasta-tatli' | 'kahve-ikram';
  description: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: {
    full: string;
    district: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  coverImage: string;
  logo?: string;
  galleryImages: string[];
  media?: MediaItem[]; // Yeni: Sıkıştırılmış medya
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  workingHours: Record<string, { open: string; close: string; isOpen?: boolean }>;
  services: Service[];
  staff: Staff[];
  stats: {
    averageRating: number;
    reviewCount: number;
    totalAppointments: number;
  };
  settings: {
    advanceBookingDays: number;
    autoConfirm: boolean;
    allowCancellation: boolean;
    cancellationHours: number;
    allowQueue: boolean; // Sıra sistemi aktif mi?
    autoConfirmQueue: boolean; // Sıradan randevuya otomatik geçiş
  };
  paymentSettings?: {
    bankTransferEnabled: boolean;
    bankAccounts?: {
      bankName: string;
      accountHolder: string;
      iban: string;
      accountNumber?: string;
      branch?: string;
    }[];
    paymentInstructions?: string;
  };
  capacity?: {
    enabled: boolean;
    maxCapacity?: number;
    minCapacity?: number;
  };
  isPremium: boolean;
  isActive: boolean;
  isAcceptingBookings: boolean; // Anlık randevu açık/kapalı
}

export interface BookingData {
  salonId: string;
  selectedServices: Service[];
  selectedStaffId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  customerInfo: {
    name: string;
    phone: string;
    notes: string;
  };
  totalPrice: number;
  totalDuration: number;
}

// Rezervasyon Tipleri
export type ReservationType = 'slot' | 'daily' | 'nightly' | 'project' | 'order';

export type ReservationStatus = 
  | 'pending'
  | 'confirmed'
  | 'deposit_paid'
  | 'fully_paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_user'
  | 'cancelled_by_business'
  | 'no_show'
  | 'expired';

// Ödeme Bilgileri
export interface PaymentInfo {
  basePrice: number;
  extrasTotal: number;
  discountAmount: number;
  discountReason?: string;
  taxAmount: number;
  totalAmount: number;
  depositRequired: boolean;
  depositAmount: number;
  depositPercentage: number;
  depositPaidAt?: string;
  depositPaymentId?: string;
  depositPaymentMethod?: 'bank_transfer' | 'credit_card' | 'cash' | 'online';
  finalAmount: number;
  finalPaidAt?: string;
  finalPaymentId?: string;
  finalPaymentMethod?: 'bank_transfer' | 'credit_card' | 'cash' | 'online';
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  currency: 'TRY' | 'USD' | 'EUR';
}

// İptal Politikası
export interface CancellationPolicy {
  allowed: boolean;
  deadline: string;
  rules: {
    daysBeforeEvent: number;
    refundPercentage: number;
  }[];
  penaltyAmount?: number;
  noShowPenalty?: number;
}

// Temel Rezervasyon
export interface BaseReservation {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: ReservationStatus;
  type: ReservationType;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  internalNotes?: string;
  pricing: PaymentInfo;
  cancellationPolicy: CancellationPolicy;
}

// Slot Bazlı (Kuaför, Fotoğraf)
export interface SlotReservation extends BaseReservation {
  type: 'slot';
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  staffId?: string;
  staffName?: string;
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  location?: 'studio' | 'outdoor' | 'home' | 'business';
  address?: string;
}

// Günlük Kiralama (Salon, Etkinlik)
export interface DailyRentalReservation extends BaseReservation {
  type: 'daily';
  eventDate: string;
  startTime: string;
  endTime: string;
  setupTime?: string;
  cleanupTime?: string;
  venueType: string;
  capacity: number;
  package: {
    id: string;
    name: string;
    includes: string[];
    price: number;
  };
  extras: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  eventType: 'wedding' | 'engagement' | 'birthday' | 'corporate' | 'other';
}

// Gecelik Konaklama (Otel, Villa)
export interface NightlyBookingReservation extends BaseReservation {
  type: 'nightly';
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomNumber?: string;
  roomCount: number;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  mealPlan?: 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  extras: {
    id: string;
    name: string;
    date?: string;
    price: number;
  }[];
  specialRequests?: string;
}

// Proje Bazlı (Organizasyon)
export interface ProjectReservation extends BaseReservation {
  type: 'project';
  eventDate: string;
  eventType: 'wedding' | 'engagement' | 'proposal' | 'other';
  venue?: string;
  guestCount: number;
  budget: {
    min: number;
    max: number;
  };
  package: {
    id: string;
    name: string;
    tier: 'basic' | 'standard' | 'premium' | 'luxury';
    includes: string[];
    price: number;
  };
  meetings: {
    id: string;
    date: string;
    type: 'initial' | 'planning' | 'tasting' | 'final';
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
  }[];
  milestones: {
    id: string;
    name: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
  }[];
  subServices: {
    type: 'venue' | 'catering' | 'photography' | 'video' | 'music' | 'flowers' | 'decoration';
    providerId?: string;
    providerName?: string;
    status: 'pending' | 'confirmed' | 'completed';
    price: number;
  }[];
}

// Sipariş Bazlı (Catering, Pasta)
export interface OrderReservation extends BaseReservation {
  type: 'order';
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  orderType: 'catering' | 'cake' | 'dessert' | 'coffee_service';
  items: {
    id: string;
    name: string;
    quantity: number;
    unit: 'piece' | 'portion' | 'kg' | 'person';
    price: number;
    customization?: string;
  }[];
  servingStyle?: 'buffet' | 'plated' | 'cocktail' | 'family_style';
  equipment?: {
    tables: number;
    chairs: number;
    servingStaff: number;
  };
  tastingSession?: {
    date: string;
    status: 'scheduled' | 'completed';
  };
}

// Birleşik Rezervasyon Tipi
export type Reservation = 
  | SlotReservation 
  | DailyRentalReservation 
  | NightlyBookingReservation 
  | ProjectReservation 
  | OrderReservation;

// Eski Appointment interface'i geriye dönük uyumluluk için
export interface Appointment {
  id: string;
  userId: string;
  salonId: string;
  salonName: string;
  salonCover: string;
  salonAddress: string;
  customerName: string;
  customerPhone: string;
  staffId: string;
  staffName: string;
  staffPhoto: string;
  services: { id: string; name: string; price: number; duration: number }[];
  date: string;
  time: string;
  endTime: string;
  totalDuration: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'upcoming';
  notes: string;
  whatsappNumber: string;
  queuePosition?: number;
  isQueued?: boolean;
  hasReview?: boolean;
  reviewId?: string;
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'salon';
  cancelledAt?: string;
  completedAt?: string;
  actualEndTime?: string;
}

export interface QueueEntry {
  id: string;
  appointmentId: string;
  userId: string;
  salonId: string;
  staffId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;
  services: { id: string; name: string; price: number; duration: number }[];
  preferredDate?: string; // Tercih edilen tarih (opsiyonel)
  preferredTime?: string; // Tercih edilen saat (opsiyonel)
  queuePosition: number;
  totalPrice: number;
  totalDuration: number;
  notes: string;
  createdAt: string;
  notified: boolean; // Bildirim gönderildi mi?
}

export interface BannedUser {
  id: string;
  userId: string;
  salonId: string;
  bannedBy: string; // Salon owner ID
  reason: string;
  bannedAt: string;
  customerName: string;
  customerPhone: string;
}

export interface SalonCustomerRating {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment?: string;
  ratedBy: string; // Salon owner ID
  ratedAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  photoURL?: string;
  role: 'customer' | 'owner' | 'admin';
  salonId?: string;
  onboardingCompleted?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
