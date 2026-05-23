# İşletme Yönetim Sistemi - Teknik Doküman

## Genel Bakış

İşletmelerin randevu, müşteri, personel, hizmet ve finansal verilerini merkezi bir sistemde yönetebilmesi için kapsamlı yönetim paneli.

---

## 1. İşletme Profil Yönetimi

### 1.1 Temel Bilgiler
```typescript
interface BusinessProfile {
  id: string;
  name: string;
  category: CategoryType;
  subCategory?: string;
  
  // İletişim
  phone: string;
  email: string;
  website?: string;
  
  // Adres
  address: {
    street: string;
    district: string;
    city: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  
  // Görsel
  logo?: string;
  coverImage?: string;
  gallery: string[];
  
  // Açıklama
  description: string;
  shortDescription: string;
  
  // Sosyal Medya
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Ayarlar
  settings: BusinessSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isPremium: boolean;
}
```

### 1.2 İşletme Ayarları
```typescript
interface BusinessSettings {
  // Randevu Ayarları
  booking: {
    autoConfirm: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
    cancellationPolicy: {
      allowCancellation: boolean;
      hoursBeforeAppointment: number;
      refundPercentage: number;
    };
    bufferTime: number; // Randevular arası boşluk (dakika)
    maxAdvanceBooking: number; // Kaç gün öncesine randevu alınabilir
    minAdvanceBooking: number; // En az kaç saat öncesinden
  };
  
  // Bildirim Ayarları
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    reminder: boolean;
    review: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  
  // Çalışma Saatleri
  workingHours: {
    [key: string]: { // monday, tuesday, etc.
      isOpen: boolean;
      shifts: Array<{
        start: string; // "09:00"
        end: string;   // "18:00"
      }>;
    };
  };
  
  // Tatil Günleri
  holidays: Array<{
    date: string;
    name: string;
    recurring: boolean; // Yıllık tekrar eder mi
  }>;
  
  // Ödeme Ayarları
  payment: {
    acceptCash: boolean;
    acceptCard: boolean;
    acceptOnline: boolean;
    bankAccounts: Array<{
      bankName: string;
      iban: string;
      accountHolder: string;
    }>;
  };
}
```

---

## 2. Personel Yönetimi

### 2.1 Personel Veri Yapısı
```typescript
interface Staff {
  id: string;
  businessId: string;
  
  // Kişisel Bilgiler
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  
  // Profesyonel Bilgiler
  title: string; // "Usta Kuaför", "Kıdemli Berber"
  specialties: string[]; // ["Saç Kesimi", "Boya", "Fön"]
  bio?: string;
  experience: number; // Yıl
  certifications: Array<{
    name: string;
    issuer: string;
    date: Date;
    document?: string;
  }>;
  
  // Çalışma Bilgileri
  workingHours: {
    [key: string]: {
      isWorking: boolean;
      shifts: Array<{
        start: string;
        end: string;
      }>;
    };
  };
  
  // İzin ve Tatiller
  leaves: Array<{
    startDate: Date;
    endDate: Date;
    reason: string;
    type: 'sick' | 'vacation' | 'personal';
  }>;
  
  // Hizmetler
  services: string[]; // Service ID'leri
  
  // Performans
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageRating: number;
    reviewCount: number;
    totalRevenue: number;
  };
  
  // Komisyon
  commission: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  
  // Durum
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Personel Yönetim Özellikleri

#### Performans Takibi
- Günlük/Haftalık/Aylık randevu sayısı
- Tamamlanan/İptal edilen randevu oranı
- Ortalama hizmet süresi
- Müşteri memnuniyeti skoru
- Gelir raporu (komisyon dahil)

#### Vardiya Yönetimi
- Esnek vardiya oluşturma
- Vardiya değişim talepleri
- Çakışma kontrolü
- Otomatik vardiya ataması

#### İzin Yönetimi
- İzin talep sistemi
- Onay/Red mekanizması
- İzin bakiyesi takibi
- Takvim entegrasyonu

---

## 3. Hizmet Yönetimi

### 3.1 Hizmet Veri Yapısı
```typescript
interface Service {
  id: string;
  businessId: string;
  
  // Temel Bilgiler
  name: string;
  description: string;
  category: string;
  
  // Fiyatlandırma
  pricing: {
    type: 'fixed' | 'range' | 'custom';
    basePrice: number;
    minPrice?: number;
    maxPrice?: number;
    currency: string;
  };
  
  // Süre
  duration: {
    min: number; // Dakika
    max: number;
    default: number;
  };
  
  // Görsel
  image?: string;
  
  // Personel
  availableStaff: string[]; // Staff ID'leri
  requiresSpecificStaff: boolean;
  
  // Kapasite
  capacity: {
    maxSimultaneous: number; // Aynı anda kaç kişiye verilebilir
    requiresRoom: boolean;
  };
  
  // Ön Koşullar
  requirements: {
    minAge?: number;
    requiresConsultation: boolean;
    requiresDeposit: boolean;
    depositAmount?: number;
  };
  
  // Ek Bilgiler
  tags: string[];
  isPopular: boolean;
  isActive: boolean;
  
  // İstatistikler
  stats: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Hizmet Paketleri
```typescript
interface ServicePackage {
  id: string;
  businessId: string;
  
  name: string;
  description: string;
  
  // Paket İçeriği
  services: Array<{
    serviceId: string;
    quantity: number;
  }>;
  
  // Fiyatlandırma
  originalPrice: number;
  packagePrice: number;
  discount: number; // Yüzde
  
  // Geçerlilik
  validity: {
    days: number; // Paket kaç gün geçerli
    expiryDate?: Date;
  };
  
  // Kullanım
  usage: {
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
  };
  
  isActive: boolean;
  createdAt: Date;
}
```

---

## 4. Randevu Yönetimi

### 4.1 Randevu Veri Yapısı
```typescript
interface Appointment {
  id: string;
  businessId: string;
  customerId: string;
  
  // Hizmet Bilgileri
  services: Array<{
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
  }>;
  
  // Personel
  staffId?: string;
  staffName?: string;
  
  // Zaman
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  duration: number; // Toplam dakika
  
  // Fiyat
  pricing: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  
  // Ödeme
  payment: {
    status: 'pending' | 'partial' | 'paid' | 'refunded';
    method?: 'cash' | 'card' | 'online' | 'bank_transfer';
    paidAmount: number;
    remainingAmount: number;
    depositAmount?: number;
    transactionId?: string;
    paidAt?: Date;
  };
  
  // Durum
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // İptal Bilgileri
  cancellation?: {
    cancelledBy: 'customer' | 'business';
    cancelledAt: Date;
    reason: string;
    refundAmount: number;
    refundStatus: 'pending' | 'processed';
  };
  
  // Notlar
  customerNotes?: string;
  businessNotes?: string;
  internalNotes?: string; // Sadece işletme görebilir
  
  // Bildirimler
  notifications: {
    confirmationSent: boolean;
    reminderSent: boolean;
    followUpSent: boolean;
  };
  
  // Kaynak
  source: 'web' | 'mobile' | 'phone' | 'walk_in' | 'admin';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
}
```

### 4.2 Randevu Yönetim Özellikleri

#### Takvim Görünümü
- Günlük/Haftalık/Aylık görünüm
- Personel bazlı filtreleme
- Hizmet bazlı filtreleme
- Drag & drop ile randevu taşıma
- Çakışma kontrolü
- Boş slot gösterimi

#### Toplu İşlemler
- Çoklu randevu oluşturma
- Toplu iptal
- Toplu onaylama
- Toplu bildirim gönderme
- Excel export/import

#### Otomatik İşlemler
- Otomatik onay (ayarlara göre)
- Otomatik hatırlatma (24 saat, 2 saat önce)
- Otomatik no-show işaretleme
- Otomatik follow-up mesajı

---

## 5. Müşteri Yönetimi (CRM)

### 5.1 Müşteri Veri Yapısı
```typescript
interface Customer {
  id: string;
  
  // Kişisel Bilgiler
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  photo?: string;
  
  // Adres
  address?: {
    street: string;
    district: string;
    city: string;
    postalCode: string;
  };
  
  // Tercihler
  preferences: {
    preferredStaff?: string[];
    preferredServices?: string[];
    preferredTimeSlots?: string[]; // "morning", "afternoon", "evening"
    communicationChannel: 'email' | 'sms' | 'both';
    language: string;
  };
  
  // Sağlık/Özel Bilgiler (Kategori bazlı)
  medicalInfo?: {
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes: string;
  };
  
  // İstatistikler
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowCount: number;
    totalSpent: number;
    averageSpent: number;
    lastVisit?: Date;
    firstVisit: Date;
  };
  
  // Sadakat
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    memberSince: Date;
  };
  
  // Notlar
  notes: Array<{
    id: string;
    note: string;
    createdBy: string;
    createdAt: Date;
    isPrivate: boolean;
  }>;
  
  // Etiketler
  tags: string[]; // "VIP", "Hassas", "Düzenli", vb.
  
  // Durum
  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 CRM Özellikleri

#### Müşteri Segmentasyonu
- Harcama bazlı (Yüksek, Orta, Düşük)
- Ziyaret sıklığı (Düzenli, Ara sıra, Tek seferlik)
- Son ziyaret tarihi (Aktif, Risk altında, Kayıp)
- Hizmet tercihi
- Özel etiketler

#### İletişim Yönetimi
- Toplu SMS/Email gönderimi
- Kişiselleştirilmiş mesajlar
- Doğum günü kutlamaları
- Özel kampanya bildirimleri
- Geri kazanım kampanyaları

#### Müşteri Geçmişi
- Tüm randevu geçmişi
- Hizmet geçmişi
- Ödeme geçmişi
- İletişim geçmişi
- Not geçmişi

---

## 6. Finansal Yönetim

### 6.1 Gelir Takibi
```typescript
interface Revenue {
  id: string;
  businessId: string;
  
  // Kaynak
  source: 'appointment' | 'package' | 'product' | 'other';
  sourceId?: string; // Appointment ID, Package ID, vb.
  
  // Tutar
  amount: number;
  currency: string;
  
  // Ödeme
  paymentMethod: 'cash' | 'card' | 'online' | 'bank_transfer';
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  
  // Kategori
  category: string; // "Hizmet", "Ürün", "Paket"
  
  // Personel (Komisyon için)
  staffId?: string;
  staffCommission?: number;
  
  // Tarih
  date: Date;
  
  // Notlar
  notes?: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}
```

### 6.2 Gider Takibi
```typescript
interface Expense {
  id: string;
  businessId: string;
  
  // Gider Bilgileri
  title: string;
  description?: string;
  amount: number;
  currency: string;
  
  // Kategori
  category: 'rent' | 'utilities' | 'supplies' | 'salary' | 'marketing' | 'other';
  
  // Ödeme
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  
  // Fatura
  invoice?: {
    number: string;
    vendor: string;
    document?: string;
  };
  
  // Tarih
  date: Date;
  
  // Onay
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}
```

### 6.3 Finansal Raporlar

#### Gelir Raporları
- Günlük/Haftalık/Aylık/Yıllık gelir
- Hizmet bazlı gelir dağılımı
- Personel bazlı gelir
- Ödeme yöntemi dağılımı
- Trend analizi

#### Gider Raporları
- Kategori bazlı gider dağılımı
- Aylık gider karşılaştırması
- Bütçe takibi
- Gider/Gelir oranı

#### Kar/Zarar Raporu
- Net kar hesaplama
- Brüt kar marjı
- İşletme giderleri
- Personel maliyetleri
- Vergi hesaplamaları

---

## 7. Envanter Yönetimi (Opsiyonel)

### 7.1 Ürün/Malzeme Takibi
```typescript
interface InventoryItem {
  id: string;
  businessId: string;
  
  // Ürün Bilgileri
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  
  // Kategori
  category: string;
  brand?: string;
  
  // Stok
  stock: {
    current: number;
    minimum: number; // Kritik seviye
    unit: string; // "adet", "litre", "kg"
  };
  
  // Fiyat
  costPrice: number;
  sellingPrice?: number;
  
  // Tedarikçi
  supplier?: {
    name: string;
    contact: string;
    leadTime: number; // Gün
  };
  
  // Durum
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 Stok Hareketleri
```typescript
interface StockMovement {
  id: string;
  itemId: string;
  
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  
  // Sebep
  reason: 'purchase' | 'sale' | 'usage' | 'waste' | 'return' | 'adjustment';
  
  // Referans
  referenceType?: 'appointment' | 'order';
  referenceId?: string;
  
  // Notlar
  notes?: string;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}
```

---

## 8. Raporlama ve Analitik

### 8.1 Dashboard Metrikleri

#### Genel Bakış
- Bugünkü randevu sayısı
- Bekleyen onaylar
- Bugünkü gelir
- Bu ayki toplam gelir
- Aktif müşteri sayısı
- Personel doluluk oranı

#### Performans Göstergeleri (KPI)
- Randevu tamamlanma oranı
- İptal oranı
- No-show oranı
- Ortalama randevu değeri
- Müşteri başına gelir
- Tekrar eden müşteri oranı
- Müşteri kazanım maliyeti

#### Trend Analizleri
- Günlük/Haftalık/Aylık gelir trendi
- Randevu sayısı trendi
- Popüler hizmetler
- Popüler saatler
- Mevsimsel değişimler

### 8.2 Özel Raporlar

#### Randevu Raporları
- Tarih aralığına göre randevular
- Personel performans raporu
- Hizmet popülerlik raporu
- İptal sebepleri analizi
- Zaman dilimi doluluk raporu

#### Müşteri Raporları
- Yeni müşteri raporu
- Kayıp müşteri raporu
- Müşteri yaşam boyu değeri
- Müşteri segmentasyon raporu
- Müşteri memnuniyet raporu

#### Finansal Raporlar
- Gelir-Gider raporu
- Kar/Zarar raporu
- Nakit akış raporu
- Vergi raporu
- Komisyon raporu

---

## 9. Bildirim ve İletişim Sistemi

### 9.1 Otomatik Bildirimler

#### Müşteriye Gönderilen
- Randevu onayı
- Randevu hatırlatması (24 saat, 2 saat önce)
- Randevu değişikliği
- Randevu iptali
- Ödeme onayı
- Sadakat puanı bildirimi
- Doğum günü kutlaması
- Özel kampanyalar

#### İşletmeye Gönderilen
- Yeni randevu bildirimi
- Randevu iptali bildirimi
- Ödeme alındı bildirimi
- Yeni müşteri kaydı
- Yeni yorum/değerlendirme
- Stok kritik seviye uyarısı
- Personel izin talebi

### 9.2 İletişim Kanalları
- SMS (Twilio, Netgsm entegrasyonu)
- Email (SMTP, SendGrid)
- Push Notification (Firebase)
- WhatsApp Business API
- In-app bildirimler

---

## 10. Yetkilendirme ve Roller

### 10.1 Rol Yapısı
```typescript
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

type Permission = 
  // Randevu
  | 'appointment.view'
  | 'appointment.create'
  | 'appointment.edit'
  | 'appointment.delete'
  | 'appointment.confirm'
  | 'appointment.cancel'
  
  // Müşteri
  | 'customer.view'
  | 'customer.create'
  | 'customer.edit'
  | 'customer.delete'
  | 'customer.viewNotes'
  | 'customer.addNotes'
  
  // Personel
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.delete'
  | 'staff.viewPerformance'
  
  // Hizmet
  | 'service.view'
  | 'service.create'
  | 'service.edit'
  | 'service.delete'
  
  // Finansal
  | 'finance.viewRevenue'
  | 'finance.viewExpense'
  | 'finance.addExpense'
  | 'finance.viewReports'
  
  // Ayarlar
  | 'settings.view'
  | 'settings.edit'
  
  // Raporlar
  | 'reports.view'
  | 'reports.export';
```

### 10.2 Varsayılan Roller

#### Owner (Sahip)
- Tüm yetkiler
- İşletme ayarları
- Finansal raporlar
- Personel yönetimi

#### Manager (Yönetici)
- Randevu yönetimi
- Müşteri yönetimi
- Personel görüntüleme
- Raporlar

#### Staff (Personel)
- Kendi randevularını görüntüleme
- Müşteri bilgilerini görüntüleme
- Randevu notları ekleme

#### Receptionist (Resepsiyon)
- Randevu oluşturma/düzenleme
- Müşteri yönetimi
- Ödeme işlemleri

---

## 11. Veri Güvenliği ve Yedekleme

### 11.1 Güvenlik Önlemleri
- End-to-end encryption
- HTTPS zorunluluğu
- Two-factor authentication (2FA)
- IP whitelist
- Brute force koruması
- SQL injection koruması
- XSS koruması
- CSRF token

### 11.2 Veri Yedekleme
- Otomatik günlük yedekleme
- Haftalık tam yedekleme
- Aylık arşiv yedekleme
- Cloud storage (AWS S3, Google Cloud)
- Yedek geri yükleme sistemi
- Disaster recovery planı

### 11.3 KVKK Uyumluluğu
- Açık rıza metni
- Veri işleme sözleşmesi
- Veri saklama süresi
- Veri silme talebi
- Veri taşınabilirliği
- Veri ihlali bildirimi

---

## 12. Entegrasyonlar

### 12.1 Ödeme Entegrasyonları
- İyzico
- PayTR
- Stripe
- PayPal
- Banka POS sistemleri

### 12.2 İletişim Entegrasyonları
- Twilio (SMS)
- SendGrid (Email)
- Firebase (Push)
- WhatsApp Business API

### 12.3 Muhasebe Entegrasyonları
- e-Fatura
- e-Arşiv
- Logo
- Netsis
- Mikro

### 12.4 Diğer Entegrasyonlar
- Google Calendar
- Google Maps
- Social Media (Instagram, Facebook)
- Analytics (Google Analytics, Mixpanel)

---

## 13. Mobil Uygulama (İşletme Tarafı)

### 13.1 Temel Özellikler
- Randevu görüntüleme ve yönetimi
- Müşteri bilgilerine erişim
- Hızlı randevu oluşturma
- Push notification
- Günlük gelir özeti
- Personel durumu görüntüleme

### 13.2 Offline Mod
- Randevu verilerini cache'leme
- Offline randevu oluşturma
- Senkronizasyon (online olunca)

---

## 14. Performans ve Ölçeklenebilirlik

### 14.1 Performans Hedefleri
- Sayfa yükleme: < 2 saniye
- API response: < 500ms
- Database query: < 100ms
- Concurrent users: 1000+
- Uptime: %99.9

### 14.2 Ölçeklenebilirlik
- Horizontal scaling
- Load balancing
- Database sharding
- CDN kullanımı
- Caching (Redis)
- Queue system (RabbitMQ)

---

## 15. Uygulama Planı

### Faz 1: Temel Sistem (2-3 ay)
- İşletme profil yönetimi
- Personel yönetimi
- Hizmet yönetimi
- Temel randevu sistemi
- Basit dashboard

### Faz 2: Gelişmiş Özellikler (2-3 ay)
- CRM sistemi
- Finansal yönetim
- Gelişmiş raporlama
- Bildirim sistemi
- Mobil uygulama

### Faz 3: Entegrasyonlar (1-2 ay)
- Ödeme entegrasyonları
- Muhasebe entegrasyonları
- SMS/Email servisleri
- Analytics entegrasyonu

### Faz 4: Optimizasyon (Sürekli)
- Performance tuning
- Bug fixes
- Feature improvements
- User feedback implementation

---

## 16. Başarı Metrikleri

### İşletme Tarafı
- Randevu yönetim süresi: %50 azalma
- No-show oranı: %30 azalma
- Müşteri memnuniyeti: %20 artış
- Gelir takibi doğruluğu: %95+
- Personel verimliliği: %25 artış

### Sistem Tarafı
- Sistem kullanım oranı: %80+
- Günlük aktif kullanıcı: %60+
- Özellik kullanım oranı: %70+
- Hata oranı: < %1
- Destek talep sayısı: < 5/ay

---

## Sonuç

Bu sistem, işletmelerin tüm operasyonlarını merkezi bir platformdan yönetmesini sağlar. Veri odaklı, güvenli ve ölçeklenebilir bir yapı sunar.

**Temel Prensipler:**
- Veri bütünlüğü ve güvenliği
- Kullanıcı dostu arayüz
- Otomatizasyon
- Detaylı raporlama
- Ölçeklenebilirlik
- Entegrasyon kolaylığı

**Versiyon:** 1.0
**Tarih:** 2026-05-21
**Durum:** Teknik Tasarım
