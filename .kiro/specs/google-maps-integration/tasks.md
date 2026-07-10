# Implementation Plan: Google Maps/Google Business Profile Entegrasyonu

## Overview

Bu implementation plan, Google Maps ve Google Business Profile entegrasyonunu iki aşamada hayata geçirmek için gerekli görevleri içerir:

- **Aşama 1 (Google Görünürlük)**: OAuth 2.0, GBP API entegrasyonu, Landing Pages
- **Aşama 2 (Google Rezervasyon)**: Reserve with Google, Real-Time API, Data Feeds

Tüm görevler TypeScript ile implement edilecektir. Her görev, requirements dokümanındaki ilgili gereksinimlere referans verir.

## Implementasyon Notları

- Bu görevler code-generation LLM tarafından incremental olarak implement edilecektir
- Her görev bir önceki görevi tamamlar ve entegre eder
- Optional görevler "*" ile işaretlenmiştir ve atlanabilir
- Property-based test görevleri design dokümanındaki correctness properties'e referans verir

---

## Tasks

### AŞAMA 1: Google Görünürlük (OAuth + GBP + Landing Pages)

- [ ] 1. Proje altyapısını ve bağımlılıkları kur
  - TypeScript projesi için `tsconfig.json` oluştur (strict mode, ESNext target)
  - Firebase Admin SDK, Express, Bull, Redis client, ioredis paketlerini yükle
  - Development dependencies: Jest, Supertest, @types paketleri
  - Proje dizin yapısını oluştur: `/src/services`, `/src/routes`, `/src/models`, `/src/utils`, `/src/middleware`, `/tests`
  - Environment variables için `.env.example` dosyası oluştur
  - _Requirements: Requirement 1, 2, 3_


- [ ] 2. Firebase ve Cloud Services bağlantısını yapılandır
  - [ ] 2.1 Firebase Admin SDK'yı başlat ve Firestore bağlantısını kur
    - Firebase service account credentials yönetimi
    - Firestore instance yapılandırması
    - _Requirements: 1.4, 2.2_

  - [ ] 2.2 Redis (Cloud Memorystore) bağlantısını kur
    - Redis client yapılandırması (connection pooling ile)
    - Health check endpoint'i ekle
    - _Requirements: 13.1_

  - [ ] 2.3 Cloud KMS ile encryption service oluştur
    - AES-256-GCM encryption/decryption utility fonksiyonları
    - Token encryption için wrapper sınıf
    - _Requirements: 1.4_

- [ ] 3. OAuth 2.0 Service implementasyonu
  - [ ] 3.1 OAuth Controller ve route'ları oluştur
    - `POST /oauth/initiate` - OAuth akışını başlat
    - `GET /oauth/callback` - Google callback handler
    - `POST /oauth/revoke` - Token iptal et
    - _Requirements: 1.1, 1.2, 1.8_

  - [ ] 3.2 Token Manager servisini implement et
    - `generateAuthorizationUrl()` - OAuth URL oluştur (Google scopes: businessinformation.locations.readonly, businessinformation.locations)
    - `exchangeCodeForTokens()` - Authorization code → access/refresh token
    - `encryptAndStoreTokens()` - Token'ları encrypt edip Firestore'a kaydet
    - `retrieveAndDecryptTokens()` - Token'ları oku ve decrypt et
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 3.3 Automatic Token Refresh implementasyonu
    - `refreshAccessToken()` - Expire olan token'ları yenile
    - Middleware: Her GBP API çağrısından önce token geçerliliğini kontrol et
    - Background job: Expire yaklaşan token'ları proaktif yenile
    - _Requirements: 1.5_

  - [ ]* 3.4 OAuth servisi için unit test'ler yaz
    - Token encryption/decryption round-trip testi
    - Authorization URL parametrelerinin doğruluğu
    - Token refresh error handling
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.5 Property test: Secure Token Storage (Property 2)
    - **Property 2: Secure Token Storage and Retrieval**
    - **Validates: Requirements 1.3, 1.4**
    - Token encrypt → store → retrieve → decrypt sonucu orijinal token'la eşleşmeli
    - 100 farklı token ile test et

- [ ] 4. Google Business Profile (GBP) Integration Service
  - [ ] 4.1 GBP API Client implementasyonu
    - Google Business Profile API wrapper sınıfı
    - `listLocations()` - İşletmenin tüm lokasyonlarını çek
    - `getLocation()` - Tek lokasyon detayı
    - `updateLocationAttribute()` - Lokasyon attribute güncelle (appointmentUrl için)
    - Rate limiting (10 req/sec) ve retry logic (exponential backoff)
    - _Requirements: 2.1, 4.1, 4.2_

  - [ ] 4.2 Location Manager servisini implement et
    - `syncLocations()` - GBP'den lokasyonları fetch et ve Firestore'a kaydet
    - `activateIntegration()` - Lokasyon için entegrasyonu aktive et
    - `deactivateIntegration()` - Lokasyon için entegrasyonu deaktive et
    - Sadece verified lokasyonlar için aktivasyon izni ver
    - _Requirements: 2.1, 2.2, 2.4, 2.7_

  - [ ] 4.3 Appointment URL Generator implementasyonu
    - `generateAppointmentUrl()` - Benzersiz SEO-friendly URL oluştur
    - Slug generation: `{business-slug}/{location-slug}-{unique-id}`
    - Slug collision detection ve unique-id ekleme
    - Firestore'da uniqueness kontrolü
    - _Requirements: 3.1, 3.2_

  - [ ] 4.4 GBP appointmentUrl senkronizasyonu
    - `updateAppointmentUrlInGBP()` - GBP API PATCH request
    - Asenkron queue job olarak implement et (Bull queue)
    - Retry logic: 3 deneme, exponential backoff (1s, 2s, 4s)
    - Başarı/başarısızlık durumunu audit log'a kaydet
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.5 GBP servisi için integration test'ler
    - Mock GBP API ile location sync testi
    - AppointmentUrl update başarı/retry senaryoları
    - Verified lokasyon enforcement testi
    - _Requirements: 2.1, 2.4, 4.1_

  - [ ]* 4.6 Property test: Unique Appointment URL (Property 7)
    - **Property 7: Unique Appointment URL Generation**
    - **Validates: Requirements 2.5, 3.1**
    - Farklı location ID'ler için üretilen URL'ler unique olmalı
    - 100 location pair ile collision testi

- [ ] 5. Checkpoint - Aşama 1A (OAuth + GBP) tamamlama
  - Tüm testlerin geçtiğini doğrula
  - OAuth flow'u manuel test et (Google test account ile)
  - GBP lokasyon sync'i test et
  - Kullanıcıya sorular varsa sor


- [ ] 6. Appointment Landing Page (Frontend - React + TypeScript)
  - [ ] 6.1 Landing page route ve component yapısını oluştur
    - Route: `/book/:businessSlug/:locationSlug`
    - Page component: `AppointmentBookingPage.tsx`
    - API service layer: `bookingApi.ts`
    - _Requirements: 3.3, 3.5_

  - [ ] 6.2 İşletme branding ve bilgi görüntüleme
    - Business name, logo, address, phone görüntüleme
    - Google rating ve review sayısı (GBP'den fetch)
    - "Google ile güvenli rezervasyon" badge
    - _Requirements: 3.6, 25.2, 25.3_

  - [ ] 6.3 Hizmet seçimi UI komponenti
    - Service card grid layout (görsel, ad, süre, fiyat, açıklama)
    - Multi-select veya single-select hizmet seçimi
    - _Requirements: 25.4_

  - [ ] 6.4 Tarih ve saat seçimi implementasyonu
    - Interactive calendar widget (react-calendar veya date-fns)
    - Müsait saatleri API'den fetch et (`GET /api/availability`)
    - Saatleri gruplandır: sabah (08:00-12:00), öğle (12:00-17:00), akşam (17:00-21:00)
    - _Requirements: 25.5, 25.6_

  - [ ] 6.5 Müşteri bilgileri form'u
    - Minimal form: Ad, Telefon, Email
    - Input validation (email format, phone format)
    - Google Account'tan otomatik doldurma desteği (optional)
    - _Requirements: 25.7_

  - [ ] 6.6 Randevu onay ve tamamlama
    - Özet sayfası: işletme, hizmet, tarih/saat, fiyat
    - "Takvime Ekle" butonları (Google Calendar, Apple Calendar, ICS download)
    - Confirmation code ve booking URL görüntüleme
    - _Requirements: 25.8, 25.9_

  - [ ] 6.7 Responsive design ve accessibility
    - Mobile-first CSS (Tailwind/Material-UI)
    - WCAG 2.1 AA compliance (aria labels, keyboard navigation)
    - Loading states, error states
    - _Requirements: 25.10, 25.11_

  - [ ]* 6.8 Landing page performans optimizasyonu
    - Code splitting (lazy loading components)
    - Image optimization (WebP, lazy loading)
    - Google PageSpeed Insights target: 90+ skor
    - _Requirements: 3.5, 25.12_

- [ ] 7. Backend API endpoints for Landing Page
  - [ ] 7.1 Availability query endpoint
    - `GET /api/availability?businessId={id}&serviceId={id}&date={date}`
    - Redis caching (5 dakika TTL)
    - Availability calculation logic (working hours, bookings, staff müsaitlik)
    - _Requirements: 9.5_

  - [ ] 7.2 Booking creation endpoint (Landing Page için)
    - `POST /api/bookings` - Randevu oluştur
    - Input validation (business, service, slot, customer info)
    - Distributed lock (Redis) ile slot rezervasyonu
    - Source tracking: `google_appointment_url`
    - _Requirements: 10.1, 10.7_

  - [ ]* 7.3 API endpoints için integration test'ler
    - Availability endpoint cache behavior
    - Booking creation success/conflict scenarios
    - _Requirements: 9.5, 10.1_

- [ ] 8. Integration Dashboard (Admin Panel - React + TypeScript)
  - [ ] 8.1 Dashboard route ve ana layout
    - Route: `/integrations/google-maps`
    - Role-based access: sadece business owner
    - Tab navigation: Genel Bakış, Lokasyonlar, İstatistikler, Ayarlar, Loglar
    - _Requirements: 19.1, 19.2, 19.3_

  - [ ] 8.2 Genel Bakış sekmesi
    - Entegrasyon durumu card'ları (Aşama 1: aktif/inaktif, Aşama 2: inaktif)
    - Quick actions: "Google Hesabı Bağla", "Lokasyon Aktive Et"
    - Son 7 günün istatistikleri: toplam görüntülenme, randevu sayısı
    - _Requirements: 19.4_

  - [ ] 8.3 Lokasyonlar sekmesi
    - Lokasyon listesi (tablo: ad, adres, durum, appointmentUrl, actions)
    - Actions: Aktive Et, Deaktive Et, URL'yi Kopyala, Test Et
    - Senkronizasyon butonu: GBP'den lokasyonları yeniden fetch et
    - _Requirements: 19.5, 19.6_

  - [ ] 8.4 İstatistikler sekmesi
    - Son 30 günün metrikleri: toplam görüntülenme, randevu sayısı, dönüşüm oranı
    - Chart.js ile günlük randevu trend grafiği
    - Source breakdown: Google vs direct
    - _Requirements: 19.7, 19.8_

  - [ ] 8.5 Ayarlar sekmesi
    - Google hesap bağlantısı yönetimi (Bağla, Bağlantıyı Kaldır, Yeniden Bağla)
    - Bildirim tercihleri (email, SMS, in-app için checkboxes)
    - Paket bilgisi ve kalan süre görüntüleme
    - _Requirements: 19.9, 21.3_

  - [ ] 8.6 Loglar sekmesi
    - Son 100 entegrasyon işlemi tablosu (tarih, işlem, durum, detay)
    - Filtreleme: tarih aralığı, işlem tipi, durum
    - _Requirements: 19.10_

  - [ ]* 8.7 Dashboard için E2E test'ler (Playwright)
    - OAuth connection flow
    - Location activation/deactivation
    - URL copy ve test
    - _Requirements: 19.1-19.10_

- [ ] 9. Checkpoint - Aşama 1 (MVP) tamamlama
  - Tüm testlerin geçtiğini doğrula
  - End-to-end flow test: OAuth → Location activate → Landing page'den randevu al
  - Performance test: Landing page load time < 2s
  - Kullanıcıya sorular varsa sor


### AŞAMA 2: Google Rezervasyon (Reserve with Google - RWG)

- [ ] 10. JWT Validator servisi (Google JWT doğrulama)
  - [ ] 10.1 Google JWKS public key fetcher
    - `fetchPublicKeys()` - Google'ın JWKS endpoint'inden public key'leri çek
    - 24 saat cache (Redis)
    - _Requirements: 15.1, 15.2_

  - [ ] 10.2 JWT signature ve claims doğrulama
    - `verifyJWT()` - Signature, expiration, issuer, audience kontrolü
    - JTI (JWT ID) replay attack koruması (Redis'te 1 saat track)
    - 401 Unauthorized response başarısız doğrulama için
    - _Requirements: 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [ ]* 10.3 JWT Validator için unit test'ler
    - Expired token rejection
    - Invalid issuer rejection
    - Replay attack detection
    - _Requirements: 15.1-15.9_

  - [ ]* 10.4 Property test: JWT Validation Completeness (Property 15)
    - **Property 15: JWT Validation Completeness**
    - **Validates: Requirements 9.2, 9.3**
    - Geçersiz JWT'ler (expired, wrong issuer, wrong audience) 401 dönmeli
    - 100 farklı invalid JWT senaryosu ile test

- [ ] 11. Availability Engine (Müsaitlik hesaplama motoru)
  - [ ] 11.1 Working hours ve schedule yönetimi
    - `getWorkingHours()` - İşletmenin çalışma saatlerini Firestore'dan al
    - `getHolidays()` - Tatil günlerini fetch et
    - _Requirements: 8.1_

  - [ ] 11.2 Staff availability calculator
    - `getStaffAvailability()` - Personel müsaitlik verilerini al
    - `isStaffAvailable()` - Belirli bir zaman için personel müsait mi kontrol
    - _Requirements: 8.2_

  - [ ] 11.3 Slot generation algoritması
    - `calculateAvailableSlots()` - Çalışma saatleri, bookings, staff müsaitlik ile slot'lar oluştur
    - Slot interval (15/30 dakika) konfigürasyonu
    - Conflict detection (mevcut bookings ile çakışma kontrolü)
    - _Requirements: 8.3, 9.5_

  - [ ] 11.4 Cache Manager entegrasyonu
    - Cache key: `avail:{businessId}:{serviceId}:{date}`
    - TTL: 5 dakika
    - Cache invalidation pub/sub pattern
    - _Requirements: 9.7, 13.1, 13.2, 13.5_

  - [ ]* 11.5 Availability Engine için unit test'ler
    - Booked slot exclusion
    - Working hours filtering
    - Staff conflict detection
    - _Requirements: 8.1, 8.2, 9.5_

  - [ ]* 11.6 Property test: Availability Calculation Correctness (Property 17)
    - **Property 17: Availability Calculation Correctness**
    - **Validates: Requirements 9.5**
    - Dönen slot'lar: working hours içinde, mevcut booking'lerle çakışmıyor, holiday'de değil
    - 100 farklı senaryo ile test

- [ ] 12. CheckAvailability Real-Time API
  - [ ] 12.1 CheckAvailability endpoint ve middleware
    - `POST /v1/google/checkAvailability`
    - JWT validation middleware
    - Request body validation (merchant_id, service_id, start_time, end_time)
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 12.2 Availability query ve response formatter
    - Availability Engine'i çağır
    - Response format: `{available_slots: [{start_time, duration, resources}]}`
    - Cache logic (hit → return cached, miss → calculate → cache → return)
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ] 12.3 Performance monitoring ve logging
    - Response time tracking (p50, p95, p99)
    - Audit log entry (request_id, merchant_id, duration, status)
    - Alert: p95 > 1000ms
    - _Requirements: 9.8, 9.9, 17.6_

  - [ ] 12.4 Rate limiting middleware
    - Redis-based rate limiter: 10 req/sec per merchant
    - 429 Too Many Requests response
    - Retry-After header
    - _Requirements: 9.10, 9.11, 16.2, 16.6_

  - [ ]* 12.5 CheckAvailability integration test'leri
    - Valid request → 200 OK
    - Invalid JWT → 401
    - Cache hit behavior
    - Rate limiting enforcement
    - _Requirements: 9.1-9.11_

- [ ] 13. Booking Engine (Rezervasyon motoru)
  - [ ] 13.1 Lock Manager (Distributed locking with Redis)
    - `acquireLock()` - Redis SETNX ile lock al
    - `releaseLock()` - Lua script ile atomic release
    - Lock key format: `lock:{merchantId}:{serviceId}:{slotTime}`
    - TTL: 10 saniye
    - _Requirements: 10.4, 12.1, 12.2, 12.3_

  - [ ] 13.2 Booking creation core logic
    - `createBooking()` - Firestore transaction ile booking oluştur
    - Slot availability verification (double-check after lock)
    - available_count atomik decrement (Firestore FieldValue.increment(-1))
    - Idempotency key kontrolü
    - _Requirements: 10.5, 10.6, 10.7, 10.13, 12.5, 12.6, 12.7_

  - [ ] 13.3 Booking status ve lifecycle yönetimi
    - Status: pending, confirmed, cancelled_by_merchant, cancelled_by_user, completed, no_show
    - Status history tracking (statusHistory array)
    - Cancel booking logic (available_count increment)
    - _Requirements: 11.3, 12.8_

  - [ ]* 13.4 Property test: Distributed Lock Lifecycle (Property 19)
    - **Property 19: Distributed Lock Lifecycle**
    - **Validates: Requirements 10.4, 10.5, 10.9**
    - Lock acquire → verify → create → release sequence doğru çalışmalı
    - 100 concurrent booking scenario ile test

  - [ ]* 13.5 Property test: Capacity Round-Trip (Property 26)
    - **Property 26: Capacity Round-Trip Property**
    - **Validates: Requirements 12.7, 12.8**
    - Booking create (decrement) → cancel (increment) sonucu available_count başlangıç değerine dönmeli
    - 100 create-cancel cycle ile test


- [ ] 14. CreateBooking Real-Time API
  - [ ] 14.1 CreateBooking endpoint ve middleware
    - `POST /v1/google/createBooking`
    - JWT validation middleware
    - Request body validation (merchant_id, service_id, slot, user_information, idempotency_key)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.2 Booking creation orchestration
    - Idempotency check (return existing booking if key exists)
    - Lock acquisition
    - Slot verification
    - Booking creation (Firestore transaction)
    - Lock release
    - _Requirements: 10.4, 10.5, 10.6, 10.7, 10.9, 10.13_

  - [ ] 14.3 Response formatter ve error handling
    - Success response: booking_id, status, confirmation_code, booking_url
    - 409 Conflict: slot unavailable + alternative slots
    - 503 Service Unavailable: lock timeout
    - _Requirements: 10.6, 10.8, 12.4_

  - [ ] 14.4 Async post-processing (Bull queue jobs)
    - Notification job: email + SMS (business owner + customer)
    - Webhook job: Google'a booking status update
    - Analytics tracking job
    - _Requirements: 10.10, 10.11, 10.12_

  - [ ] 14.5 Performance monitoring ve audit logging
    - Response time tracking (p50, p95, p99)
    - Audit log: booking_id, merchant_id, status, duration
    - Alert: p95 > 2000ms
    - _Requirements: 10.12, 17.6_

  - [ ] 14.6 Rate limiting
    - 5 req/sec per merchant
    - 429 response + Retry-After header
    - _Requirements: 16.3, 16.6_

  - [ ]* 14.7 CreateBooking integration test'leri
    - Valid request → 200 OK + booking created
    - Race condition prevention (simultaneous requests)
    - Idempotent request handling
    - Slot unavailable → 409 Conflict
    - Lock timeout → 503
    - Rate limiting enforcement
    - _Requirements: 10.1-10.13_

- [ ] 15. Checkpoint - RWG Real-Time API tamamlama
  - Tüm testlerin geçtiğini doğrula
  - Manual test: Mock JWT ile CheckAvailability ve CreateBooking çağır
  - Performance test: CheckAvailability p95 < 1000ms, CreateBooking p95 < 2000ms
  - Kullanıcıya sorular varsa sor

- [ ] 16. Feed Generator Service (Merchant, Service, Availability feeds)
  - [ ] 16.1 Feed Generator base infrastructure
    - Feed type enum: MERCHANT, SERVICE, AVAILABILITY
    - JSON Lines serializer (newline-delimited JSON)
    - Gzip compressor
    - File naming: `{feedType}_feed_{timestamp}.json.gz`
    - _Requirements: 6.1, 7.1, 8.1_

  - [ ] 16.2 Merchant Feed builder
    - `generateMerchantFeed()` - RWG aktif işletmeleri Firestore'dan query et
    - JSON schema: merchant_id, name, address, phone, url, category, location
    - Batch processing (1000 kayıt/batch)
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 16.3 Service Feed builder
    - `generateServiceFeed()` - Tüm aktif hizmetleri query et
    - JSON schema: service_id, merchant_id, service_name, description, duration (ISO 8601), price (ISO 4217)
    - Category mapping (Google taxonomy)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 16.4 Availability Feed builder
    - `generateAvailabilityFeed()` - Önümüzdeki 90 gün için slot'lar generate et
    - JSON schema: slot_id, merchant_id, service_id, start_time (ISO 8601 + timezone), duration, available_spots, resources
    - Dolu slotları exclude et (available_spots: 0)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.9_

  - [ ] 16.5 Incremental feed generator
    - `generateIncrementalFeed()` - Son update'den bu yana değişen kayıtlar
    - Silinen kayıtlar için status: DELETED flag'i
    - _Requirements: 7.7, 7.8, 8.8_

  - [ ] 16.6 Feed validation ve schema checker
    - JSON schema validation (required fields, types)
    - Feed record count, file size logging
    - _Requirements: 6.2, 7.2, 8.2_

  - [ ]* 16.7 Property test: Feed Serialization Round-Trip (Property 28)
    - **Property 28: Feed Serialization Round-Trip**
    - **Validates: Parser/Serializer Requirements**
    - parse(serialize(obj)) === obj doğrulanmalı
    - 100 farklı feed record ile test

- [ ] 17. SFTP Client (Google SFTP sunucusuna upload)
  - [ ] 17.1 SFTP connection manager
    - SSH key authentication
    - Connection pooling ve retry logic
    - Health check: connection test
    - _Requirements: 18.4, 18.5_

  - [ ] 17.2 Feed upload orchestrator
    - `uploadFeed()` - Local feed dosyasını Google SFTP'ye yükle
    - MD5 checksum verification
    - Retry logic: 5 deneme, exponential backoff (1m, 2m, 4m, 8m, 16m)
    - _Requirements: 18.6, 18.7_

  - [ ] 17.3 Feed backup ve cleanup
    - Local backup (Cloud Storage): 7 gün saklama
    - Temp file cleanup
    - _Requirements: 18.1, 18.8, 18.11_

  - [ ] 17.4 Feed status tracking
    - Firestore: google_feed_status collection
    - Status: pending, uploading, success, failed
    - Upload attempts, errors, timestamps
    - _Requirements: 6.6, 7.6, 8.7, 18.2_

  - [ ]* 17.5 SFTP client için integration test'ler
    - Mock SFTP server ile upload testi
    - Retry logic
    - MD5 verification
    - _Requirements: 18.1-18.11_

- [ ] 18. Cloud Scheduler Jobs (Cron jobs for feeds)
  - [ ] 18.1 Merchant Feed job (günlük 03:00)
    - Cloud Scheduler trigger → Bull queue job
    - Feed generation → SFTP upload → Status log
    - Error notification (email/Slack)
    - _Requirements: 6.1, 6.6, 6.9_

  - [ ] 18.2 Service Feed job (günlük 03:30)
    - Full feed: günlük 03:30
    - Incremental feed: her saat başı
    - _Requirements: 7.1, 7.6, 7.7_

  - [ ] 18.3 Availability Feed job (her 4 saatte)
    - Schedule: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
    - Full feed: her 4 saatte
    - Incremental feed: ani değişikliklerde (booking create/cancel trigger)
    - _Requirements: 8.1, 8.7, 8.8_

  - [ ] 18.4 Location sync job (günlük)
    - Her gün GBP'den lokasyonları sync et
    - Verification status değişikliklerini detect et ve deaktive et
    - _Requirements: 2.6, 2.7_

  - [ ] 18.5 Token refresh job (proaktif)
    - Expire yaklaşan token'ları yenile (24 saat önceden)
    - _Requirements: 1.5_

- [ ] 19. Checkpoint - Feed Generation ve SFTP tamamlama
  - Feed generation test: 1000 business ile feed oluştur
  - SFTP upload test (staging SFTP server)
  - Cron job scheduling test
  - Kullanıcıya sorular varsa sor


- [ ] 20. Webhook Handler (Google'a status güncellemeleri gönderme)
  - [ ] 20.1 Webhook client implementasyonu
    - `sendWebhook()` - Google webhook endpoint'ine POST request
    - Retry logic: 3 deneme, exponential backoff
    - Timeout: 10 saniye
    - _Requirements: 11.2, 11.9_

  - [ ] 20.2 Booking status change webhook
    - Trigger: booking status değiştiğinde (confirmed, cancelled, completed, no_show)
    - Payload: booking_id, status, reason, timestamp
    - _Requirements: 11.1, 11.3, 11.4_

  - [ ] 20.3 Webhook delivery tracking
    - Audit log: webhook sent, success/failure, retry attempts
    - Failed webhook'lar için dead letter queue
    - 24 saat boyunca retry
    - _Requirements: 11.9_

  - [ ]* 20.4 Webhook handler için integration test'ler
    - Mock Google webhook endpoint
    - Retry logic test
    - Delivery tracking
    - _Requirements: 11.1-11.9_

- [ ] 21. Notification Service (Email + SMS + In-App)
  - [ ] 21.1 Notification template manager
    - Email templates (Handlebars/Pug): booking confirmed, booking cancelled, OAuth error, feed error
    - SMS templates: kısa mesajlar
    - In-app notification templates
    - Multi-language support (i18n)
    - _Requirements: 21.6, 21.7, 28.8_

  - [ ] 21.2 Email notification sender (SendGrid/Mailgun)
    - `sendEmail()` - Transactional email gönder
    - Personalization: business name, customer name, booking details
    - _Requirements: 21.1, 21.8_

  - [ ] 21.3 SMS notification sender (Twilio/Vonage)
    - `sendSMS()` - SMS gönder
    - _Requirements: 21.1, 21.9_

  - [ ] 21.4 In-app notification handler
    - Firestore collection: notifications
    - Real-time listener (Firebase Realtime Database veya Firestore onSnapshot)
    - _Requirements: 21.2_

  - [ ] 21.5 Notification preferences ve event routing
    - Preferences: email, SMS, inApp (boolean flags per event type)
    - Event types: newBooking, bookingCancelled, syncError, tokenExpiry, feedError
    - Critical events: tüm kanallara gönder (override preferences)
    - _Requirements: 21.2, 21.3, 21.4_

  - [ ] 21.6 Notification queue job processor
    - Bull queue consumer: notification jobs
    - Async processing (non-blocking)
    - Delivery status tracking
    - _Requirements: 21.5, 21.10_

  - [ ]* 21.7 Notification service için unit test'ler
    - Template rendering
    - Email/SMS API mocking
    - Preferences enforcement
    - _Requirements: 21.1-21.10_

- [ ] 22. Analytics ve Tracking (Google Analytics 4 entegrasyonu)
  - [ ] 22.1 GA4 event tracking setup
    - GA4 Measurement Protocol implementasyonu
    - Custom events: appointment_url_view, service_selected, date_selected, booking_completed, booking_cancelled
    - _Requirements: 3.8, 26.2, 26.3_

  - [ ] 22.2 Source tracking ve attribution
    - UTM parameters parsing (utm_source, utm_medium, utm_campaign)
    - Referrer tracking
    - Source: google_reserve, google_appointment_url, direct, other
    - _Requirements: 3.3, 26.1_

  - [ ] 22.3 Funnel analizi
    - Funnel stages: view → service_select → date_select → booking
    - Conversion rate calculation
    - Dashboard'da visualization
    - _Requirements: 26.4, 26.5_

  - [ ] 22.4 Business metrics calculation
    - Average booking value (ABV) by source
    - Cohort analysis: retention rate of Google-sourced customers
    - Benchmark metrics (sektör ortalaması ile karşılaştırma)
    - _Requirements: 26.6, 26.10, 26.11_

  - [ ]* 22.5 Analytics için background job'lar
    - Günlük aggregation job: metrikleri hesapla ve Firestore'a kaydet
    - Aylık rapor generation job (PDF/Excel export)
    - _Requirements: 26.7, 26.8_

- [ ] 23. Error Handling ve Fallback Mekanizmaları
  - [ ] 23.1 Circuit breaker implementasyonu
    - External service wrapper: GBP API, Google SFTP, webhook
    - State: CLOSED, OPEN, HALF_OPEN
    - Threshold: 10 ardışık başarısızlık → OPEN (5 dakika)
    - _Requirements: 23.5, 23.6, 23.7_

  - [ ] 23.2 Fallback strategies
    - GBP API unreachable → Queue job for later
    - SFTP unreachable → Local backup + retry
    - CheckAvailability timeout → Return cached data (if available)
    - CreateBooking timeout → Queue job + "confirmation pending" mesaj
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [ ] 23.3 Health check endpoint
    - `GET /health` - Tüm dependency'lerin sağlık durumu
    - Response: {status: healthy|degraded|down, services: {...}}
    - _Requirements: 17.1, 17.2, 23.7_

  - [ ] 23.4 Graceful degradation
    - Degraded mode: Essential features only (cache + basic booking)
    - Down mode: Maintenance message
    - _Requirements: 23.7, 23.8_

  - [ ]* 23.5 Error handling için integration test'ler
    - Circuit breaker state transitions
    - Fallback mechanisms
    - Health check scenarios
    - _Requirements: 23.1-23.9_

- [ ] 24. Checkpoint - Error Handling ve Monitoring tamamlama
  - Circuit breaker test: External service'leri manuel olarak fail ettir
  - Fallback mechanism test
  - Health check endpoint test
  - Kullanıcıya sorular varsa sor


- [ ] 25. Monitoring ve Observability (Cloud Monitoring + Sentry)
  - [ ] 25.1 Metrics collection setup
    - Cloud Monitoring custom metrics: API latency (p50, p95, p99), throughput, error rates
    - Redis metrics: cache hit ratio, memory usage
    - Firestore metrics: read/write ops
    - _Requirements: 17.3, 17.4, 17.5, 17.6_

  - [ ] 25.2 Structured logging
    - Winston/Pino logger setup (JSON format)
    - Log levels: DEBUG, INFO, WARN, ERROR, FATAL
    - Correlation ID tracking (distributed tracing)
    - _Requirements: 17.3, 17.4, 17.12_

  - [ ] 25.3 Alerting configuration
    - Critical latency: p95 > 1500ms (CheckAvailability), p95 > 2500ms (CreateBooking)
    - High error rate: 5xx > 5% for 5 minutes
    - Low cache hit ratio: < 70% for 15 minutes
    - Double booking incident: > 0
    - _Requirements: 17.7, 17.11_

  - [ ] 25.4 Sentry error tracking integration
    - Sentry SDK setup (Express middleware)
    - Error context: user ID, business ID, request ID
    - Performance monitoring (transaction tracking)
    - _Requirements: 17.3_

  - [ ] 25.5 Dashboard setup (Cloud Monitoring)
    - Real-time dashboard: request count, latency, error rate (son 1 saat)
    - Business metrics: booking count, conversion rate by source
    - SLA compliance: uptime, error budget
    - _Requirements: 17.8, 17.9, 17.10_

- [ ] 26. Security Implementation
  - [ ] 26.1 Security headers middleware
    - Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, CSP, Referrer-Policy
    - _Requirements: 15.10_

  - [ ] 26.2 Input sanitization middleware
    - DOMPurify + validator.js
    - Recursive object sanitization
    - _Requirements: 16.1_

  - [ ] 26.3 Secrets management (Cloud Secret Manager)
    - Google OAuth credentials
    - SFTP private key
    - API keys (SendGrid, Twilio)
    - _Requirements: 18.5_

  - [ ] 26.4 Firestore security rules deployment
    - google_integrations: business owner only
    - google_bookings: business or customer read
    - google_audit_logs: admin only
    - _Requirements: 1.4_

  - [ ]* 26.5 Security audit
    - Penetration test (OWASP Top 10)
    - Dependency vulnerability scan (npm audit, Snyk)
    - Token leakage test
    - _Requirements: 27.1, 27.2_

- [ ] 27. Multi-language Support (i18n)
  - [ ] 27.1 i18n setup (react-i18next + i18next)
    - Desteklenen diller: tr, en, de, fr, ar
    - Language detection: URL param → browser → GBP location → default (tr)
    - _Requirements: 28.1, 28.2_

  - [ ] 27.2 Translation files
    - Landing page UI strings
    - Email/SMS templates
    - Dashboard UI strings
    - _Requirements: 28.3, 28.8_

  - [ ] 27.3 Locale-specific formatting
    - Tarih/saat formatı (24h vs 12h)
    - Para birimi formatı (100,50 TL vs $100.50)
    - Timezone conversions
    - _Requirements: 28.4, 28.5, 28.6_

  - [ ] 27.4 Service name/description multi-language storage
    - Firestore: service name ve description için map (locale → string)
    - _Requirements: 28.7_

- [ ] 28. Documentation ve Onboarding
  - [ ] 28.1 Kullanıcı dokümantasyonu
    - Adım adım rehber (Markdown): OAuth bağlama, lokasyon aktivasyonu, dashboard kullanımı
    - FAQ bölümü: yaygın sorular ve cevaplar
    - Troubleshooting guide: yaygın hatalar ve çözümleri
    - _Requirements: 29.1, 29.6, 29.7_

  - [ ] 28.2 Video tutorial'lar
    - OAuth connection flow (screen recording + voiceover)
    - Location activation ve URL test (screen recording)
    - Dashboard walkthrough (screen recording)
    - _Requirements: 29.2_

  - [ ] 28.3 Interactive onboarding wizard
    - 5 adım: Google hesabı bağla → Lokasyon seç → URL test et → Bildirimleri ayarla → Paketi aktive et
    - Tooltip ve yardım metinleri her adımda
    - _Requirements: 29.3, 29.4, 29.5_

  - [ ] 28.4 Contextual help sistem
    - Dashboard'da her sayfada "?" butonu → ilgili yardım içeriği (modal/sidebar)
    - _Requirements: 29.9_

  - [ ] 28.5 Email onboarding serisi
    - Gün 1: Hoşgeldin email (platform özellikleri)
    - Gün 3: İlk randevunu aldın mı? (motivasyon + tips)
    - Gün 7: İpuçları ve best practices
    - _Requirements: 29.10_

  - [ ]* 28.6 Teknik dokümantasyon (Developer docs)
    - API reference: endpoint'ler, request/response schemas, error codes
    - Webhook schemas: booking status update payloads
    - Feed formats: Merchant, Service, Availability JSON schemas
    - _Requirements: 29.8_

- [ ] 29. Destek ve Bakım Altyapısı
  - [ ] 29.1 Destek ticket sistemi entegrasyonu
    - Integration Dashboard → "Destek Talebi Oluştur" butonu
    - Otomatik diagnostic info ekleme (entegrasyon durumu, son hatalar, sistem logları)
    - Zendesk/Freshdesk API entegrasyonu
    - _Requirements: 30.2, 30.3, 30.6_

  - [ ] 29.2 Self-service diagnostics tool
    - "Bağlantıyı Test Et" butonu: OAuth token geçerliliği, GBP API erişimi, appointmentUrl durumu
    - Sonuçları görüntüle + düzeltme önerileri
    - _Requirements: 30.7_

  - [ ] 29.3 Status page (Uptime monitoring)
    - Public status page: Entegrasyon servisleri uptime (Real-Time API, Feed Upload, Landing Pages)
    - Incident history ve planned maintenance
    - _Requirements: 30.10_

  - [ ] 29.4 Known issues sayfası
    - Devam eden sorunlar listesi (başlık, açıklama, ETA)
    - Otomatik update (Firestore collection → public page)
    - _Requirements: 30.8_

  - [ ] 29.5 Planned maintenance bildirimleri
    - Email + in-app notification: en az 48 saat önceden
    - Maintenance mode flag (health check → degraded)
    - _Requirements: 30.9_


- [ ] 30. Data Integrity ve Reconciliation
  - [ ] 30.1 Günlük tam senkronizasyon job'u
    - Her gece 02:00: Platform DB ↔ Google sistemleri karşılaştırma
    - GBP appointmentUrl doğruluğu kontrolü
    - Platform'daki aktif bookings ↔ Google bookings consistency
    - _Requirements: 24.1, 24.2_

  - [ ] 30.2 Tutarsızlık detection ve otomatik düzeltme
    - Tespit edilen tutarsızlıkları otomatik düzelt (GBP update, booking sync)
    - Düzeltilemeyen tutarsızlıkları admin paneline raporla
    - _Requirements: 24.3, 24.4_

  - [ ] 30.3 Unique identifier ve traceability
    - Her booking için UUID (bookingId)
    - Google booking'leri için googleBookingId field
    - Correlation ID tracking (tüm log'larda)
    - _Requirements: 24.5, 24.6_

  - [ ] 30.4 Eventual consistency model
    - Webhook delivery failure → 24 saat boyunca retry
    - Dead letter queue → manual review
    - _Requirements: 24.7, 24.8, 24.9_

  - [ ]* 30.5 Reconciliation job için integration test
    - Mock tutarsızlık senaryoları (appointmentUrl mismatch, booking mismatch)
    - Otomatik düzeltme test
    - _Requirements: 24.1-24.10_

- [ ] 31. Pricing Module ve Subscription Management
  - [ ] 31.1 Paket tanımları ve metadata
    - Paketler: "Google Görünürlük" (Aşama 1), "Google Rezervasyon" (Aşama 2)
    - Pricing: aylık/yıllık abonelik, trial period (14 gün)
    - Paket kısıtlamaları: Aşama 2 sadece Aşama 1 aktif olanlara
    - _Requirements: 20.1, 20.2, 20.3, 20.8_

  - [ ] 31.2 Abonelik aktivasyonu ve deaktivasyon
    - Satın alma → otomatik entegrasyon aktivasyonu
    - İptal → entegrasyon deaktivasyonu + GBP appointmentUrl kaldırma
    - _Requirements: 20.4, 20.5, 20.6_

  - [ ] 31.3 Paket bilgilerini dashboard'da göster
    - Aktif paket, kalan süre, yenileme tarihi
    - Upgrade/downgrade butonları
    - _Requirements: 20.7_

  - [ ] 31.4 Komisyon modelini destekle (opsiyonel)
    - Rezervasyon başına komisyon tracking
    - Aylık fatura hesaplama
    - _Requirements: 20.9_

  - [ ] 31.5 Kademeli fiyatlandırma (lokasyon sayısı bazında)
    - Pricing tiers: 1-5 lokasyon, 6-20 lokasyon, 20+ lokasyon
    - Otomatik fiyat hesaplama
    - _Requirements: 20.10_

- [ ] 32. Google Actions Center Onboarding (Production için hazırlık)
  - [ ] 32.1 Partner başvuru dokümantasyonunu hazırla
    - Teknik dokümantasyon: API endpoints, schemas, SLA commitments
    - Business dokümantasyon: company info, use cases, customer count
    - _Requirements: 5.1_

  - [ ] 32.2 Data feed formatlarını Google schema'ya uygunla
    - Google'ın JSON/ProtoBuf schema'larına tam uyumluluk
    - Validation: Google'ın schema validation tool'u
    - _Requirements: 5.2_

  - [ ] 32.3 Google End-to-End Testing Tool ile test
    - Google'ın test environment'ında CheckAvailability ve CreateBooking test
    - Test senaryolarını geç (success, conflict, error handling)
    - _Requirements: 5.4_

  - [ ] 32.4 Performance gereksinimlerini karşıla
    - Load test: 1000 concurrent CheckAvailability request → p95 < 1000ms
    - Load test: 500 concurrent CreateBooking request → p95 < 2000ms
    - _Requirements: 5.5_

  - [ ] 32.5 Security gereksinimlerini karşıla
    - HTTPS enforcement
    - JWT validation
    - Rate limiting
    - Security audit raporu hazırla
    - _Requirements: 5.6_

  - [ ] 32.6 Production approval süreci
    - Google'a başvuru gönder
    - Feedback döngüsü: fixes ve re-test
    - Production approval al
    - _Requirements: 5.7_

- [ ] 33. Checkpoint - Google Actions Center Onboarding tamamlama
  - Google test environment'da tüm senaryoları geç
  - Performance ve security audit'leri tamamla
  - Production approval bekle
  - Kullanıcıya sorular varsa sor

- [ ] 34. Performance Optimization (Production öncesi fine-tuning)
  - [ ] 34.1 Cache stratejisini optimize et
    - Cache hit ratio hedefi: %80+
    - Cache key pattern optimization
    - Cache warming strategy (pre-populate popular queries)
    - _Requirements: 13.3, 13.4, 13.9_

  - [ ] 34.2 Database query optimizasyonu
    - Firestore composite index'leri deploy et
    - N+1 query problemini çöz (batch read)
    - Firestore read/write maliyetini minimize et
    - _Requirements: 13.7, 13.8_

  - [ ] 34.3 Response compression
    - Gzip compression middleware (Express)
    - Threshold: 1KB+ responses
    - _Requirements: 13.1_

  - [ ] 34.4 Connection pooling
    - Redis connection pool configuration (min: 10, max: 50)
    - Firestore built-in pooling optimize et
    - _Requirements: 13.1_

  - [ ]* 34.5 CDN ve static asset optimization (Vercel)
    - Image optimization (WebP, lazy loading)
    - Code splitting (vendor chunks)
    - Cache headers (s-maxage, stale-while-revalidate)
    - _Requirements: 13.1_

  - [ ]* 34.6 Load testing (Artillery/k6)
    - Sustained load: 50 req/sec for 5 minutes
    - Spike: 100 req/sec for 1 minute
    - SLA validation: p95 latency, error rate < 1%
    - _Requirements: 5.5_


- [ ] 35. Deployment Strategy Implementasyonu
  - [ ] 35.1 Blue-green deployment setup
    - Cloud Functions traffic splitting configuration
    - Canary deployment: 10% traffic → yeni version, 90% → mevcut version
    - Success criteria: error rate < 1%, p95 latency baseline'a yakın
    - _Requirements: Deployment Strategy_

  - [ ] 35.2 Rollback procedure implementasyonu
    - Automated rollback trigger: error rate > 5%, p95 latency > 2x baseline
    - Manual rollback command: shift 100% traffic to previous version
    - Database migration rollback (if applicable)
    - _Requirements: Deployment Strategy_

  - [ ] 35.3 Health check integration
    - Liveness probe: `/health`
    - Readiness probe: `/ready` (check all dependencies)
    - Deployment gating: new version deploy only if health checks pass
    - _Requirements: 17.1, 17.2_

  - [ ] 35.4 CI/CD pipeline (GitHub Actions / Cloud Build)
    - Build: TypeScript compile, lint, unit tests
    - Test: Integration tests, E2E tests
    - Deploy: Cloud Functions deploy (staging → production)
    - Notifications: Slack/email on deploy success/failure
    - _Requirements: 22.9_

- [ ] 36. Final Integration Tests (E2E - Full Flow)
  - [ ]* 36.1 Aşama 1 E2E test suite (Playwright)
    - Senaryo 1: Business owner OAuth bağlama → lokasyon aktive et → appointmentUrl GBP'ye yazıldı
    - Senaryo 2: Customer landing page ziyaret → hizmet seç → tarih/saat seç → randevu al → confirmation
    - Senaryo 3: Business owner dashboard'da randevu görüntüle → iptal et → customer email
    - _Requirements: Aşama 1 genel_

  - [ ]* 36.2 Aşama 2 E2E test suite (API level)
    - Senaryo 1: Google JWT ile CheckAvailability → available slots dön
    - Senaryo 2: Google JWT ile CreateBooking → booking confirmed → webhook sent
    - Senaryo 3: Simultaneous CreateBooking (race condition) → sadece biri success
    - Senaryo 4: Idempotent CreateBooking → aynı booking dön
    - _Requirements: Aşama 2 genel_

  - [ ]* 36.3 Feed generation ve SFTP E2E test
    - Senaryo 1: Cron job tetikle → Merchant feed generate → SFTP upload → success log
    - Senaryo 2: Service feed incremental update → sadece değişenler upload
    - Senaryo 3: Availability feed → 90 günlük slot'lar generate → upload
    - _Requirements: 6.1-6.9, 7.1-7.8, 8.1-8.10_

- [ ] 37. Production Deployment ve Monitoring
  - [ ] 37.1 Staging deployment ve smoke test
    - Deploy to staging environment
    - Smoke test: critical paths (OAuth, booking, feed)
    - Performance test: latency ve throughput
    - _Requirements: Deployment Strategy_

  - [ ] 37.2 Production deployment (Aşama 1)
    - Blue-green deploy: OAuth service, GBP integration, Landing page
    - Canary rollout: 10% → 50% → 100%
    - Monitor: error rate, latency, user feedback
    - _Requirements: Deployment Strategy_

  - [ ] 37.3 Post-deployment validation (Aşama 1)
    - Real user testing: 5 pilot business'lar ile test
    - Feedback collection: bugs, UX issues
    - Bug fixes ve iteration
    - _Requirements: Deployment Strategy_

  - [ ] 37.4 Production deployment (Aşama 2 - Google approval sonrası)
    - Deploy: RWG Real-Time API, Feed Generator, SFTP Client
    - Google'dan production onay sonrası live geç
    - Monitor: Google entegrasyon health, SLA compliance
    - _Requirements: 5.7, Deployment Strategy_

- [ ] 38. Post-Launch Monitoring ve Optimization
  - [ ] 38.1 İlk 24 saat monitoring
    - Real-time dashboard: request count, error rate, latency
    - On-call engineer: kritik hatalar için immediate response
    - _Requirements: 17.8_

  - [ ] 38.2 İlk hafta performance analizi
    - SLA compliance: %99.9 uptime, p95 latency targets
    - User feedback: bug reports, feature requests
    - Optimization opportunities: cache tuning, query optimization
    - _Requirements: 17.9, 17.10_

  - [ ] 38.3 İlk ay business metrics review
    - Conversion rate: appointment URL view → booking
    - Google booking volume: total bookings, growth rate
    - Customer retention: cohort analysis (Google-sourced vs direct)
    - _Requirements: 26.4, 26.5, 26.10_

  - [ ] 38.4 Post-mortem ve lessons learned
    - Deployment sorunları ve çözümler
    - Performance bottleneck'ler ve optimizasyonlar
    - User feedback özeti ve roadmap update
    - _Requirements: General_

---

## Final Checkpoint

- [ ] 39. Production hazır olduğunu doğrula
  - Tüm testler geçti mi? (unit, integration, E2E, property-based, load test)
  - Google Actions Center approval alındı mı? (Aşama 2 için)
  - Documentation tamamlandı mı? (user docs, API reference, video tutorials)
  - Monitoring ve alerting aktif mi?
  - Rollback procedure test edildi mi?
  - On-call engineer atandı mı?
  - Pilot customers hazır mı?
  - Marketing ve launch plan hazır mı?

---

## Notes

### Tahmini Süre ve Öncelikler

**Aşama 1 (Google Görünürlük - MVP)**:
- Görev 1-9: Altyapı, OAuth, GBP, Landing Page, Dashboard
- Tahmini süre: **6-8 hafta**
- Bağımlılıklar: Firebase/GCP setup, Google OAuth credentials
- Kritik path: OAuth → GBP integration → Landing page

**Aşama 2 (Google Rezervasyon - Advanced)**:
- Görev 10-33: RWG Real-Time API, Feed Generation, SFTP, Monitoring
- Tahmini süre: **10-14 hafta** (Google approval süresi hariç)
- Bağımlılıklar: Aşama 1 tamamlanmış, Google Actions Center approval
- Kritik path: JWT validation → Real-Time API → Feed generation → Google testing

**Production Deployment ve Optimization**:
- Görev 34-38: Performance tuning, deployment, monitoring
- Tahmini süre: **2-3 hafta**

**Toplam tahmini süre: 18-25 hafta (4.5-6 ay)**

### Paralel Çalışma Fırsatları

- **Frontend ve Backend paralel**: Task 6 (Landing Page) ve Task 7 (Backend API) paralel geliştirilebilir
- **Aşama 1 tamamlanırken Aşama 2 başlangıcı**: Task 10 (JWT Validator) Task 9 tamamlanmadan başlayabilir
- **Feed builders paralel**: Task 16.2, 16.3, 16.4 (Merchant, Service, Availability feeds) paralel implement edilebilir

### Risk Alanları ve Dikkat Edilmesi Gerekenler

1. **Race Condition**: Task 13 (Booking Engine) ve Task 14 (CreateBooking API) - distributed locking kritik
2. **Performance**: Task 11-12 (Availability ve CheckAvailability) - 1000ms SLA zorlu olabilir, caching ve optimization kritik
3. **Google Approval**: Task 32 (Actions Center Onboarding) - approval süreci 4-8 hafta sürebilir, erken başla
4. **SFTP Connectivity**: Task 17 (SFTP Client) - Google SFTP credentials ve network connectivity test et
5. **Feed Size**: Task 16 (Feed Generator) - 100K+ business için feed size gigabyte'lara çıkabilir, pagination/chunking gerekebilir

### Test Coverage Hedefleri

- **Unit Tests**: %80+ code coverage
- **Integration Tests**: Tüm API endpoints ve external service entegrasyonları
- **Property-Based Tests**: En az 5 kritik property (encryption, JWT, locking, availability, feed serialization)
- **E2E Tests**: 3 ana user journey (OAuth flow, booking flow, feed generation)
- **Load Tests**: CheckAvailability ve CreateBooking için SLA validation

### Güvenlik Checklist (Production öncesi)

- [ ] OAuth tokens encrypted (AES-256-GCM)
- [ ] JWT validation complete (signature, expiration, issuer, audience, replay protection)
- [ ] Rate limiting aktif (tüm endpoints)
- [ ] HTTPS zorunlu (HTTP redirect)
- [ ] Security headers set (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Input sanitization (XSS, SQL injection koruması)
- [ ] Secrets Cloud Secret Manager'da (hardcoded secret yok)
- [ ] Firestore security rules deployed
- [ ] Dependency vulnerability scan temiz (npm audit, Snyk)
- [ ] Penetration test tamamlandı

