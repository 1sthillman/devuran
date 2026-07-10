# Requirements Document: Google Maps/Google Business Profile Entegrasyonu

## Introduction

Bu doküman, mevcut web tabanlı SaaS randevu ve rezervasyon yönetim platformuna Google Maps ve Google Business Profile entegrasyonunun eklenmesi için gereksinim spesifikasyonlarını tanımlar. Sistem, işletmelerin Google Maps profilleri üzerinden doğrudan randevu almalarını sağlayacak iki aşamalı bir entegrasyon stratejisi izleyecektir.

**Amaç**: İşletmelerin Google ekosistemi üzerinden görünürlüklerini artırmak ve müşterilerin Google Maps/Search üzerinden doğrudan randevu alabilmelerini sağlamak.

**Kapsam**: 
- Aşama 1: Google Business Profile API ile randevu URL entegrasyonu (Hızlı çözüm)
- Aşama 2: Reserve with Google programı entegrasyonu (Gelişmiş çözüm)

**Hedef Kullanıcılar**:
- İşletme Sahipleri: Google Business Profile hesabı olan işletmeler
- Son Kullanıcılar: Google Maps/Search üzerinden randevu almak isteyen müşteriler
- Sistem Yöneticileri: Entegrasyonu yöneten platform yöneticileri

## Glossary

- **Platform**: Mevcut web tabanlı SaaS randevu ve rezervasyon yönetim sistemi
- **GBP**: Google Business Profile - işletmelerin Google üzerindeki dijital profili
- **GBP_API**: Google Business Profile API - işletme bilgilerini yönetmek için Google API'si
- **OAuth_Service**: OAuth 2.0 kimlik doğrulama ve yetkilendirme servisi
- **Appointment_URL**: İşletmeye özel benzersiz randevu sayfası bağlantısı
- **RWG**: Reserve with Google - Google'ın doğrudan rezervasyon programı
- **Actions_Center**: Google Actions Center (Partner Portal) - RWG entegrasyonunu yönetmek için Google platformu
- **Data_Feed**: İşletme, hizmet ve müsaitlik bilgilerini içeren yapılandırılmış veri akışı
- **Real_Time_API**: CheckAvailability ve CreateBooking işlemleri için senkron API endpoint'leri
- **JWT_Validator**: Google'dan gelen istekleri doğrulamak için JSON Web Token doğrulama servisi
- **Booking_Engine**: Platformun randevu oluşturma ve yönetme motoru
- **Availability_Engine**: Platformun müsaitlik hesaplama ve sorgulama motoru
- **Cache_Layer**: Redis tabanlı önbellekleme katmanı
- **Queue_System**: Asenkron işlemleri yönetmek için kuyruk sistemi (örn: Bull/BullMQ)
- **Lock_Manager**: Eş zamanlı randevu çakışmalarını önleyen kilitleme mekanizması
- **Integration_Dashboard**: İşletme sahiplerinin entegrasyonu yönettiği admin paneli
- **Webhook_Handler**: Google'dan gelen webhook bildirimleri işleyen servis
- **SFTP_Client**: Google SFTP sunucusuna Data_Feed yükleyen istemci
- **Merchant_Feed**: İşletme listesi veri akışı
- **Service_Feed**: Hizmet katalogu veri akışı
- **Availability_Feed**: Müsaitlik slotları veri akışı
- **Pricing_Module**: Entegrasyon paketleme ve fiyatlandırma modülü
- **Audit_Logger**: Tüm entegrasyon işlemlerini kaydeden denetim sistemi

---

## Requirements

### Requirement 1: OAuth 2.0 Kimlik Doğrulama ve Yetkilendirme

**User Story:** İşletme sahibi olarak, Google Business Profile hesabımı platforma güvenli bir şekilde bağlamak istiyorum, böylece platformun benim adıma GBP üzerinde işlem yapmasına izin verebilirim.

#### Acceptance Criteria

1. THE Platform SHALL OAuth 2.0 authorization code flow kullanarak işletme sahiplerinin Google hesaplarını bağlamasını sağlamak
2. WHEN bir işletme sahibi Google hesabı bağlama işlemini başlattığında, THE OAuth_Service SHALL gerekli Google API scope'larını (businessinformation.locations.readonly, businessinformation.locations) içeren yetkilendirme URL'si oluşturmak
3. WHEN Google yetkilendirmesi başarılı olduğunda, THE OAuth_Service SHALL authorization code'u access token ve refresh token ile değiştirmek
4. THE OAuth_Service SHALL refresh token'ı Firestore'da şifreli olarak saklamak
5. WHEN access token süresi dolduğunda, THE OAuth_Service SHALL refresh token kullanarak otomatik olarak yeni access token almak
6. THE Platform SHALL token yenileme hatalarını yakalayıp işletme sahibini yeniden yetkilendirme için yönlendirmek
7. THE Integration_Dashboard SHALL işletme sahiplerine bağlı Google hesaplarını görüntüleme ve bağlantıyı kaldırma imkanı sunmak
8. WHEN bir işletme sahibi bağlantıyı kaldırdığında, THE OAuth_Service SHALL ilgili tüm token'ları Firestore'dan silmek ve Google'a token iptal isteği göndermek

---

### Requirement 2: Google Business Profile Lokasyon Yönetimi

**User Story:** İşletme sahibi olarak, Google Business Profile hesabımdaki tüm lokasyonlarımı platformda görmek ve yönetmek istiyorum, böylece hangi lokasyonlar için randevu entegrasyonu aktif edeceğimi seçebilirim.

#### Acceptance Criteria

1. WHEN bir işletme sahibi OAuth ile bağlandığında, THE GBP_API SHALL işletmeye ait tüm GBP lokasyonlarını listelemek
2. THE Platform SHALL her lokasyon için şu bilgileri saklamak: location ID, işletme adı, adres, telefon, kategori, doğrulama durumu
3. THE Integration_Dashboard SHALL lokasyonları tablo formatında görüntülemek (ad, adres, durum, entegrasyon durumu kolonları ile)
4. THE Integration_Dashboard SHALL sadece doğrulanmış (verified) lokasyonlar için entegrasyon aktivasyonuna izin vermek
5. WHEN bir lokasyon seçilip aktive edildiğinde, THE Platform SHALL o lokasyon için benzersiz bir Appointment_URL oluşturmak
6. THE Platform SHALL lokasyon verilerini günde bir kez otomatik olarak senkronize etmek
7. IF bir lokasyonun doğrulama durumu kaldırıldıysa, THE Platform SHALL o lokasyon için entegrasyonu otomatik olarak devre dışı bırakmak ve işletme sahibini bilgilendirmek

---

### Requirement 3: Benzersiz Randevu URL Oluşturma ve Yönetimi

**User Story:** Sistem yöneticisi olarak, her işletme lokasyonu için benzersiz, SEO dostu ve güvenli randevu URL'leri oluşturmak istiyorum, böylece müşteriler bu linkler üzerinden doğrudan randevu alabilsin.

#### Acceptance Criteria

1. WHEN bir lokasyon için entegrasyon aktive edildiğinde, THE Platform SHALL benzersiz bir slug oluşturmak (format: /book/{business-slug}/{location-slug}-{unique-id})
2. THE Platform SHALL slug'ın benzersizliğini Firestore'da kontrol etmek ve çakışma durumunda unique-id eklemek
3. THE Appointment_URL SHALL şu parametreleri desteklemek: utm_source, utm_medium, utm_campaign, referrer (Google Analytics entegrasyonu için)
4. THE Platform SHALL Appointment_URL'yi HTTPS protokolü ile sunmak
5. THE Platform SHALL her Appointment_URL için landing sayfasını 200ms içinde yüklemek
6. WHEN bir müşteri Appointment_URL'yi ziyaret ettiğinde, THE Platform SHALL ilgili işletmenin branding'ini (logo, renkler, hizmetler) göstermek
7. THE Integration_Dashboard SHALL işletme sahiplerine Appointment_URL'yi kopyalama, önizleme ve test etme imkanı sunmak
8. THE Platform SHALL her URL ziyaretini Analytics sistemine kaydetmek (kaynak, zaman, dönüşüm oranı)


---

### Requirement 4: Google Business Profile'a Randevu Linki Ekleme (Aşama 1)

**User Story:** İşletme sahibi olarak, oluşturulan randevu linkimin otomatik olarak Google Business Profile'ıma eklenmesini istiyorum, böylece müşteriler Google Maps/Search üzerinden beni bulduğunda doğrudan randevu alabilsinler.

#### Acceptance Criteria

1. WHEN bir lokasyon için entegrasyon aktive edildiğinde, THE GBP_API SHALL "appointmentUrl" özniteliğini ilgili GBP lokasyonuna eklemek
2. THE Platform SHALL GBP API'ye PATCH request göndererek appointmentUrl'yi güncellemek
3. THE Platform SHALL her güncelleme işleminin başarı/başarısızlık durumunu Firestore'da loglamak
4. IF GBP API güncelleme hatası döndürürse, THE Platform SHALL 3 kez exponential backoff ile yeniden denemek (1s, 2s, 4s)
5. IF 3 deneme de başarısız olursa, THE Platform SHALL işletme sahibine email ve platform bildirimi göndermek
6. THE Platform SHALL appointmentUrl güncellemelerini asenkron olarak Queue_System üzerinden işlemek
7. THE Integration_Dashboard SHALL her lokasyon için GBP üzerindeki appointmentUrl durumunu göstermek (aktif, beklemede, hata)
8. THE Platform SHALL appointmentUrl'nin GBP'de doğru görüntülendiğini test etmek için doğrulama endpoint'i sunmak

---

### Requirement 5: Reserve with Google (RWG) Partner Onboarding

**User Story:** Sistem yöneticisi olarak, platformumuzu Google Actions Center'a (Partner Portal) kaydetmek ve RWG programına katılmak istiyorum, böylece işletmelerimiz Google Maps üzerinden doğrudan randevu alabilsin.

#### Acceptance Criteria

1. THE Platform SHALL Google Actions Center'a partner başvurusu yapmak için gerekli tüm dokümantasyonu hazırlamak
2. THE Platform SHALL Data_Feed formatlarını Google'ın şemasına uygun olarak implement etmek (JSON veya Protocol Buffers)
3. THE Platform SHALL Real_Time_API endpoint'lerini Google'ın teknik gereksinimlerine uygun olarak oluşturmak
4. THE Platform SHALL Google tarafından sağlanan test araçlarını (End-to-End Testing Tool) kullanarak entegrasyonu doğrulamak
5. THE Platform SHALL minimum performans gereksinimlerini karşılamak: CheckAvailability < 1000ms, CreateBooking < 2000ms (p95)
6. THE Platform SHALL Google'ın güvenlik gereksinimlerini karşılamak: HTTPS, JWT validation, rate limiting
7. WHEN Google onboarding süreci tamamlandığında, THE Platform SHALL production ortamında RWG entegrasyonunu aktive etmek
8. THE Audit_Logger SHALL tüm Google Actions Center etkileşimlerini kaydetmek

---

### Requirement 6: Merchant Feed (İşletme Listesi) Yönetimi

**User Story:** Sistem yöneticisi olarak, RWG için aktif olan tüm işletmelerin bilgilerini güncel tutarak Google'a iletmek istiyorum, böylece Google Maps üzerinde doğru işletme bilgileri görüntülensin.

#### Acceptance Criteria

1. THE Platform SHALL her gün 03:00'da tüm RWG aktif işletmelerin Merchant_Feed dosyasını oluşturmak
2. THE Merchant_Feed SHALL şu alanları içermek: merchant_id, name, address, phone, url, category, location (lat/lng)
3. THE Platform SHALL Merchant_Feed'i JSON Lines formatında (newline-delimited JSON) oluşturmak
4. THE Platform SHALL Merchant_Feed dosyasını gzip ile sıkıştırmak
5. THE SFTP_Client SHALL Merchant_Feed dosyasını Google SFTP sunucusuna yüklemek
6. THE Platform SHALL feed yükleme durumunu (başarılı, başarısız, dosya boyutu, kayıt sayısı) Firestore'da loglamak
7. IF SFTP yükleme başarısız olursa, THE Platform SHALL 5 kez yeniden denemek (her 10 dakikada bir)
8. THE Platform SHALL Google'dan gelen feed işleme raporlarını parse ederek hataları tespit etmek
9. IF Google feed hatası bildirirse, THE Platform SHALL ilgili işletme sahiplerine bildiri göndermek
10. THE Integration_Dashboard SHALL son feed yükleme durumunu ve istatistiklerini göstermek

---

### Requirement 7: Service Feed (Hizmet Katalogu) Yönetimi

**User Story:** Sistem yöneticisi olarak, işletmelerin sunduğu hizmetleri Google'a iletmek istiyorum, böylece müşteriler Google Maps'te hangi hizmetlerin mevcut olduğunu görebilsin ve seçebilsin.

#### Acceptance Criteria

1. THE Platform SHALL her gün 03:30'da tüm RWG aktif işletmelerin Service_Feed dosyasını oluşturmak
2. THE Service_Feed SHALL şu alanları içermek: service_id, merchant_id, service_name, description, duration, price, currency
3. THE Platform SHALL her hizmet için kategori bilgisini Google'ın service taxonomy'sine uygun olarak maplemek
4. THE Platform SHALL hizmet fiyatlarını ISO 4217 para birimi kodları ile sunmak
5. THE Platform SHALL süre bilgisini ISO 8601 duration formatında sunmak (örn: PT30M - 30 dakika)
6. THE SFTP_Client SHALL Service_Feed dosyasını Google SFTP sunucusuna yüklemek
7. THE Platform SHALL hizmet değişikliklerini (yeni hizmet, güncelleme, silme) incremental feed olarak günde her saat başı göndermek
8. THE Platform SHALL silinen hizmetler için "status: DELETED" flag'i eklemek
9. THE Integration_Dashboard SHALL son Service_Feed durumunu ve hata raporlarını göstermek

---

### Requirement 8: Availability Feed (Müsaitlik Slotları) Yönetimi

**User Story:** Sistem yöneticisi olarak, işletmelerin müsaitlik slotlarını Google'a iletmek istiyorum, böylece müşteriler güncel müsait saatleri Google Maps'te görebilsin.

#### Acceptance Criteria

1. THE Platform SHALL her 4 saatte bir (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) Availability_Feed dosyasını oluşturmak
2. THE Availability_Feed SHALL önümüzdeki 90 gün için müsaitlik slotlarını içermek
3. THE Availability_Feed SHALL şu alanları içermek: slot_id, merchant_id, service_id, start_time (ISO 8601), duration, available_spots
4. THE Platform SHALL her slot için saat dilimi bilgisini IANA timezone formatında eklemek (örn: Europe/Istanbul)
5. THE Availability_Engine SHALL mevcut rezervasyonları, çalışma saatlerini ve personel müsaitliğini hesaba katarak slotları generate etmek
6. THE Platform SHALL dolu slotları (available_spots: 0) feed'e dahil etmemek (bandwidth optimizasyonu)
7. THE SFTP_Client SHALL Availability_Feed dosyasını Google SFTP sunucusuna yüklemek
8. IF ani değişiklikler olursa (iptal, yeni rezervasyon), THE Platform SHALL incremental feed olarak anında güncelleme göndermek
9. THE Platform SHALL feed boyutunu optimize etmek için sadece değişen slotları incremental feed'e dahil etmek
10. THE Cache_Layer SHALL son Availability_Feed'i 4 saat boyunca önbellekte tutmak

---

### Requirement 9: CheckAvailability Real-Time API

**User Story:** Google kullanıcısı olarak, Google Maps üzerinde bir hizmet seçtiğimde anlık müsaitlik durumunu görmek istiyorum, böylece güncel saatlerde randevu alabilirim.

#### Acceptance Criteria

1. THE Real_Time_API SHALL POST /v1/checkAvailability endpoint'ini expose etmek
2. WHEN Google CheckAvailability request gönderdiğinde, THE Real_Time_API SHALL request'i 1000ms içinde yanıtlamak (p95)
3. THE JWT_Validator SHALL Google'dan gelen JWT token'ı doğrulamak (signature, expiration, issuer kontrolü)
4. IF JWT doğrulama başarısız olursa, THE Real_Time_API SHALL 401 Unauthorized yanıtı döndürmek
5. THE Real_Time_API SHALL request body'deki merchant_id, service_id, start_time, end_time alanlarını validate etmek
6. THE Availability_Engine SHALL belirtilen tarih aralığında müsait slotları hesaplamak
7. THE Real_Time_API SHALL response olarak available slots listesini döndürmek (start_time, duration, resources formatında)
8. THE Cache_Layer SHALL benzer sorguları 5 dakika boyunca cache'lemek (cache key: merchant_id + service_id + date)
9. THE Platform SHALL CheckAvailability request/response loglarını Audit_Logger'a kaydetmek
10. THE Platform SHALL rate limiting uygulamak: Google'dan aynı merchant için saniyede max 10 request
11. IF rate limit aşılırsa, THE Real_Time_API SHALL 429 Too Many Requests yanıtı döndürmek

---

### Requirement 10: CreateBooking Real-Time API

**User Story:** Google kullanıcısı olarak, Google Maps üzerinde seçtiğim saatte randevumu oluşturmak istiyorum, böylece platforma gitmeden işlemimi tamamlayabileyim.

#### Acceptance Criteria

1. THE Real_Time_API SHALL POST /v1/createBooking endpoint'ini expose etmek
2. WHEN Google CreateBooking request gönderdiğinde, THE Real_Time_API SHALL request'i 2000ms içinde yanıtlamak (p95)
3. THE JWT_Validator SHALL Google'dan gelen JWT token'ı doğrulamak
4. THE Real_Time_API SHALL request body'deki merchant_id, service_id, slot_time, user_information alanlarını validate etmek
5. THE Lock_Manager SHALL seçilen slot için distributed lock almak (Redis SETNX ile)
6. THE Availability_Engine SHALL slot'un hala müsait olduğunu verify etmek
7. IF slot artık müsait değilse, THE Real_Time_API SHALL 409 Conflict yanıtı döndürmek ve alternatif slotlar önermek
8. THE Booking_Engine SHALL randevuyu Firestore'da oluşturmak (status: confirmed, source: google_reserve)
9. THE Real_Time_API SHALL booking confirmation yanıtı döndürmek (booking_id, confirmation_code, merchant_contact)
10. THE Lock_Manager SHALL işlem tamamlandıktan sonra lock'u serbest bırakmak
11. THE Platform SHALL işletme sahibine ve müşteriye email/SMS bildirimi göndermek
12. THE Platform SHALL webhook ile Google'a booking status güncellemesi göndermek
13. THE Audit_Logger SHALL her CreateBooking işlemini detaylı olarak loglamak
14. IF CreateBooking sırasında hata oluşursa, THE Real_Time_API SHALL idempotency key kullanarak duplicate booking engellemek

---

### Requirement 11: Booking Lifecycle ve Status Güncellemeleri

**User Story:** İşletme sahibi olarak, Google üzerinden gelen randevuları yönetmek (onaylama, iptal etme, yeniden planlama) istiyorum, böylece değişikliklerin Google'a da senkronize olmasını sağlayabilirim.

#### Acceptance Criteria

1. THE Platform SHALL randevu durumu değiştiğinde (confirmed, cancelled, completed, no_show) Google'a webhook bildirimi göndermek
2. THE Webhook_Handler SHALL Google'ın webhook endpoint'ine POST request göndermek (retry logic ile)
3. THE Platform SHALL şu status değişikliklerini desteklemek: CONFIRMED, CANCELLED_BY_MERCHANT, CANCELLED_BY_USER, COMPLETED, NO_SHOW
4. WHEN işletme sahibi randevuyu iptal ettiğinde, THE Platform SHALL iptal nedenini Google'a iletmek
5. THE Platform SHALL iptal edilen randevular için otomatik geri ödeme politikasını uygulamak (varsa)
6. THE Integration_Dashboard SHALL Google'dan gelen randevuları "Google Reserve" badge'i ile işaretlemek
7. THE Platform SHALL randevu hatırlatma email/SMS'lerinde "Google Reserve ile alındı" bilgisini eklemek
8. THE Platform SHALL müşterinin randevuyu Google Maps üzerinden görüntülemesi için deep link eklemek
9. WHEN müşteri randevuyu yeniden planlamak isterse, THE Platform SHALL yeni CheckAvailability ve CreateBooking akışını başlatmak


---

### Requirement 12: Eş Zamanlı Rezervasyon ve Race Condition Önleme

**User Story:** Sistem yöneticisi olarak, aynı saate birden fazla randevu alınmasını engellemek istiyorum, böylece çifte rezervasyon kaynaklı müşteri şikayetleri oluşmasın.

#### Acceptance Criteria

1. THE Lock_Manager SHALL Redis distributed lock kullanarak eş zamanlı rezervasyon işlemlerini serialize etmek
2. WHEN bir CreateBooking request geldiğinde, THE Lock_Manager SHALL "{merchant_id}:{service_id}:{slot_time}" formatında lock key oluşturmak
3. THE Lock_Manager SHALL lock TTL'ini 10 saniye olarak ayarlamak
4. IF lock alınamadıysa, THE Real_Time_API SHALL 503 Service Unavailable döndürmek ve müşteriyi 2 saniye sonra tekrar denemesi için yönlendirmek
5. THE Booking_Engine SHALL Firestore transaction kullanarak atomik randevu oluşturmak
6. THE Platform SHALL slot müsaitliğini kontrol etmek için "available_count" field'ını Firestore'da tutmak
7. WHEN randevu oluşturulduğunda, THE Platform SHALL available_count'u atomik olarak azaltmak (Firestore increment operasyonu)
8. WHEN randevu iptal edildiğinde, THE Platform SHALL available_count'u atomik olarak artırmak
9. THE Platform SHALL her 5 dakikada bir available_count ile gerçek rezervasyon sayısını reconcile etmek
10. THE Audit_Logger SHALL lock timeout durumlarını ve retry işlemlerini loglamak

---

### Requirement 13: Performans Optimizasyonu ve Caching Stratejisi

**User Story:** Sistem yöneticisi olarak, yüksek trafikte bile düşük gecikme ile hizmet verebilmek istiyorum, böylece Google'ın SLA gereksinimlerini karşılayabileyim.

#### Acceptance Criteria

1. THE Cache_Layer SHALL Redis kullanarak sık sorgulanan verileri cache'lemek
2. THE Platform SHALL işletme bilgilerini (merchant data) 1 saat boyunca cache'lemek
3. THE Platform SHALL hizmet bilgilerini (service catalog) 2 saat boyunca cache'lemek
4. THE Platform SHALL müsaitlik sorgularını (availability) 5 dakika boyunca cache'lemek
5. THE Platform SHALL cache invalidation için pub/sub pattern kullanmak
6. WHEN işletme hizmet bilgilerini güncellediğinde, THE Platform SHALL ilgili cache entry'lerini invalidate etmek
7. THE Platform SHALL database query'leri için Firestore composite index kullanmak
8. THE Platform SHALL N+1 query problemini önlemek için batch read operasyonları kullanmak
9. THE Platform SHALL CheckAvailability endpoint'i için cache hit ratio %80'in üzerinde tutmak
10. THE Platform SHALL API response time'ı her 5 dakikada bir monitor etmek ve p95 değerlerini Firestore'a loglamak
11. IF p95 latency SLA'yı aşarsa (CheckAvailability > 1000ms veya CreateBooking > 2000ms), THE Platform SHALL alarm göndermek

---

### Requirement 14: Queue Sistemi ve Asenkron İşlemler

**User Story:** Sistem yöneticisi olarak, kritik olmayan işlemleri asenkron olarak işlemek istiyorum, böylece API response time'ı düşük kalabilsin.

#### Acceptance Criteria

1. THE Platform SHALL Bull (BullMQ) queue sistemi kullanarak asenkron işlemleri yönetmek
2. THE Queue_System SHALL şu job type'larını desteklemek: feed_generation, webhook_notification, email_notification, analytics_tracking
3. THE Platform SHALL GBP appointmentUrl güncellemelerini "gbp_update" queue'suna eklemek
4. THE Platform SHALL feed generation işlemlerini "feed_generation" queue'suna eklemek (priority: high)
5. THE Platform SHALL webhook bildirimlerini "webhook_notification" queue'suna eklemek (retry: 3, backoff: exponential)
6. THE Queue_System SHALL başarısız job'ları dead letter queue'ya taşımak
7. THE Platform SHALL her queue için worker sayısını dinamik olarak ayarlamak (min: 2, max: 10)
8. THE Integration_Dashboard SHALL queue istatistiklerini göstermek (pending, active, completed, failed job sayıları)
9. THE Platform SHALL kritik job'ları (CreateBooking post-processing) 30 saniye içinde işlemek
10. THE Platform SHALL job execution loglarını Audit_Logger'a kaydetmek

---

### Requirement 15: Güvenlik ve JWT Token Doğrulama

**User Story:** Sistem yöneticisi olarak, Google'dan gelen isteklerin gerçekten Google'dan geldiğini doğrulamak istiyorum, böylece sahte isteklerle sistem manipüle edilemesin.

#### Acceptance Criteria

1. THE JWT_Validator SHALL Google'ın public key'lerini JWKS endpoint'inden çekmek (https://www.googleapis.com/oauth2/v3/certs)
2. THE JWT_Validator SHALL public key'leri 24 saat boyunca cache'lemek
3. THE JWT_Validator SHALL JWT token'ın signature'ını public key ile doğrulamak
4. THE JWT_Validator SHALL JWT token'ın expiration (exp claim) kontrolünü yapmak
5. THE JWT_Validator SHALL JWT token'ın issuer (iss claim) değerinin "https://accounts.google.com" olduğunu kontrol etmek
6. THE JWT_Validator SHALL JWT token'ın audience (aud claim) değerinin platform'un client ID'si olduğunu kontrol etmek
7. IF JWT doğrulama başarısız olursa, THE Platform SHALL 401 Unauthorized yanıtı döndürmek ve hatayı detaylı olarak loglamak
8. THE Platform SHALL replay attack'leri önlemek için JWT jti (JWT ID) claim'ini kontrol etmek
9. THE Platform SHALL kullanılmış jti değerlerini Redis'te 1 saat boyunca tutmak
10. THE Platform SHALL TLS 1.3 kullanarak tüm API trafiğini şifrelemek
11. THE Platform SHALL Google IP range'lerinden gelen istekleri whitelist'e almak (opsiyonel ek güvenlik katmanı)

---

### Requirement 16: Rate Limiting ve DDoS Koruması

**User Story:** Sistem yöneticisi olarak, API endpoint'lerimizi aşırı yüklenmeye ve kötü niyetli kullanıma karşı korumak istiyorum, böylece sistemin kararlılığını koruyabilirim.

#### Acceptance Criteria

1. THE Platform SHALL Redis tabanlı rate limiting middleware kullanmak
2. THE Platform SHALL CheckAvailability endpoint'i için merchant bazında saniyede 10 request limiti uygulamak
3. THE Platform SHALL CreateBooking endpoint'i için merchant bazında saniyede 5 request limiti uygulamak
4. THE Platform SHALL OAuth token endpoint'i için IP bazında dakikada 20 request limiti uygulamak
5. THE Platform SHALL GBP API çağrıları için Google'ın rate limit'lerine uygun olarak saniyede 10 request göndermek
6. IF rate limit aşılırsa, THE Platform SHALL 429 Too Many Requests yanıtı döndürmek ve Retry-After header'ı eklemek
7. THE Platform SHALL rate limit aşımlarını Audit_Logger'a kaydetmek
8. THE Platform SHALL şüpheli aktivite tespiti için sliding window algoritması kullanmak
9. IF aynı IP'den 1 dakika içinde 100'den fazla 429 yanıtı alınırsa, THE Platform SHALL o IP'yi 1 saat boyunca bloklamak
10. THE Integration_Dashboard SHALL rate limiting istatistiklerini göstermek (toplam istek, limit aşımı, bloke edilen IP'ler)

---

### Requirement 17: Monitoring, Logging ve Observability

**User Story:** Sistem yöneticisi olarak, entegrasyonun sağlığını ve performansını gerçek zamanlı izlemek istiyorum, böylece sorunları proaktif olarak tespit edip müdahale edebilirim.

#### Acceptance Criteria

1. THE Platform SHALL tüm API endpoint'lerini health check endpoint'i ile expose etmek (GET /health)
2. THE Platform SHALL health check'te şu metrikleri raporlamak: API status, database connection, Redis connection, SFTP connection
3. THE Audit_Logger SHALL tüm entegrasyon işlemlerini structured logging formatında (JSON) kaydetmek
4. THE Platform SHALL log level'ları desteklemek: DEBUG, INFO, WARN, ERROR, FATAL
5. THE Platform SHALL production ortamında INFO ve üzeri log level'larını kaydetmek
6. THE Platform SHALL şu metrikleri her dakika toplamak: request count, average latency, error rate, cache hit ratio
7. THE Platform SHALL metrikleri time-series database'e (Firestore veya Cloud Monitoring) kaydetmek
8. THE Integration_Dashboard SHALL real-time dashboard sunmak: son 1 saat request grafiği, hata oranı, p50/p95/p99 latency
9. THE Platform SHALL error budget kullanarak SLA compliance hesaplamak (hedef: %99.5 uptime)
10. THE Platform SHALL kritik hatalar için alerting sistemi kurmak (email/SMS/Slack)
11. WHEN CheckAvailability veya CreateBooking endpoint'i 5 dakika boyunca %10'dan fazla hata oranına sahipse, THE Platform SHALL alarm göndermek
12. THE Platform SHALL distributed tracing için correlation ID kullanmak (tüm log entry'lerinde)

---

### Requirement 18: Data Feed Oluşturma ve SFTP Yükleme

**User Story:** Sistem yöneticisi olarak, Google'ın gerektirdiği data feed'leri otomatik olarak oluşturup yüklemek istiyorum, böylece manuel müdahale gerektirmeden sürekli güncel veri akışı sağlayabileyim.

#### Acceptance Criteria

1. THE Platform SHALL her feed generation job'ı için transaction log oluşturmak (feed_type, status, record_count, file_size, duration)
2. THE Platform SHALL feed dosyalarını /tmp dizininde oluşturmak ve işlem tamamlandıktan sonra silmek
3. THE Platform SHALL feed dosya isimlerini timestamped format'ta oluşturmak (örn: merchant_feed_20260524_030000.json.gz)
4. THE SFTP_Client SHALL Google'ın SFTP sunucusuna SSH key authentication ile bağlanmak
5. THE Platform SHALL SFTP credentials'ı Firebase Functions config'de şifreli olarak saklamak
6. THE SFTP_Client SHALL dosya yükleme başarısını MD5 checksum ile doğrulamak
7. THE SFTP_Client SHALL yükleme başarısız olursa 5 kez exponential backoff ile yeniden denemek (1m, 2m, 4m, 8m, 16m)
8. THE Platform SHALL feed dosyalarını lokal olarak 7 gün boyunca backup'lamak
9. THE Platform SHALL Google'dan gelen feed processing raporlarını (örn: feed_status.json) SFTP'den çekmek
10. THE Platform SHALL feed hata raporlarını parse ederek ilgili merchant'ları email ile bilgilendirmek
11. THE Integration_Dashboard SHALL son 30 günün feed history'sini göstermek (tarih, type, status, kayıt sayısı, hatalar)

---

### Requirement 19: İşletme Entegrasyon Dashboard'u

**User Story:** İşletme sahibi olarak, Google entegrasyonumu yönetebileceğim bir dashboard istiyorum, böylece entegrasyon durumunu, istatistikleri ve ayarları görebilip değiştirebilirim.

#### Acceptance Criteria

1. THE Integration_Dashboard SHALL "/integrations/google-maps" route'unda erişilebilir olmak
2. THE Integration_Dashboard SHALL sadece işletme sahibi rolündeki kullanıcılara erişim vermek
3. THE Integration_Dashboard SHALL şu bölümleri içermek: Genel Bakış, Lokasyonlar, İstatistikler, Ayarlar, Loglar
4. THE Integration_Dashboard SHALL "Genel Bakış" sekmesinde entegrasyon durumunu göstermek (Aşama 1: aktif/inaktif, Aşama 2: aktif/inaktif/beklemede)
5. THE Integration_Dashboard SHALL "Lokasyonlar" sekmesinde GBP lokasyonlarını tablo formatında listelemek
6. THE Integration_Dashboard SHALL her lokasyon için şu işlemleri sunmak: Aktive Et, Deaktive Et, URL'yi Kopyala, Test Et
7. THE Integration_Dashboard SHALL "İstatistikler" sekmesinde son 30 günün metriklerini göstermek: toplam görüntülenme, randevu sayısı, dönüşüm oranı
8. THE Integration_Dashboard SHALL grafik formatında günlük randevu trendini göstermek (Chart.js veya benzeri)
9. THE Integration_Dashboard SHALL "Ayarlar" sekmesinde Google hesap bağlantısını yönetme imkanı sunmak (Bağla, Bağlantıyı Kaldır, Yeniden Bağla)
10. THE Integration_Dashboard SHALL "Loglar" sekmesinde son 100 entegrasyon işlemini göstermek (tarih, işlem, durum, detay)
11. THE Integration_Dashboard SHALL responsive design ile mobil cihazlarda da kullanılabilir olmak


---

### Requirement 20: Premium Paket ve Fiyatlandırma Modülü

**User Story:** Ürün yöneticisi olarak, Google entegrasyonunu premium özellik veya ek hizmet olarak paketleyip fiyatlandırmak istiyorum, böylece gelir modeli oluşturabileyim.

#### Acceptance Criteria

1. THE Pricing_Module SHALL Google entegrasyonunu iki paket olarak sunmak: "Google Görünürlük" (Aşama 1) ve "Google Rezervasyon" (Aşama 2)
2. THE Platform SHALL "Google Görünürlük" paketini aylık/yıllık abonelik veya tek seferlik ücret olarak sunmak
3. THE Platform SHALL "Google Rezervasyon" paketini yalnızca "Google Görünürlük" aktif olan işletmelere sunmak
4. THE Platform SHALL paket aktivasyonunu mevcut abonelik sistemine entegre etmek
5. THE Platform SHALL işletme sahibi paket satın aldığında otomatik olarak entegrasyonu aktive etmek
6. THE Platform SHALL abonelik iptal edildiğinde entegrasyonu deaktive etmek ve GBP'den appointmentUrl'yi kaldırmak
7. THE Integration_Dashboard SHALL paket bilgilerini ve kalan süreyi göstermek
8. THE Platform SHALL trial period sunmak (örn: 14 gün ücretsiz deneme)
9. THE Platform SHALL işletme başına rezervasyon başına komisyon modeli desteklemek (opsiyonel)
10. THE Pricing_Module SHALL farklı lokasyon sayılarına göre kademeli fiyatlandırma sunmak (1-5 lokasyon, 6-20 lokasyon, 20+ lokasyon)

---

### Requirement 21: Bildirim ve İletişim Sistemi

**User Story:** İşletme sahibi olarak, Google entegrasyonu ile ilgili önemli olaylardan haberdar olmak istiyorum, böylece gerekli aksiyonları zamanında alabilirim.

#### Acceptance Criteria

1. THE Platform SHALL şu olaylar için bildirim göndermek: entegrasyon aktive edildi, GBP güncelleme başarısız, yeni Google rezervasyonu alındı, feed hatası oluştu, OAuth token yenileme hatası
2. THE Platform SHALL bildirimlerini email, SMS ve platform içi bildirim kanallarından göndermek
3. THE Platform SHALL işletme sahibinin bildirim tercihlerini Integration_Dashboard'dan ayarlamasına izin vermek
4. THE Platform SHALL kritik hataları (OAuth token expiry, feed failure) otomatik olarak tüm kanallara göndermek
5. WHEN Google'dan yeni rezervasyon geldiğinde, THE Platform SHALL işletme sahibine 5 dakika içinde bildirim göndermek
6. THE Platform SHALL bildirim şablonlarını Firestore'da saklamak ve yönetmek
7. THE Platform SHALL bildirim içeriğini kişiselleştirmek (işletme adı, lokasyon, müşteri adı vb.)
8. THE Platform SHALL email bildirimlerini transactional email servisi (SendGrid/Mailgun) ile göndermek
9. THE Platform SHALL SMS bildirimlerini SMS gateway (Twilio/Vonage) ile göndermek
10. THE Platform SHALL bildirim başarı/başarısızlık durumunu Audit_Logger'a kaydetmek

---

### Requirement 22: Test ve Sandbox Ortamı

**User Story:** Geliştirici olarak, production ortamını etkilemeden entegrasyonu test edebileceğim bir sandbox ortamı istiyorum, böylece yeni özellikler güvenle geliştirebilirim.

#### Acceptance Criteria

1. THE Platform SHALL sandbox ve production olmak üzere iki ayrı ortam sunmak
2. THE Platform SHALL sandbox ortamında Google test accounts kullanmak
3. THE Platform SHALL sandbox ortamında gerçek GBP lokasyonları yerine mock data kullanmak
4. THE Platform SHALL sandbox ortamında gerçek SFTP yükleme yapmadan local file system'e kaydetmek
5. THE Platform SHALL sandbox ortamında CreateBooking işlemlerini gerçek veritabanına yazmadan simulate etmek
6. THE Integration_Dashboard SHALL hangi ortamda olunduğunu açıkça göstermek (banner ile)
7. THE Platform SHALL sandbox ortamında rate limiting'i daha gevşek tutmak (10x daha yüksek limitler)
8. THE Platform SHALL end-to-end test suite'i hazırlamak (Playwright veya Cypress ile)
9. THE Platform SHALL CheckAvailability ve CreateBooking endpoint'leri için integration test'ler yazmak
10. THE Platform SHALL CI/CD pipeline'ında otomatik test çalıştırmak

---

### Requirement 23: Hata Yönetimi ve Fallback Mekanizmaları

**User Story:** Sistem yöneticisi olarak, Google servisleri erişilemez olduğunda sistemin degraded mode'da çalışmasını istiyorum, böylece tamamen çökmeden hizmet vermeye devam edebilsin.

#### Acceptance Criteria

1. WHEN GBP API erişilemez olduğunda, THE Platform SHALL appointmentUrl güncellemelerini Queue_System'e eklemek ve daha sonra yeniden denemek
2. WHEN Google SFTP sunucusu erişilemez olduğunda, THE Platform SHALL feed dosyalarını local backup'a kaydetmek ve bağlantı düzelince yüklemek
3. WHEN CheckAvailability isteği timeout olduğunda, THE Platform SHALL cache'lenmiş müsaitlik bilgisini döndürmek (varsa)
4. WHEN CreateBooking isteği timeout olduğunda, THE Platform SHALL işlemi asenkron queue'ya eklemek ve müşteriye "confirmation pending" mesajı göndermek
5. THE Platform SHALL circuit breaker pattern kullanarak başarısız external service çağrılarını yönetmek
6. WHEN bir external service 10 ardışık çağrıda başarısız olursa, THE Platform SHALL circuit'i açmak (5 dakika boyunca çağrı yapmamak)
7. THE Platform SHALL health check endpoint'inde tüm dependency'lerin durumunu göstermek (healthy, degraded, down)
8. THE Platform SHALL critical olmayan işlemleri (analytics tracking, logging) başarısız olsa bile ana akışı bloklamamak
9. THE Platform SHALL tüm external API çağrılarına timeout koymak (max 10 saniye)
10. THE Audit_Logger SHALL tüm fallback ve circuit breaker olaylarını loglamak

---

### Requirement 24: Veri Tutarlılığı ve Senkronizasyon

**User Story:** Sistem yöneticisi olarak, platform veritabanı ile Google sistemleri arasında veri tutarlılığını korumak istiyorum, böylece çelişkili durumlar oluşmasın.

#### Acceptance Criteria

1. THE Platform SHALL her gece 02:00'da tam senkronizasyon job'ı çalıştırmak
2. THE Platform SHALL tam senkronizasyon sırasında şu kontrolleri yapmak: GBP'deki appointmentUrl doğru mu, platformdaki aktif rezervasyonlar Google'da var mı
3. THE Platform SHALL tespit edilen tutarsızlıkları otomatik olarak düzeltmek
4. THE Platform SHALL düzeltilemeyen tutarsızlıkları admin paneline raporlamak
5. THE Platform SHALL her rezervasyon için unique identifier (UUID) kullanmak ve bunu Google'a iletmek
6. THE Platform SHALL Google'dan gelen rezervasyonları "google_booking_id" field'ı ile işaretlemek
7. WHEN işletme sahibi platformda rezervasyon güncellerse, THE Platform SHALL güncellemeyi Google'a webhook ile bildirmek
8. THE Platform SHALL webhook delivery failure durumunda 24 saat boyunca yeniden denemek
9. THE Platform SHALL eventual consistency modelini kullanmak ve reconciliation job'ları ile tutarlılığı sağlamak
10. THE Audit_Logger SHALL tüm senkronizasyon işlemlerini ve tutarsızlıkları detaylı olarak loglamak

---

### Requirement 25: Müşteri Deneyimi ve Landing Page Optimizasyonu

**User Story:** Müşteri olarak, Google Maps'ten tıkladığım randevu linkinde hızlı, sezgisel ve güvenilir bir deneyim istiyorum, böylece kolayca randevu alabilirim.

#### Acceptance Criteria

1. THE Platform SHALL Appointment_URL landing page'ini 2 saniye içinde fully loaded hale getirmek
2. THE Platform SHALL landing page'de işletmenin Google'dan gelen rating ve review sayısını göstermek
3. THE Platform SHALL landing page'de "Google ile güvenli rezervasyon" badge'i göstermek
4. THE Platform SHALL hizmet seçimi için görsel kartlar kullanmak (hizmet adı, süre, fiyat, açıklama)
5. THE Platform SHALL tarih seçimi için interactive calendar widget sunmak
6. THE Platform SHALL müsait saatleri 3 saat aralıklarla gruplandırarak göstermek (sabah, öğle, akşam)
7. THE Platform SHALL müşteri bilgileri için minimal form kullanmak (ad, telefon, email - otomatik Google account'tan doldurulabilir)
8. THE Platform SHALL randevu onay sayfasında tüm detayları özetlemek (işletme, hizmet, tarih/saat, fiyat)
9. THE Platform SHALL "Takvime Ekle" butonu sunmak (Google Calendar, Apple Calendar, ICS dosyası)
10. THE Platform SHALL WCAG 2.1 AA accessibility standartlarına uygun olmak
11. THE Platform SHALL mobile-first responsive design kullanmak
12. THE Platform SHALL sayfa performansını Google PageSpeed Insights'ta 90+ skor hedeflemek

---

### Requirement 26: Analytics ve Raporlama

**User Story:** İşletme sahibi olarak, Google entegrasyonunun performansını ölçmek istiyorum, böylece yatırım getirisini değerlendirebilirim.

#### Acceptance Criteria

1. THE Platform SHALL her randevu için source tracking yapmak (google_reserve, google_appointment_url, direct, other)
2. THE Platform SHALL Google Analytics 4 ile entegre olmak ve custom events göndermek
3. THE Platform SHALL şu metrikleri takip etmek: appointment_url_view, service_selected, date_selected, booking_completed, booking_cancelled
4. THE Platform SHALL funnel analizi yapmak (görüntülenme → hizmet seçimi → tarih seçimi → randevu)
5. THE Platform SHALL dönüşüm oranını (conversion rate) hesaplamak ve göstermek
6. THE Platform SHALL ortalama randevu değerini (average booking value) Google kaynaklı rezervasyonlar için hesaplamak
7. THE Integration_Dashboard SHALL aylık rapor üretmek (PDF/Excel export)
8. THE Platform SHALL aylık raporda şu bilgileri içermek: toplam görüntülenme, toplam rezervasyon, gelir, dönüşüm oranı, en popüler hizmetler
9. THE Platform SHALL A/B testing için variant grupları desteklemek (farklı landing page tasarımları)
10. THE Platform SHALL cohort analizi yapmak (ilk randevu Google'dan gelen müşterilerin retention oranı)
11. THE Platform SHALL benchmark metrikleri göstermek (sektör ortalaması ile karşılaştırma)

---

### Requirement 27: Uyumluluk ve Yasal Gereksinimler

**User Story:** Hukuk müşaviri olarak, Google entegrasyonunun yasal gereksinimlere ve privacy standartlarına uygun olmasını istiyorum, böylece yasal riskler minimize edilsin.

#### Acceptance Criteria

1. THE Platform SHALL GDPR (General Data Protection Regulation) gereksinimlerine uygun olmak
2. THE Platform SHALL KVKK (Kişisel Verilerin Korunması Kanunu) gereksinimlerine uygun olmak
3. THE Platform SHALL müşterilere açık gizlilik politikası sunmak
4. THE Platform SHALL veri işleme rıza metnini landing page'de göstermek
5. THE Platform SHALL müşterilere "verilerimi sil" hakkı tanımak (GDPR right to erasure)
6. THE Platform SHALL Google ile paylaşılan verileri şeffaf bir şekilde açıklamak
7. THE Platform SHALL müşteri verilerini Google'a göndermeden önce explicit consent almak
8. THE Platform SHALL PCI DSS standartlarına uygun ödeme işleme (Stripe kullanımı ile)
9. THE Platform SHALL veri saklama politikası uygulamak (rezervasyon verileri 3 yıl sonra anonimleştirme)
10. THE Platform SHALL data processing agreement (DPA) hazırlamak ve işletme sahiplerine sunmak
11. THE Platform SHALL düzenli güvenlik audit'leri yapmak ve raporlamak

---

### Requirement 28: Çok Dilli Destek ve Lokalizasyon

**User Story:** İşletme sahibi olarak, Google entegrasyonunu farklı dillerde sunmak istiyorum, böylece uluslararası müşterilere hizmet verebilirim.

#### Acceptance Criteria

1. THE Platform SHALL landing page'i şu dillerde sunmak: Türkçe, İngilizce, Almanca, Fransızca, Arapça
2. THE Platform SHALL dil algılamayı şu öncelikle yapmak: URL parameter (?lang=tr), browser language, GBP lokasyon dili, default (Türkçe)
3. THE Platform SHALL tüm kullanıcı arayüzü metinlerini i18n kütüphanesi ile yönetmek (react-i18next)
4. THE Platform SHALL tarih/saat formatlarını lokale göre göstermek (örn: TR için 24 saat formatı, US için 12 saat formatı)
5. THE Platform SHALL para birimi formatlarını lokale göre göstermek (örn: 100,50 TL vs $100.50)
6. THE Platform SHALL saat dilimi dönüşümlerini otomatik yapmak (işletme timezone'u → müşteri timezone'u)
7. THE Platform SHALL hizmet adı ve açıklamalarının çoklu dil versiyonlarını saklamak
8. THE Platform SHALL email/SMS bildirimlerini müşterinin tercih ettiği dilde göndermek
9. THE Integration_Dashboard SHALL işletme sahiplerine desteklenen dilleri aktive etme imkanı sunmak
10. THE Platform SHALL Google'a gönderilen feed'lerde çoklu dil desteği sunmak (Google'ın schema'sına uygun şekilde)


---

### Requirement 29: Dokümantasyon ve Onboarding

**User Story:** İşletme sahibi olarak, Google entegrasyonunu nasıl kuracağımı ve kullanacağımı öğrenmek istiyorum, böylece teknik destek gerektirmeden kendi başıma aktive edebilirim.

#### Acceptance Criteria

1. THE Platform SHALL kapsamlı kullanıcı dokümantasyonu hazırlamak (adım adım rehber)
2. THE Platform SHALL video tutorial'lar hazırlamak (OAuth bağlantısı, lokasyon aktivasyonu, dashboard kullanımı)
3. THE Platform SHALL interactive onboarding wizard sunmak (5 adımda entegrasyon kurulumu)
4. THE Platform SHALL onboarding wizard'da şu adımları içermek: Google hesabı bağla, lokasyon seç, randevu URL'sini test et, bildirimleri ayarla, paketi aktive et
5. THE Platform SHALL her adımda tooltip ve yardım metinleri göstermek
6. THE Platform SHALL sık sorulan sorular (FAQ) bölümü sunmak
7. THE Platform SHALL troubleshooting rehberi sunmak (yaygın hatalar ve çözümleri)
8. THE Platform SHALL teknik dokümantasyon hazırlamak (API reference, webhook şemaları, feed formatları)
9. THE Integration_Dashboard SHALL contextual help butonu sunmak (her sayfada ilgili yardım içeriği)
10. THE Platform SHALL email ile onboarding serisi göndermek (1. gün: hoşgeldin, 3. gün: ilk randevunu aldın mı?, 7. gün: ipuçları)

---

### Requirement 30: Destek ve Bakım

**User Story:** İşletme sahibi olarak, entegrasyon ile ilgili sorun yaşadığımda hızlı destek almak istiyorum, böylece işletmemin etkilenmesini minimize edebilirim.

#### Acceptance Criteria

1. THE Platform SHALL entegrasyon-specific destek kanalı sunmak (email: google-integration@support.com)
2. THE Platform SHALL Integration_Dashboard'da "Destek Talebi Oluştur" butonu sunmak
3. THE Platform SHALL destek talebinde otomatik olarak diagnostic bilgileri eklemek (entegrasyon durumu, son hatalar, sistem logları)
4. THE Platform SHALL destek taleplerine 4 saat içinde yanıt vermek (iş saatleri içinde)
5. THE Platform SHALL kritik sorunlar için 1 saat içinde yanıt vermek (production down)
6. THE Platform SHALL destek taleplerini ticket sisteminde yönetmek (örn: Zendesk, Freshdesk)
7. THE Platform SHALL self-service diagnostics tool sunmak (örn: "Bağlantıyı Test Et" butonu)
8. THE Platform SHALL known issues sayfası sunmak (devam eden sorunlar ve çözüm süreleri)
9. THE Platform SHALL planned maintenance bildirimlerini en az 48 saat önceden yapmak
10. THE Platform SHALL status page sunmak (entegrasyon servisleri uptime durumu)

---

## Ek Notlar ve Teknik Detaylar

### Parser ve Serializer Gereksinimleri

**Data Feed Parsers:**

THE Platform SHALL Data_Feed'leri oluştururken şu parser/serializer gereksinimlerini karşılamak:

1. **JSON Parser/Serializer**:
   - WHEN Merchant_Feed, Service_Feed veya Availability_Feed oluşturulduğunda, THE Platform SHALL JSON schema validasyonu yapmak
   - THE Platform SHALL JSON serialize/deserialize işlemlerinde hata yakalamak
   - THE Platform SHALL pretty printer uygulamak (development ortamında okunabilirlik için)
   - FOR ALL valid feed objects, THE Platform SHALL round-trip property'sini garanti etmek: parse(serialize(obj)) === obj

2. **Protocol Buffers (ProtoBuf) Serializer** (Opsiyonel):
   - WHERE işletme sayısı 10,000'i aştığında, THE Platform SHALL ProtoBuf formatını desteklemek (bandwidth optimizasyonu için)
   - THE Platform SHALL ProtoBuf schema dosyalarını version control'de tutmak
   - THE Platform SHALL backward/forward compatibility sağlamak

3. **CSV Parser** (İşletme Toplu Import için):
   - WHEN işletme toplu lokasyon import etmek istediğinde, THE Platform SHALL CSV parse etmek
   - THE Platform SHALL CSV parsing hatalarını satır numarası ile raporlamak
   - THE Platform SHALL malformed CSV dosyalarını gracefully handle etmek

### Performans Benchmarks

**SLA Hedefleri:**

| Metrik | Hedef | Kritik Eşik |
|--------|-------|-------------|
| CheckAvailability p95 latency | < 800ms | < 1000ms |
| CreateBooking p95 latency | < 1500ms | < 2000ms |
| Landing Page Load Time | < 2s | < 3s |
| Feed Generation Duration | < 5 dakika | < 10 dakika |
| SFTP Upload Success Rate | > 99% | > 95% |
| API Uptime | > 99.9% | > 99.5% |
| Cache Hit Ratio | > 80% | > 70% |

### Veritabanı Şeması Önerileri

**Firestore Collections:**

1. **google_integrations** (işletme başına):
   ```
   {
     businessId: string
     oauthTokens: {
       accessToken: string (encrypted)
       refreshToken: string (encrypted)
       expiresAt: timestamp
     }
     locations: [
       {
         gbpLocationId: string
         name: string
         address: object
         isActive: boolean
         appointmentUrl: string
         lastSyncedAt: timestamp
       }
     ]
     rwgStatus: "inactive" | "pending" | "active"
     createdAt: timestamp
     updatedAt: timestamp
   }
   ```

2. **google_bookings** (rezervasyon başına):
   ```
   {
     bookingId: string (platform UUID)
     googleBookingId: string
     businessId: string
     locationId: string
     serviceId: string
     customerId: string
     startTime: timestamp
     endTime: timestamp
     status: "confirmed" | "cancelled" | "completed" | "no_show"
     source: "google_reserve" | "google_appointment_url"
     metadata: object
     createdAt: timestamp
   }
   ```

3. **google_audit_logs** (işlem başına):
   ```
   {
     logId: string
     businessId: string
     eventType: string
     eventData: object
     status: "success" | "failure"
     errorMessage: string?
     correlationId: string
     timestamp: timestamp
   }
   ```

### Google API Rate Limits

**Dikkat Edilmesi Gerekenler:**

1. **Business Profile API Limits:**
   - Okuma: 1,500 requests/dakika/proje
   - Yazma: 60 requests/dakika/proje
   - Platform bu limitleri aşmamak için internal rate limiter kullanmalı

2. **Reserve with Google Limits:**
   - CheckAvailability: Limit yok (ancak <1000ms yanıt şartı var)
   - CreateBooking: Limit yok (ancak <2000ms yanıt şartı var)
   - Data Feeds: Günlük upload limiti yok, ancak dosya boyutu max 5GB

### Güvenlik Checklist

**Production'a Geçmeden Önce:**

- [ ] OAuth tokens Firestore'da encrypt edilmiş mi?
- [ ] JWT validation doğru implement edilmiş mi?
- [ ] Rate limiting tüm endpoint'lerde aktif mi?
- [ ] HTTPS zorunlu mu (HTTP redirect var mı)?
- [ ] SQL injection koruması var mı? (Firestore kullanımı ile otomatik)
- [ ] XSS koruması var mı? (React kullanımı ile otomatik)
- [ ] CSRF token kullanılıyor mu?
- [ ] Sensitive data loglanmıyor mu?
- [ ] Error mesajları production'da generic mi?
- [ ] Security headers set edilmiş mi? (CSP, HSTS, X-Frame-Options)
- [ ] Dependency vulnerability scan yapılmış mı?
- [ ] Penetration test tamamlanmış mı?

### Maliyet Optimizasyonu

**Firebase/GCP Tahmini Maliyetler (10,000 işletme, ayda 100,000 rezervasyon):**

- **Cloud Functions**: ~$150/ay (500M invocations)
- **Firestore**: ~$80/ay (200M reads, 50M writes)
- **Cloud Storage**: ~$5/ay (feed backups)
- **Cloud Scheduler**: ~$3/ay (cron jobs)
- **SFTP Transfer**: ~$10/ay (bandwidth)
- **Redis (Cloud Memorystore)**: ~$30/ay (1GB instance)
- **Load Balancer**: ~$20/ay

**Toplam**: ~$300/ay → İşletme başına ~$0.03/ay

**Gelir Tahmini (örnek fiyatlandırma):**

- Google Görünürlük: 99 TL/ay → 990,000 TL/ay (10,000 işletme)
- Google Rezervasyon: 199 TL/ay → 1,990,000 TL/ay (10,000 işletme)
- **Toplam Potansiyel Gelir**: ~2,980,000 TL/ay
- **Net Kar Marjı**: %99.8 (maliyet çok düşük)

---

## Sonuç

Bu gereksinimler dokümanı, Google Maps/Google Business Profile entegrasyonunu iki aşamalı bir yaklaşımla ele almaktadır:

**Aşama 1 (Hızlı Çözüm - MVP)**: OAuth 2.0 entegrasyonu, GBP API ile randevu URL ekleme, landing page optimizasyonu (Tahmini geliştirme süresi: 4-6 hafta)

**Aşama 2 (Gelişmiş Çözüm - Full Feature)**: Reserve with Google entegrasyonu, Real-Time API, Data Feeds, gelişmiş monitoring (Tahmini geliştirme süresi: 10-14 hafta)

Toplam 30 requirement, 250+ acceptance criteria ile kapsamlı bir spesifikasyon hazırlanmıştır. Her requirement EARS pattern'lerini takip etmekte ve INCOSE kalite kurallarına uymaktadır.

