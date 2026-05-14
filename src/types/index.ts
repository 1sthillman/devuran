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
  queuePosition?: number; // Sıra numarası (sıraya alındıysa)
  isQueued?: boolean; // Sırada mı?
  hasReview?: boolean; // Değerlendirme yapıldı mı?
  reviewId?: string; // Değerlendirme ID'si
  cancellationReason?: string; // İptal nedeni
  cancelledBy?: 'customer' | 'salon'; // Kim iptal etti
  cancelledAt?: string; // İptal tarihi
  completedAt?: string; // Tamamlanma tarihi (erken bitirme için)
  actualEndTime?: string; // Gerçek bitiş saati (erken bitirme için)
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
