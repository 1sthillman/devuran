# 🔔 Kapsamlı Bildirim Sistemi - Dokümantasyon

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Özellikler](#özellikler)
3. [Mimari](#mimari)
4. [Kurulum](#kurulum)
5. [Kullanım](#kullanım)
6. [Tarayıcı Uyumluluğu](#tarayıcı-uyumluluğu)
7. [Güvenlik](#güvenlik)
8. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

Bu bildirim sistemi, müşterilere ve işletmelere randevu hatırlatmaları, durum güncellemeleri ve önemli bildirimleri **hem ön planda (site açıkken) hem de arka planda (site kapalıyken)** göndermek için tasarlanmıştır.

### Temel Özellikler
- ✅ **Ön Plan Bildirimleri**: Site açıkken anında bildirim
- ✅ **Arka Plan Bildirimleri**: Site kapalıyken Service Worker ile bildirim
- ✅ **Zamanlanmış Bildirimler**: 24 saat ve 1 saat öncesi otomatik hatırlatmalar
- ✅ **Etkileşimli Bildirimler**: Aksiyon butonları (Görüntüle, Yol Tarifi, Onayla)
- ✅ **Cross-Browser Uyumluluk**: Chrome, Firefox, Edge, Safari (sınırlı)
- ✅ **Güvenli**: VAPID key ile kimlik doğrulama
- ✅ **Ölçeklenebilir**: Firebase Cloud Functions ile sunucusuz mimari

---

## 🚀 Özellikler

### Müşteri Bildirimleri
1. **Randevu Oluşturma**: Randevu oluşturulduğunda anlık bildirim
2. **Randevu Onayı**: İşletme onayladığında bildirim
3. **24 Saat Öncesi Hatırlatma**: Randevu günü yaklaştığında
4. **1 Saat Öncesi Hatırlatma**: Randevu saati yaklaştığında (adres bilgisi ile)
5. **Randevu İptali**: İşletme iptal ettiğinde bildirim
6. **Sıra Durumu**: Sıra sistemi güncellemeleri
7. **Ödeme Hatırlatma**: Kapora ödemesi gereken randevular için

### İşletme Bildirimleri
1. **Yeni Randevu**: Müşteri randevu oluşturduğunda anlık bildirim
2. **Randevu İptali**: Müşteri iptal ettiğinde bildirim
3. **Ödeme Bildirimi**: Müşteri ödeme yaptığında
4. **Yorum Bildirimi**: Yeni yorum geldiğinde
5. **Sıra Bildirimi**: Yeni müşteri sıraya girdiğinde

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  pushNotificationService.ts                          │   │
│  │  - FCM Token yönetimi                                │   │
│  │  - Bildirim izinleri                                 │   │
│  │  - Ön plan bildirim dinleyicisi                      │   │
│  │  - Zamanlanmış bildirim oluşturma                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NotificationSetup.tsx                               │   │
│  │  - Kullanıcı bildirimleri etkinleştirme UI           │   │
│  │  - Test bildirimi gönderme                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NotificationCenter.tsx                              │   │
│  │  - Gelen bildirimleri gösterme                       │   │
│  │  - Bildirim geçmişi                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE WORKER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  firebase-messaging-sw.js                            │   │
│  │  - Arka plan bildirim dinleyicisi                    │   │
│  │  - Bildirim gösterimi (site kapalı)                  │   │
│  │  - Notification click handler                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   FIREBASE FIRESTORE                         │
├─────────────────────────────────────────────────────────────┤
│  - notificationDevices: FCM token'ları                       │
│  - scheduledNotifications: Zamanlanmış bildirimler           │
│  - notificationStats: İstatistikler                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                FIREBASE CLOUD FUNCTIONS                      │
├─────────────────────────────────────────────────────────────┤
│  1. processScheduledNotifications (Her dakika çalışır)      │
│     - Zamanı gelen bildirimleri FCM'e gönderir              │
│                                                              │
│  2. onReservationCreated (Trigger)                          │
│     - Yeni randevu → hatırlatmalar planla                   │
│                                                              │
│  3. onReservationCancelled (Trigger)                        │
│     - İptal → zamanlanmış bildirimleri iptal et             │
│                                                              │
│  4. cleanupOldNotifications (Günlük temizlik)               │
│     - 30 gün önceki bildirimleri sil                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE CLOUD MESSAGING (FCM)                  │
├─────────────────────────────────────────────────────────────┤
│  - Google/Apple sunucuları üzerinden bildirim iletimi       │
│  - Web Push Protocol                                         │
│  - VAPID kimlik doğrulama                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │   MÜŞTERİ     │
                    │   CİHAZI      │
                    └───────────────┘
```

---

## ⚙️ Kurulum

### 1. Firebase Console Ayarları

#### VAPID Key Oluşturma
1. [Firebase Console](https://console.firebase.google.com/) → Projeniz
2. **Project Settings** → **Cloud Messaging** sekmesi
3. **Web Push certificates** bölümüne gidin
4. **Generate key pair** butonuna tıklayın
5. Oluşan key'i kopyalayın

#### Environment Variables
`.env` dosyanıza ekleyin:

```env
# Firebase Mevcut Ayarlar
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# YENİ: VAPID Key (Cloud Messaging için)
VITE_FIREBASE_VAPID_KEY=YOUR_GENERATED_VAPID_KEY_HERE
```

### 2. Service Worker Dosyası

`public/firebase-messaging-sw.js` dosyası zaten yapılandırılmıştır ve Firebase config bilgileriniz ile güncellenmiştir.

### 3. Firebase Cloud Functions Kurulumu

#### Cloud Functions Başlangıç
```bash
# Firebase CLI kurulu değilse
npm install -g firebase-tools

# Firebase'e giriş
firebase login

# Functions başlat
firebase init functions
```

#### Functions Kodu
`functions_example/notifications.ts` dosyasını `functions/src/` klasörüne kopyalayın:

```bash
cp functions_example/notifications.ts functions/src/notifications.ts
```

#### Dependencies Yükle
```bash
cd functions
npm install firebase-admin firebase-functions
```

#### Deploy
```bash
firebase deploy --only functions
```

### 4. Firestore Security Rules

`firestore.rules` dosyasına ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Notification Devices
    match /notificationDevices/{deviceId} {
      // Kullanıcı kendi device'ını okuyabilir/yazabilir
      allow read, write: if request.auth != null && 
        deviceId.matches(request.auth.uid + '_.*');
    }
    
    // Scheduled Notifications
    match /scheduledNotifications/{notificationId} {
      // Kullanıcı kendi bildirimlerini okuyabilir
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Sadece Cloud Functions yazabilir
      allow write: if false;
    }
    
    // Notification Stats (sadece okuma)
    match /notificationStats/{statId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### 5. İndeksler Oluşturma

Firebase Console → Firestore → Indexes bölümünden:

**scheduledNotifications Collection:**
- `status` (Ascending) + `scheduledFor` (Ascending)
- `appointmentId` (Ascending) + `status` (Ascending)
- `userId` (Ascending) + `status` (Ascending)

---

## 📱 Kullanım

### Frontend Entegrasyonu

#### 1. Profil Sayfasında Bildirim Ayarı

```tsx
import { NotificationSetup } from '@/components/settings/NotificationSetup';

<NotificationSetup 
  userId={user.uid} 
  userType={user.role === 'owner' ? 'owner' : 'customer'}
  businessId={user.salonId}
/>
```

#### 2. Dashboard'da Bildirim Merkezi

```tsx
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';

<NotificationCenter />
```

#### 3. Manuel Bildirim Gönderme

```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Randevu hatırlatması planla
await pushNotificationService.scheduleAppointmentReminders(
  userId,
  appointmentId,
  appointmentDateTime,
  businessName,
  businessAddress
);

// İşletmeye yeni randevu bildirimi
await pushNotificationService.notifyBusinessNewAppointment(
  businessId,
  appointmentId,
  customerName,
  date,
  services
);

// Test bildirimi
await pushNotificationService.sendTestNotification(userId);
```

---

## 🌐 Tarayıcı Uyumluluğu

### Tam Destek
| Tarayıcı | Versiyon | Ön Plan | Arka Plan | Aksiyon Butonları |
|----------|----------|---------|-----------|-------------------|
| Chrome   | 50+      | ✅      | ✅        | ✅                |
| Firefox  | 44+      | ✅      | ✅        | ✅                |
| Edge     | 17+      | ✅      | ✅        | ✅                |
| Opera    | 37+      | ✅      | ✅        | ✅                |
| Samsung Internet | 6+ | ✅   | ✅        | ✅                |

### Kısıtlı Destek
| Tarayıcı | Versiyon | Ön Plan | Arka Plan | Notlar |
|----------|----------|---------|-----------|--------|
| Safari   | 16+      | ⚠️      | ❌        | Sadece macOS/iOS 16.4+ |
| Safari Mobile | 16.4+ | ⚠️   | ❌        | Web Push sınırlı |

**Not:** Safari'de Web Push desteği sınırlıdır. iOS Safari'de bildirimlerin çalışması için kullanıcının "Add to Home Screen" yapması gerekebilir.

### Test Edildi
- ✅ Chrome 120+ (Windows, macOS, Android)
- ✅ Firefox 121+ (Windows, macOS)
- ✅ Edge 120+ (Windows)
- ⚠️ Safari 17+ (macOS) - Sınırlı
- ❌ iOS Safari - Web Push kısıtlı

---

## 🔒 Güvenlik

### VAPID Key Güvenliği
- ✅ VAPID key environment variable'da saklanır
- ✅ Public key frontend'de, private key backend'de kullanılır
- ✅ Her proje için benzersiz key

### FCM Token Güvenliği
- ✅ Token'lar Firestore'da şifrelenmiş saklanır
- ✅ Kullanıcı sadece kendi token'ını okuyabilir
- ✅ Token'lar periyodik olarak yenilenir

### Firestore Security Rules
- ✅ Kullanıcı sadece kendi bildirimlerini görebilir
- ✅ Zamanlanmış bildirimler sadece Cloud Functions tarafından yazılabilir
- ✅ İstatistikler sadece okunabilir

### Rate Limiting
Cloud Functions'ta otomatik rate limiting:
- Kullanıcı başına dakikada max 5 bildirim
- İşletme başına dakikada max 20 bildirim

---

## 🎨 Bildirim Tasarımı

### Bildirim Anatomisi

```
┌─────────────────────────────────────────┐
│ 🔔 [Icon]  Randevu Hatırlatması    [X]  │ ← Title
├─────────────────────────────────────────┤
│ Yarın Salon ABC randevunuz var.         │ ← Body
│ Hazırlıklarınızı yapmayı unutmayın!     │
│                                          │
│ [Badge Image]                            │ ← Image (opsiyonel)
├─────────────────────────────────────────┤
│ [👁️ Görüntüle] [🗺️ Yol Tarifi]        │ ← Actions
└─────────────────────────────────────────┘
```

### Bildirim Türleri ve İkonlar

| Tür | İkon | Renk | Aksiyon Butonları |
|-----|------|------|-------------------|
| Randevu Hatırlatma | 📅 | Mavi | Görüntüle, Yol Tarifi |
| Randevu Onayı | ✅ | Yeşil | Görüntüle, Takvime Ekle |
| Randevu İptali | ❌ | Kırmızı | Görüntüle |
| Yeni Randevu (İşletme) | 🔔 | Mor | Onayla, Görüntüle |
| Ödeme Hatırlatma | 💳 | Turuncu | Öde, Detaylar |
| Sıra Hazır | ⏰ | Sarı | Geliyorum, İptal |

---

## 🧪 Test Senaryoları

### 1. Temel Test
```typescript
// Profil sayfasından test bildirimi gönder
await pushNotificationService.sendTestNotification(userId);
```

### 2. Randevu Akışı Testi
```typescript
// 1. Randevu oluştur
const reservation = await reservationService.createReservation({...});

// 2. Bildirimlerin zamanlandığını kontrol et
const notifications = await db.collection('scheduledNotifications')
  .where('appointmentId', '==', reservation.id)
  .get();

console.log('Zamanlanmış bildirimler:', notifications.size); // 2 olmalı (24h, 1h)

// 3. Manuel test (1 dakika sonrası için planla)
await pushNotificationService.scheduleNotification({
  userId,
  userType: 'customer',
  type: 'appointment_reminder',
  scheduledFor: new Date(Date.now() + 60000).toISOString(), // 1 dakika sonra
  payload: {
    title: 'Test Bildirimi',
    body: 'Bu bir test bildirimidir',
    icon: '/favicon.svg',
  },
});
```

### 3. Arka Plan Testi
1. Siteyi açın ve bildirimleri etkinleştirin
2. Tarayıcı sekmesini kapatın (tarayıcıyı tamamen KAPATIN)
3. Test bildirimi gönderin (başka bir cihazdan veya Cloud Functions'tan)
4. Bildirim desktop'ta görünmeli

### 4. Cross-Browser Test Checklist
- [ ] Chrome: Ön plan bildirimi
- [ ] Chrome: Arka plan bildirimi
- [ ] Chrome: Aksiyon butonları
- [ ] Firefox: Ön plan bildirimi
- [ ] Firefox: Arka plan bildirimi
- [ ] Edge: Ön plan bildirimi
- [ ] Edge: Arka plan bildirimi
- [ ] Safari: Ön plan bildirimi (sınırlı)

---

## 🐛 Sorun Giderme

### Bildirim İzni Verilmiyor
**Semptom:** "Bildirim izni reddedildi" mesajı

**Çözüm:**
1. Tarayıcı ayarlarından site izinlerini kontrol edin
2. Chrome: `chrome://settings/content/notifications`
3. Firefox: `about:preferences#privacy` → Permissions → Notifications
4. Siteyi izinli sitelere ekleyin

### Service Worker Kayıt Hatası
**Semptom:** "Service Worker kaydedilemedi"

**Çözüm:**
1. HTTPS kullandığınızdan emin olun (localhost hariç)
2. `public/firebase-messaging-sw.js` dosyasının var olduğunu kontrol edin
3. Console'da Service Worker hatalarını kontrol edin
4. Tarayıcıyı yenileyin ve cache'i temizleyin

### FCM Token Alınamıyor
**Semptom:** "FCM token alınamadı"

**Çözüm:**
1. VAPID key'in doğru olduğunu kontrol edin
2. Firebase Console'da Web Push certificate'in oluşturulduğunu kontrol edin
3. `.env` dosyasında `VITE_FIREBASE_VAPID_KEY` tanımlı mı?
4. Network bağlantısını kontrol edin

### Bildirimler Arka Planda Gelmiyor
**Semptom:** Site kapalıyken bildirim görünmüyor

**Çözüm:**
1. Service Worker'ın kayıtlı olduğunu kontrol edin: DevTools → Application → Service Workers
2. Service Worker'ın "Activated and running" durumunda olduğunu kontrol edin
3. `firebase-messaging-sw.js` içindeki Firebase config'in doğru olduğunu kontrol edin
4. Tarayıcı bildirim izinlerini kontrol edin
5. Sistem bildirim ayarlarını kontrol edin (Windows/macOS)

### Zamanlanmış Bildirimler Gönderilmiyor
**Semptom:** Cloud Functions çalışmıyor

**Çözüm:**
1. Firebase Console → Functions → Logs kontrol edin
2. `processScheduledNotifications` fonksiyonunun çalıştığını kontrol edin
3. Firestore'da `scheduledNotifications` collection'ında `status: 'pending'` kayıtları var mı?
4. `scheduledFor` tarihinin geçmiş olduğunu kontrol edin
5. Cloud Functions faturalandırma aktif mi? (Blaze plan gerekli)

### Safari'de Çalışmıyor
**Semptom:** Safari'de hiçbir şey olmuyor

**Çözüm:**
1. Safari 16.4+ kullandığınızdan emin olun
2. macOS/iOS 16.4+ gereklidir
3. "Web Push" desteklenmiyor olabilir - alternatif olarak email/SMS bildirimleri kullanın
4. Progressive Web App (PWA) olarak yükleyin

---

## 📊 İstatistikler ve İzleme

### Firebase Console'dan İzleme

#### Cloud Messaging Stats
1. Firebase Console → Cloud Messaging
2. **Messages sent**: Toplam gönderilen bildirim sayısı
3. **Open rate**: Bildirime tıklama oranı
4. **Impressions**: Bildirim gösterilme sayısı

#### Firestore Sorguları

**En çok bildirim alan kullanıcılar:**
```typescript
const stats = await db.collection('notificationStats')
  .orderBy('sentAt', 'desc')
  .limit(100)
  .get();
```

**Başarısız bildirimler:**
```typescript
const failed = await db.collection('scheduledNotifications')
  .where('status', '==', 'failed')
  .orderBy('sentAt', 'desc')
  .get();
```

**Bildirim türü dağılımı:**
```typescript
const typeDistribution = await db.collection('notificationStats')
  .where('sentAt', '>=', startDate)
  .where('sentAt', '<=', endDate)
  .get();

const counts = {};
typeDistribution.docs.forEach(doc => {
  const type = doc.data().type;
  counts[type] = (counts[type] || 0) + 1;
});
```

---

## 🎯 Best Practices

### 1. Bildirim Sıklığı
- ✅ Kullanıcıya günde max 3-4 bildirim
- ✅ Kritik olmayan bildirimleri grupla
- ✅ Gece saatlerinde (22:00 - 08:00) bildirim gönderme

### 2. Bildirim İçeriği
- ✅ Kısa ve öz başlıklar (max 50 karakter)
- ✅ Açıklayıcı gövde metni (max 120 karakter)
- ✅ Emoji kullanımı ile dikkat çekicilik artırma
- ✅ Aksiyon butonları ile kullanıcı etkileşimi

### 3. Performans
- ✅ Batch processing ile bildirimleri grupla (max 500)
- ✅ Retry mekanizması ile başarısız bildirimleri tekrar gönder
- ✅ Eski bildirimleri periyodik olarak temizle
- ✅ İstatistikleri analiz et ve optimize et

### 4. Kullanıcı Deneyimi
- ✅ Kolay opt-in/opt-out mekanizması
- ✅ Test bildirimi özelliği
- ✅ Bildirim geçmişi gösterimi
- ✅ Bildirim tercihlerini kaydet

---

## 📈 İleri Seviye Özellikler

### 1. Segmentasyon
Kullanıcıları gruplara ayırarak hedefli bildirimler:
- VIP müşteriler
- Yeni kullanıcılar
- Aktif olmayan kullanıcılar
- Bölge bazlı bildirimler

### 2. A/B Testing
Farklı bildirim metinlerini test et:
- Başlık varyasyonları
- CTA buton metinleri
- Gönderim zamanları

### 3. Rich Media
Görselli bildirimler:
- İşletme logosu
- Hizmet görselleri
- Kampanya afişleri

### 4. Deep Linking
Bildirimi tıkladığında direkt ilgili sayfaya yönlendirme:
- Randevu detay sayfası
- Ödeme sayfası
- Yol tarifi (Google Maps entegrasyonu)

---

## 🆘 Destek

### Dokümantasyon
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Yardım
Sorun yaşıyorsanız:
1. Bu dokümantasyondaki "Sorun Giderme" bölümünü kontrol edin
2. Firebase Console → Functions → Logs'u inceleyin
3. Browser Console'u kontrol edin
4. GitHub Issues'da arama yapın

---

## ✅ Kurulum Checklist

- [ ] VAPID key oluşturuldu ve `.env`'e eklendi
- [ ] `firebase-messaging-sw.js` Firebase config ile güncellendi
- [ ] Firebase Cloud Functions kuruldu ve deploy edildi
- [ ] Firestore security rules güncellendi
- [ ] Firestore indexes oluşturuldu
- [ ] Profile sayfasına `NotificationSetup` eklendi
- [ ] Dashboard'a `NotificationCenter` eklendi
- [ ] Tarayıcıda test bildirimi gönderildi ve alındı
- [ ] Arka plan bildirimi test edildi (site kapalı)
- [ ] Cross-browser test yapıldı
- [ ] Production'da test edildi

---

## 🎉 Tamamlandı!

Bildirim sisteminiz artık tamamen çalışır durumda. Kullanıcılarınız randevu hatırlatmaları alabilir ve siz de müşterilerinizle daha iyi iletişim kurabilirsiniz.

**Son kontroller:**
1. Bir test randevusu oluşturun
2. Bildirimlerin zamanlandığını kontrol edin
3. Test bildirimi gönderin
4. Gerçek zamanlı bildirimleri test edin

Başarılar! 🚀
