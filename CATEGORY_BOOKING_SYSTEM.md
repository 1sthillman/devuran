# Kategori Bazlı Modern Randevu Sistemi - Tasarım Dokümanı

## 📋 Genel Bakış

Her kategori için özelleştirilmiş, modern ve kullanıcı dostu randevu akışı tasarımı.

---

## 🎯 Kategori Yapısı

### 1. **Güzellik & Bakım** (Beauty & Care)
- Kuaför
- Berber
- Güzellik Salonu
- Spa & Masaj
- Nail Art
- Makyaj

### 2. **Sağlık** (Healthcare)
- Doktor
- Diş Hekimi
- Fizik Tedavi
- Psikoloji
- Veteriner

### 3. **Eğitim** (Education)
- Özel Ders
- Dil Kursu
- Müzik Dersi
- Spor Antrenörü

### 4. **Profesyonel Hizmetler** (Professional Services)
- Avukat
- Muhasebe
- Danışmanlık
- Fotoğrafçı
- Organizasyon

### 5. **Ev & Yaşam** (Home & Living)
- Temizlik
- Tadilat
- Bahçıvanlık
- Elektrikçi
- Tesisatçı

### 6. **Etkinlik & Mekan** (Events & Venues)
- Restoran
- Kafe
- Toplantı Salonu
- Düğün Salonu
- Konser/Etkinlik

---

## 🎨 Modern Tasarım Prensipleri

### Visual Hierarchy
```
1. Hero Section (Kategori Görseli + Başlık)
2. Quick Filters (Hızlı Filtreleme)
3. Service Cards (Hizmet Kartları)
4. Booking Flow (Randevu Akışı)
5. Confirmation (Onay Ekranı)
```

### Design System
- **Glassmorphism**: Şeffaf, bulanık arka planlar
- **Neumorphism**: Soft shadows, 3D efektler
- **Gradient Accents**: Purple-Pink gradient vurguları
- **Micro-interactions**: Hover, click, scroll animasyonları
- **Dark Mode First**: Öncelikli karanlık tema

---

## 📱 Kategori Özel Randevu Akışları

### 🎨 1. Güzellik & Bakım Kategorisi

#### Akış Adımları:
```
1. Hizmet Seçimi (Multi-select)
   └─ Saç Kesimi, Boya, Fön, Manikür, vb.
   
2. Personel Seçimi
   └─ Fotoğraf, İsim, Uzmanlık, Rating
   └─ "Farketmez" seçeneği
   
3. Tarih & Saat Seçimi
   └─ Takvim görünümü
   └─ Müsait saatler (yeşil)
   └─ Dolu saatler (gri)
   
4. Ek Bilgiler (Opsiyonel)
   └─ Saç tipi, renk tercihi, notlar
   
5. Özet & Onay
   └─ Toplam süre, fiyat
   └─ Ödeme seçeneği
```

#### UI Özellikleri:
- **Service Cards**: Görsel + İsim + Süre + Fiyat
- **Staff Cards**: Profil fotoğrafı + Portfolio
- **Time Slots**: Pill-shaped buttons, gradient aktif state
- **Price Calculator**: Real-time toplam hesaplama

---

### 🏥 2. Sağlık Kategorisi

#### Akış Adımları:
```
1. Branş/Uzmanlık Seçimi
   └─ Dropdown veya kategori kartları
   
2. Doktor Seçimi
   └─ Diploma, deneyim, hastane
   └─ Müsaitlik durumu
   
3. Randevu Tipi
   └─ İlk Muayene / Kontrol
   └─ Online / Yüz Yüze
   
4. Tarih & Saat
   └─ En erken müsait randevu vurgusu
   └─ Acil randevu seçeneği
   
5. Hasta Bilgileri
   └─ TC No, Sigorta bilgisi
   └─ Şikayet/Semptomlar
   
6. Onay & Hatırlatma
   └─ SMS/Email onayı
   └─ Takvime ekleme
```

#### UI Özellikleri:
- **Doctor Cards**: Profesyonel görünüm, sertifikalar
- **Urgency Indicator**: Acil randevu için kırmızı badge
- **Insurance Integration**: Sigorta kartı okuma
- **Medical Form**: Güvenli, KVKK uyumlu form

---

### 📚 3. Eğitim Kategorisi

#### Akış Adımları:
```
1. Ders Türü Seçimi
   └─ Bireysel / Grup
   └─ Online / Yüz Yüze
   
2. Eğitmen Seçimi
   └─ Deneyim, sertifikalar
   └─ Video tanıtım
   
3. Paket Seçimi
   └─ Tek ders / 5 ders / 10 ders
   └─ İndirimli paketler
   
4. Tarih & Saat
   └─ Tekrarlayan randevular
   └─ Esnek saat seçenekleri
   
5. Seviye Testi (Opsiyonel)
   └─ Hızlı seviye belirleme
   
6. Ödeme & Onay
   └─ Paket ödemesi
   └─ Taksit seçenekleri
```

#### UI Özellikleri:
- **Package Cards**: Karşılaştırma tablosu
- **Recurring Booking**: Haftalık tekrar seçeneği
- **Video Preview**: Eğitmen tanıtım videosu
- **Progress Tracker**: Ders ilerleme göstergesi

---

### 💼 4. Profesyonel Hizmetler

#### Akış Adımları:
```
1. Hizmet Kategorisi
   └─ Danışmanlık türü
   
2. Uzman Seçimi
   └─ Portföy, referanslar
   └─ Saat ücreti
   
3. Görüşme Tipi
   └─ Online / Ofis
   └─ Süre seçimi (30dk, 1sa, 2sa)
   
4. Tarih & Saat
   └─ İş saatleri vurgusu
   └─ Mesai dışı ek ücret
   
5. Ön Bilgi Formu
   └─ Proje detayları
   └─ Dosya yükleme
   
6. Ödeme & Sözleşme
   └─ Ön ödeme / Tam ödeme
   └─ Gizlilik sözleşmesi
```

#### UI Özellikleri:
- **Portfolio Gallery**: Geçmiş projeler
- **File Upload**: Drag & drop dosya yükleme
- **Contract Preview**: Dijital sözleşme önizleme
- **Invoice Generation**: Otomatik fatura oluşturma

---

### 🏠 5. Ev & Yaşam

#### Akış Adımları:
```
1. Hizmet Türü
   └─ Acil / Normal
   └─ Tek seferlik / Abonelik
   
2. Adres Bilgisi
   └─ Harita entegrasyonu
   └─ Mesafe hesaplama
   
3. Tarih & Saat Aralığı
   └─ Sabah / Öğlen / Akşam
   └─ Esnek saat aralığı
   
4. Detay & Fotoğraf
   └─ Sorun açıklaması
   └─ Fotoğraf yükleme
   
5. Fiyat Teklifi
   └─ Ön değerlendirme
   └─ Kesin fiyat sonrası
   
6. Onay & Takip
   └─ Teknisyen yolda bildirimi
   └─ Canlı konum takibi
```

#### UI Özellikleri:
- **Map Integration**: Google Maps ile adres seçimi
- **Photo Upload**: Sorun fotoğrafı yükleme
- **Live Tracking**: Teknisyen konumu takibi
- **Rating System**: Hizmet sonrası değerlendirme

---

### 🎉 6. Etkinlik & Mekan

#### Akış Adımları:
```
1. Mekan Türü
   └─ Restoran / Kafe / Salon
   
2. Kişi Sayısı & Tarih
   └─ Slider ile kişi seçimi
   └─ Özel gün vurgusu
   
3. Saat & Süre
   └─ Masa müsaitliği
   └─ Minimum süre
   
4. Masa/Alan Seçimi
   └─ 2D/3D mekan planı
   └─ Pencere kenarı, bahçe, vb.
   
5. Menü & Ek Hizmetler
   └─ Özel menü
   └─ Dekorasyon, müzik
   
6. Ön Ödeme & Onay
   └─ Depozito ödemesi
   └─ İptal koşulları
```

#### UI Özellikleri:
- **3D Floor Plan**: İnteraktif mekan planı
- **Menu Preview**: Dijital menü görüntüleme
- **Special Occasions**: Doğum günü, yıldönümü paketleri
- **Deposit System**: Güvenli depozito ödemesi

---

## 🎯 Ortak UI Bileşenleri

### 1. **Smart Calendar**
```typescript
Features:
- Müsait/Dolu göstergesi
- Hızlı tarih seçimi (Bugün, Yarın, Bu Hafta)
- Tatil günleri vurgusu
- Çoklu tarih seçimi (paket randevular için)
```

### 2. **Time Slot Picker**
```typescript
Design:
- Pill-shaped buttons
- Gradient aktif state
- Disabled state (dolu saatler)
- Popüler saatler badge'i
```

### 3. **Staff/Professional Card**
```typescript
Components:
- Avatar (circular, gradient border)
- Name & Title
- Rating (stars + review count)
- Availability indicator
- "Farketmez" option
```

### 4. **Service Card**
```typescript
Layout:
- Icon/Image
- Service name
- Duration badge
- Price tag
- Add/Remove button
- Hover: Detay göster
```

### 5. **Booking Summary**
```typescript
Sticky Bottom Bar:
- Selected services
- Total duration
- Total price
- "Devam Et" button
- Glassmorphism style
```

### 6. **Progress Stepper**
```typescript
Design:
- Horizontal stepper (desktop)
- Vertical stepper (mobile)
- Completed steps (green check)
- Current step (gradient)
- Future steps (gray)
```

---

## 🎨 Animasyon & Micro-interactions

### Page Transitions
```css
- Fade + Slide (0.3s ease-out)
- Blur effect on background
- Staggered card animations
```

### Button Interactions
```css
- Hover: Scale(1.05) + Shadow
- Active: Scale(0.95)
- Success: Checkmark animation
```

### Loading States
```css
- Skeleton screens
- Shimmer effect
- Pulse animation
```

### Success Feedback
```css
- Confetti animation
- Success checkmark
- Haptic feedback (mobile)
```

---

## 📊 Veri Yapısı

### Booking Schema
```typescript
interface Booking {
  id: string;
  category: CategoryType;
  businessId: string;
  customerId: string;
  
  // Hizmet Bilgileri
  services: Service[];
  totalDuration: number;
  totalPrice: number;
  
  // Zaman Bilgileri
  date: string;
  startTime: string;
  endTime: string;
  
  // Personel/Uzman
  staffId?: string;
  staffPreference: 'specific' | 'any';
  
  // Kategori Özel Alanlar
  categorySpecific: {
    // Sağlık için
    patientInfo?: PatientInfo;
    insuranceInfo?: InsuranceInfo;
    
    // Eğitim için
    packageType?: 'single' | 'package';
    recurringSchedule?: RecurringSchedule;
    
    // Ev Hizmetleri için
    address?: Address;
    photos?: string[];
    urgency?: 'normal' | 'urgent';
    
    // Etkinlik için
    guestCount?: number;
    tablePreference?: string;
    specialRequests?: string;
  };
  
  // Ödeme
  paymentStatus: 'pending' | 'partial' | 'paid';
  depositAmount?: number;
  
  // Durum
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  
  // Bildirimler
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Notlar
  customerNotes?: string;
  businessNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔔 Bildirim Sistemi

### Müşteri Bildirimleri
```
1. Randevu Onayı (Anında)
2. Hatırlatma (24 saat önce)
3. Hatırlatma (2 saat önce)
4. Personel Yolda (Ev hizmetleri için)
5. Randevu Tamamlandı
6. Değerlendirme İsteği
```

### İşletme Bildirimleri
```
1. Yeni Randevu
2. Randevu İptali
3. Yaklaşan Randevular (Günlük özet)
4. Müşteri Geç Kalıyor
5. Ödeme Alındı
```

---

## 💳 Ödeme Entegrasyonu

### Ödeme Seçenekleri
```
1. Kredi/Banka Kartı
2. Havale/EFT
3. Kapıda Ödeme
4. Depozito + Kalan
5. Paket Ödeme (Eğitim için)
```

### Ödeme Akışı
```
1. Güvenli ödeme sayfası
2. 3D Secure doğrulama
3. Otomatik fatura oluşturma
4. E-posta ile fatura gönderimi
5. İptal/İade işlemleri
```

---

## 📱 Mobil Optimizasyon

### Touch Gestures
```
- Swipe: Tarih değiştirme
- Long Press: Detay gösterme
- Pull to Refresh: Müsaitlik güncelleme
- Pinch to Zoom: Mekan planı (etkinlik)
```

### Mobile-First Features
```
- Konum servisleri
- Kamera entegrasyonu
- Takvim senkronizasyonu
- Push notifications
- Offline mode (draft bookings)
```

---

## 🎯 Kullanıcı Deneyimi İyileştirmeleri

### Smart Suggestions
```
- "Sık tercih edilen saatler"
- "Bu hizmeti alanlar şunları da aldı"
- "Popüler paketler"
- "Erken rezervasyon indirimi"
```

### Quick Actions
```
- "Önceki randevumu tekrarla"
- "Favori personelim"
- "Hızlı randevu" (ilk müsait)
- "Esnek saat" (işletme seçsin)
```

### Accessibility
```
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size adjustment
- Voice commands
```

---

## 🚀 Teknik Gereksinimler

### Frontend
```typescript
- React 18+ (Concurrent features)
- Framer Motion (Animations)
- React Query (Data fetching)
- Zustand (State management)
- React Hook Form (Form handling)
- Date-fns (Date manipulation)
```

### Backend
```typescript
- Real-time availability updates
- Conflict prevention (double booking)
- Queue management
- Automated reminders
- Analytics & reporting
```

### Performance
```
- Code splitting per category
- Lazy loading images
- Optimistic UI updates
- Service worker (PWA)
- CDN for static assets
```

---

## 📈 Metrikler & Analytics

### Takip Edilecek Metrikler
```
1. Conversion Rate (Görüntüleme → Randevu)
2. Abandonment Rate (Hangi adımda bırakıyor)
3. Average Booking Time
4. Popular Time Slots
5. Service Combinations
6. Cancellation Rate
7. Rebooking Rate
```

### A/B Test Fikirleri
```
- Personel seçimi zorunlu mu opsiyonel mi?
- Fiyat gösterimi (baştan mı sondan mı?)
- Takvim görünümü (aylık mı haftalık mı?)
- CTA button renkleri
- Form alanı sayısı
```

---

## 🎨 Tasarım Sistemi Renk Paleti

### Primary Colors
```css
--purple-500: #a855f7
--purple-600: #9333ea
--pink-500: #ec4899
--pink-600: #db2777
```

### Category Colors
```css
--beauty: #ec4899 (Pink)
--health: #10b981 (Green)
--education: #3b82f6 (Blue)
--professional: #8b5cf6 (Purple)
--home: #f59e0b (Orange)
--events: #ef4444 (Red)
```

### Semantic Colors
```css
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

---

## ✅ Uygulama Önceliklendirmesi

### Phase 1 (MVP)
```
✓ Güzellik & Bakım kategorisi
✓ Temel randevu akışı
✓ Personel seçimi
✓ Tarih & saat seçimi
✓ Basit ödeme entegrasyonu
```

### Phase 2
```
□ Sağlık kategorisi
□ Eğitim kategorisi
□ Tekrarlayan randevular
□ Paket sistemleri
□ Gelişmiş bildirimler
```

### Phase 3
```
□ Profesyonel Hizmetler
□ Ev & Yaşam
□ Etkinlik & Mekan
□ 3D mekan planı
□ Video görüşme entegrasyonu
```

---

## 🎯 Sonuç

Bu tasarım dokümanı, her kategori için özelleştirilmiş, modern ve kullanıcı dostu bir randevu sistemi oluşturmak için gerekli tüm detayları içermektedir. 

**Temel Prensipler:**
- ✨ Kullanıcı deneyimi öncelikli
- 🎨 Modern ve şık tasarım
- ⚡ Hızlı ve akıcı
- 📱 Mobil-first yaklaşım
- ♿ Erişilebilir
- 🔒 Güvenli

**Başarı Kriterleri:**
- 3 adımda randevu tamamlanabilmeli
- %80+ conversion rate hedefi
- <2 saniye sayfa yükleme süresi
- %95+ mobil kullanılabilirlik skoru
- 4.5+ kullanıcı memnuniyeti

---

**Versiyon:** 1.0  
**Tarih:** 2026-05-21  
**Durum:** Tasarım Aşaması
