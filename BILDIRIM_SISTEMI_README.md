# 🔔 Kapsamlı Bildirim Sistemi

## Genel Bakış

Randevu sisteminiz için **eksiksiz, profesyonel ve cross-browser uyumlu** bildirim sistemi. Müşterileriniz ve işletmeniz için gerçek zamanlı push bildirimleri, zamanlanmış hatırlatmalar ve arka plan bildirimleri.

## ✨ Özellikler

### Müşteri İçin
- ✅ **Randevu Onay Bildirimi**: Randevu onaylandığında anında bildirim
- ✅ **24 Saat Öncesi Hatırlatma**: Randevu gününden bir gün önce
- ✅ **1 Saat Öncesi Hatırlatma**: Adres bilgisi ile son hatırlatma
- ✅ **İptal Bildirimi**: Randevu iptal edildiğinde
- ✅ **Ödeme Hatırlatması**: Kapora ödemesi gereken durumlar için
- ✅ **Sıra Güncellemeleri**: Sıra durumu değişikliklerinde

### İşletme İçin
- ✅ **Yeni Randevu**: Müşteri randevu oluşturduğunda anında bildirim
- ✅ **Randevu İptali**: Müşteri iptal ettiğinde
- ✅ **Ödeme Onayı**: Müşteri ödeme yaptığında
- ✅ **Yorum Bildirimi**: Yeni yorum geldiğinde
- ✅ **Sıra Bildirimi**: Yeni müşteri sıraya girdiğinde

### Teknik Özellikler
- 🌐 **Cross-Browser**: Chrome, Firefox, Edge, Opera, Samsung Internet
- 📱 **Arka Plan Bildirimleri**: Site kapalı olsa bile çalışır
- 🎨 **Etkileşimli**: Aksiyon butonları (Görüntüle, Yol Tarifi, Onayla)
- 🔐 **Güvenli**: VAPID kimlik doğrulama
- ⚡ **Hızlı**: Firebase Cloud Messaging altyapısı
- 📊 **İzlenebilir**: İstatistik ve analitik desteği

## 📁 Dosya Yapısı

```
.
├── src/
│   ├── services/
│   │   ├── pushNotificationService.ts          # Ana bildirim servisi
│   │   ├── reservationService.ts               # Rezervasyon entegrasyonu
│   │   ├── notificationService.ts              # Email/SMS bildirimleri
│   │   └── fcmService.ts                       # FCM yönetimi
│   │
│   ├── components/
│   │   ├── settings/
│   │   │   ├── NotificationSetup.tsx           # Bildirim ayarları UI
│   │   │   └── NotificationPreferences.tsx     # Tercihler
│   │   └── dashboard/
│   │       └── NotificationCenter.tsx          # Bildirim merkezi
│   │
│   └── pages/
│       └── Profile.tsx                         # Bildirim ayarı entegrasyonu
│
├── public/
│   └── firebase-messaging-sw.js                # Service Worker (arka plan)
│
├── functions_example/
│   └── notifications.ts                        # Cloud Functions örneği
│
├── .env                                        # Environment variables (VAPID key)
│
└── Dokümantasyon/
    ├── BILDIRIM_SISTEMI_DOKUMANTASYON.md      # Detaylı dokümantasyon
    ├── BILDIRIM_HIZLI_BASLANGIC.md            # Hızlı başlangıç rehberi
    └── BILDIRIM_SISTEMI_README.md             # Bu dosya
```

## 🚀 Hızlı Başlangıç

### 1. VAPID Key Al

```bash
# Firebase Console → Project Settings → Cloud Messaging
# → Web Push certificates → Generate key pair
```

### 2. Environment Variable Ekle

`.env` dosyasına:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. Uygulamayı Başlat

```bash
npm run dev
```

### 4. Test Et

1. Profil sayfasına git
2. "Bildirimleri Etkinleştir" açın
3. "Test Bildirimi Gönder" tıklayın
4. ✅ Bildirim geldi!

**Detaylı kurulum:** `BILDIRIM_HIZLI_BASLANGIC.md`

## 📖 Dokümantasyon

### Temel Kullanım

```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Cihazı kaydet
const token = await pushNotificationService.registerDevice(
  userId, 
  'customer', 
  businessId
);

// Randevu hatırlatmaları planla
await pushNotificationService.scheduleAppointmentReminders(
  userId,
  appointmentId,
  appointmentDateTime,
  businessName,
  businessAddress
);

// İşletmeye bildirim gönder
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

### UI Entegrasyonu

```tsx
// Profil sayfası
import { NotificationSetup } from '@/components/settings/NotificationSetup';

<NotificationSetup 
  userId={user.uid} 
  userType={user.role === 'owner' ? 'owner' : 'customer'}
  businessId={user.salonId}
/>

// Dashboard
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';

<NotificationCenter />
```

## 🌐 Tarayıcı Desteği

| Tarayıcı | Ön Plan | Arka Plan | Aksiyon Butonları |
|----------|---------|-----------|-------------------|
| Chrome 50+ | ✅ | ✅ | ✅ |
| Firefox 44+ | ✅ | ✅ | ✅ |
| Edge 17+ | ✅ | ✅ | ✅ |
| Opera 37+ | ✅ | ✅ | ✅ |
| Samsung Internet 6+ | ✅ | ✅ | ✅ |
| Safari 16+ | ⚠️ Sınırlı | ❌ | ⚠️ |

## 🔧 Cloud Functions (Zamanlanmış Bildirimler)

### Kurulum

```bash
# Firebase CLI kur
npm install -g firebase-tools

# Functions başlat
firebase init functions

# Örnek kodu kopyala
cp functions_example/notifications.ts functions/src/

# Deploy
firebase deploy --only functions
```

### Fonksiyonlar

1. **processScheduledNotifications**: Her dakika çalışır, zamanı gelen bildirimleri gönderir
2. **onReservationCreated**: Yeni randevu oluşturulduğunda tetiklenir
3. **onReservationCancelled**: Randevu iptal edildiğinde tetiklenir
4. **cleanupOldNotifications**: Her gece eski bildirimleri temizler

## 🎨 Bildirim Tasarımı

### Bildirim Türleri

| Tür | Başlık Örneği | İkon | Aksiyon Butonları |
|-----|---------------|------|-------------------|
| Randevu Hatırlatma | "Yarın Randevunuz Var" | 📅 | Görüntüle, Yol Tarifi |
| Randevu Onayı | "Randevunuz Onaylandı" | ✅ | Görüntüle, Takvime Ekle |
| Randevu İptali | "Randevu İptal Edildi" | ❌ | Görüntüle |
| Yeni Randevu | "Yeni Randevu Talebi" | 🔔 | Onayla, Görüntüle |
| Ödeme | "Ödeme Hatırlatması" | 💳 | Öde, Detaylar |

### Özelleştirme

```typescript
await pushNotificationService.scheduleNotification({
  userId,
  userType: 'customer',
  type: 'appointment_reminder',
  scheduledFor: new Date().toISOString(),
  payload: {
    title: 'Özel Başlık',
    body: 'Özel mesaj içeriği',
    icon: '/custom-icon.png',
    badge: '/badge.png',
    image: '/big-image.png', // Büyük görsel
    requireInteraction: true, // Kullanıcı kapatana kadar ekranda kalır
    data: {
      customData: 'değer',
      url: '/target-page'
    },
    actions: [
      { action: 'view', title: '👁️ Görüntüle' },
      { action: 'custom', title: '✨ Özel Aksiyon' }
    ]
  }
});
```

## 🔒 Güvenlik

### Firestore Security Rules

```javascript
match /notificationDevices/{deviceId} {
  allow read, write: if request.auth != null && 
    deviceId.matches(request.auth.uid + '_.*');
}

match /scheduledNotifications/{notificationId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow write: if false; // Sadece Cloud Functions
}
```

### Best Practices

- ✅ VAPID key environment variable'da saklanır
- ✅ FCM token'lar Firestore'da güvenli şekilde saklanır
- ✅ Rate limiting (kullanıcı başına max 5/dk)
- ✅ Token otomatik yenileme
- ✅ Hata durumlarında retry mekanizması

## 📊 İstatistikler

### Firestore Collections

```
scheduledNotifications/     # Zamanlanmış bildirimler
  ├── status: 'pending' | 'sent' | 'failed' | 'cancelled'
  ├── scheduledFor: ISO date string
  ├── userId, type, payload
  └── sentAt, error

notificationDevices/        # FCM token'ları
  ├── fcmToken
  ├── userType: 'customer' | 'owner'
  ├── notificationsEnabled
  └── updatedAt

notificationStats/          # İstatistikler
  ├── notificationId
  ├── userId, type
  ├── success: boolean
  └── sentAt
```

### Analitik Sorguları

```typescript
// Başarılı bildirim oranı
const stats = await db.collection('notificationStats')
  .where('sentAt', '>=', startDate)
  .get();

const successRate = stats.docs.filter(d => d.data().success).length / stats.size;

// En çok kullanılan bildirim türü
const typeCounts = {};
stats.docs.forEach(doc => {
  const type = doc.data().type;
  typeCounts[type] = (typeCounts[type] || 0) + 1;
});
```

## 🐛 Sorun Giderme

### Bildirim Gelmiyor?

1. **İzin Kontrolü**
   ```javascript
   console.log(Notification.permission); // "granted" olmalı
   ```

2. **Service Worker Kontrolü**
   - F12 → Application → Service Workers
   - "firebase-messaging-sw.js" kayıtlı ve aktif mi?

3. **Token Kontrolü**
   ```javascript
   const token = await pushNotificationService.registerDevice(...);
   console.log('FCM Token:', token); // Token alındı mı?
   ```

4. **Firestore Kontrolü**
   - `notificationDevices` collection'ında cihaz kayıtlı mı?
   - `notificationsEnabled: true` mı?

5. **Cloud Functions Logs**
   - Firebase Console → Functions → Logs
   - `processScheduledNotifications` çalışıyor mu?

### Arka Plan Bildirimleri Çalışmıyor?

1. **HTTPS Kontrolü**: localhost veya HTTPS kullanılıyor mu?
2. **Tarayıcı Bildirimleri**: Sistem ayarlarında bildirimler aktif mi?
3. **Service Worker**: Aktif ve çalışır durumda mı?
4. **FCM Config**: `firebase-messaging-sw.js` doğru yapılandırılmış mı?

## 📚 Ek Kaynaklar

### Dahili Dokümantasyon
- 📘 **BILDIRIM_SISTEMI_DOKUMANTASYON.md**: Kapsamlı teknik dokümantasyon
- 🚀 **BILDIRIM_HIZLI_BASLANGIC.md**: 5 dakikada kurulum rehberi
- 💻 **functions_example/notifications.ts**: Cloud Functions örnek kodu

### Harici Kaynaklar
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## 🎯 Önemli Notlar

### Production'a Geçiş

1. ✅ `.env` dosyasında VAPID key tanımlı
2. ✅ Service Worker production URL'inde çalışıyor
3. ✅ HTTPS kullanılıyor
4. ✅ Cloud Functions deploy edildi
5. ✅ Firestore security rules aktif
6. ✅ Firestore indexes oluşturuldu
7. ✅ Cross-browser test yapıldı

### Maliyet

**Firebase Free (Spark) Plan:**
- ❌ Cloud Functions kullanılamaz (zamanlanmış bildirimler çalışmaz)
- ✅ Manuel bildirimler çalışır (anlık bildirimler)

**Firebase Blaze (Pay as you go) Plan:**
- ✅ İlk 2M Cloud Functions çağrısı ücretsiz
- ✅ İlk 125K FCM mesajı ücretsiz
- ✅ Küçük/orta ölçekli projeler için maliyet ~$0-5/ay

### Performans İpuçları

- ⚡ Batch processing ile bildirimleri grupla (max 500)
- ⚡ Eski bildirimleri periyodik temizle (30 gün+)
- ⚡ Rate limiting uygula (kullanıcı başına 5/dk)
- ⚡ Retry mekanizması ile başarısız bildirimleri yeniden gönder
- ⚡ Kullanıcı tercihlerini cache'le

## 🎉 Sonuç

Bu bildirim sistemi ile:
- ✅ Müşterileriniz randevularını **asla kaçırmaz**
- ✅ İşletmeniz **anlık bilgilendirilir**
- ✅ Kullanıcı deneyimi **profesyonel** olur
- ✅ **Tüm modern tarayıcılarda** çalışır
- ✅ **Ölçeklenebilir** ve **güvenli**

## 📞 Destek

Sorun yaşıyorsanız:
1. `BILDIRIM_SISTEMI_DOKUMANTASYON.md` → "Sorun Giderme"
2. Browser Console'u kontrol et
3. Firebase Console → Functions → Logs

Başarılar! 🚀
