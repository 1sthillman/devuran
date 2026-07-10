# Appointment Booking Landing Page

## Genel Bakış

Google Appointment URL'lerinden gelen müşterilerin randevu alabildiği public landing page.

## Özellikler

### 🎨 Kullanıcı Deneyimi
- **Responsive Design**: Mobile-first, tüm cihazlarda mükemmel görünüm
- **Fast Loading**: Code splitting ve lazy loading ile < 2s yüklenme
- **Accessibility**: WCAG 2.1 AA uyumlu (aria labels, keyboard navigation)
- **Progressive Steps**: 4 adımlı booking flow (Service → DateTime → Customer → Confirmation)

### 🔄 Multi-Step Booking Flow

#### 1. Hizmet Seçimi
- Grid layout ile hizmet kartları
- Her kart: görsel, ad, açıklama, süre, fiyat, kategori
- Hover ve focus states

#### 2. Tarih & Saat Seçimi
- Interactive mini calendar widget
- Müsait saatler 3 gruba ayrılmış (Sabah, Öğleden Sonra, Akşam)
- Real-time availability query (5 dakika cache)
- Seçilen hizmet özeti gösterimi

#### 3. Müşteri Bilgileri
- Minimal form (Ad, Soyad, Email, Telefon)
- Client-side validation
- Input format kontrolleri (email, phone)
- Opsiyonel notlar alanı
- Gizlilik politikası onayı

#### 4. Onay Sayfası
- Success icon ve onay kodu
- Randevu detayları özeti
- "Sıradaki Adımlar" bilgilendirmesi
- Takvime ekleme butonları (Google, Apple, ICS)
- Yazdırma butonu

### 🎯 Business Branding

**BusinessHeader Component:**
- Logo gösterimi
- Google rating ve review sayısı (yıldızlar)
- Adres ve iletişim bilgileri
- İşletme açıklaması
- "Google ile rezervasyon" badge'i
- Custom branding colors desteği

### 📊 Analytics Tracking

Otomatik event tracking:
- `appointment_url_view` - Sayfa yüklendiğinde
- `service_selected` - Hizmet seçildiğinde
- `date_selected` - Tarih seçildiğinde
- `booking_completed` - Randevu tamamlandığında

UTM parametreleri:
- `utm_source`, `utm_medium`, `utm_campaign`
- `referrer` tracking

### ⚡ Performance Optimizations

- **Code Splitting**: Lazy loading için route-based splitting
- **Image Optimization**: WebP format, lazy loading
- **API Caching**: Redis ile 5 dakika availability cache
- **Debounced Search**: Availability query optimization
- **Skeleton Screens**: Loading states için

### 🔒 Güvenlik

- HTTPS zorunlu
- Input sanitization (XSS prevention)
- Rate limiting (API level)
- CSRF protection
- Privacy policy ve terms acceptance

## Folder Structure

```
src/
├── pages/
│   └── AppointmentBookingPage.tsx       # Ana landing page
├── components/
│   ├── booking/
│   │   ├── BusinessHeader.tsx           # İşletme başlığı
│   │   ├── ServiceSelection.tsx         # Hizmet seçimi
│   │   ├── DateTimeSelection.tsx        # Tarih/saat seçimi
│   │   ├── CustomerInfoForm.tsx         # Müşteri formu
│   │   └── BookingConfirmation.tsx      # Onay sayfası
│   └── common/
│       ├── LoadingSpinner.tsx           # Loading göstergesi
│       └── ErrorMessage.tsx             # Hata mesajı
├── services/
│   └── booking-api.service.ts           # API client
├── types/
│   └── booking.types.ts                 # TypeScript types
└── router/
    └── booking-routes.tsx               # Route config
```

## API Endpoints

### Public Endpoints (No Auth Required)

```typescript
// Resolve appointment URL
GET /api/v1/booking/resolve-url?urlPath=/book/business/location
Response: { businessId, locationId }

// Get business info
GET /api/v1/booking/business/:businessId
Response: { business: BusinessInfo }

// Get services
GET /api/v1/booking/business/:businessId/services
Response: { services: Service[] }

// Get availability
GET /api/v1/booking/availability?businessId=x&serviceId=y&date=2024-01-15
Response: { slots: TimeSlot[] }

// Create booking
POST /api/v1/booking/create
Body: BookingRequest
Response: BookingConfirmation

// Get booking by confirmation code
GET /api/v1/booking/:confirmationCode
Response: { booking: BookingConfirmation }
```

### Analytics Endpoints

```typescript
// Track event
POST /api/v1/analytics/track
Body: { event, businessId, ... }

// Get analytics dashboard
GET /api/v1/analytics/dashboard?businessId=x&startDate=...&endDate=...
Response: { metrics, sourceBreakdown, period }
```

## Usage Examples

### Accessing Landing Page

```
https://yourdomain.com/book/guzel-kuafor/kadikoy-subesi
https://yourdomain.com/book/business-slug/location-slug-abc123

With UTM parameters:
https://yourdomain.com/book/business/location?utm_source=google&utm_medium=cpc
```

### Tracking Custom Event

```typescript
import { bookingApiService } from '@/services/booking-api.service';

await bookingApiService.trackPageView(
  'business-123',
  'location-456',
  'google_appointment_url',
  {
    source: 'google',
    medium: 'organic',
    campaign: 'spring-2024'
  }
);
```

## Testing

### Manual Testing Checklist

- [ ] Sayfa < 2 saniyede yükleniyor
- [ ] Mobile görünümde düzgün çalışıyor
- [ ] Tüm form validasyonları çalışıyor
- [ ] Calendar widget düzgün çalışıyor
- [ ] Time slots doğru gruplandırılmış
- [ ] Booking başarıyla oluşturuluyor
- [ ] Onay sayfası doğru bilgileri gösteriyor
- [ ] Calendar export çalışıyor
- [ ] Analytics tracking yapılıyor
- [ ] Error states düzgün gösteriliyor

### Accessibility Testing

- [ ] Keyboard navigation çalışıyor (Tab, Enter, Esc)
- [ ] Screen reader uyumlu (aria labels)
- [ ] Focus states görünüyor
- [ ] Color contrast yeterli (WCAG AA)
- [ ] Form error messages anlaşılır

## Future Enhancements

- [ ] Google Account otomatik doldurma
- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Booking modification/cancellation
- [ ] SMS verification
- [ ] Payment integration
- [ ] Real-time slot updates (WebSocket)
- [ ] Google Maps embed (directions)
- [ ] Review/rating system
- [ ] Loyalty points integration

## Performance Targets

- ✅ First Contentful Paint: < 1.5s
- ✅ Largest Contentful Paint: < 2.5s
- ✅ Time to Interactive: < 3.5s
- ✅ Cumulative Layout Shift: < 0.1
- ✅ Google PageSpeed Score: 90+

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
