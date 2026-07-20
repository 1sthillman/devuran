# 🔔 Push Notification Sistemi - Kapsamlı Dokümantasyon

## 🎯 AMAÇ

Web uygulaması için profesyonel push notification sistemi:
- ✅ **Telefon kilitli** bile olsa bildirim gelsin
- ✅ **Uygulama arka planda** olsa bile bildirim + ses gelsin
- ✅ **Tarayıcı kapatılmış** bile olsa bildirim gelsin (Service Worker sayesinde)
- ✅ **Native mobil uygulama** deneyimi
- ✅ **APK olmadan** tüm özellikleri kullanabilme

---

## 🏗️ MİMARİ

### Katmanlar

```
┌─────────────────────────────────────────────────┐
│  1. FRONTEND - React Components                 │
│     - NotificationPermissionDialog               │
│     - FCM Service (Token yönetimi)              │
│     - Foreground notification handler            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. SERVICE WORKER - firebase-messaging-sw.js   │
│     - Background notification handler            │
│     - Push event listener                        │
│     - Action buttons (Geliyorum, Kapat)         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. FIREBASE CLOUD MESSAGING (FCM)              │
│     - Push notification delivery                 │
│     - Token management                           │
│     - Multi-device support                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  4. BACKEND - Cloud Functions                   │
│     - sendPushNotificationOnCreate (Trigger)    │
│     - Role-based filtering                       │
│     - Multi-token delivery                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  5. FIRESTORE DATABASE                          │
│     - restaurantNotifications (trigger source)   │
│     - users (FCM tokens)                        │
│     - restaurantStaff (role mapping)            │
└─────────────────────────────────────────────────┘
```

---

## 📱 KULLANICI DENEYİMİ

### 1. İlk Giriş
```
Garson paneline giriş yapar
  ↓
2 saniye sonra NotificationPermissionDialog açılır
  ↓
"Bildirimleri Aktif Et" butonuna basar
  ↓
Tarayıcı izin dialogu gösterir
  ↓
"İzin Ver" seçer
  ↓
✅ FCM Token alınır ve Firestore'a kaydedilir
  ↓
✅ Test bildirimi gösterilir
  ↓
✅ Artık anlık bildirimler alacak
```

### 2. Bildirim Alma Senaryoları

#### A. Uygulama Açıkken (Foreground)
```
Müşteri "Garson Çağır" yapar
  ↓
Firestore: restaurantNotifications koleksiyonuna eklenir
  ↓
Cloud Function: sendPushNotificationOnCreate tetiklenir
  ↓
FCM: Push notification gönderir
  ↓
Frontend: onMessage() handler yakalar
  ↓
✅ Toast bildirimi gösterir + ses çalar
  ↓
✅ UI otomatik güncellenir (Firestore listener)
```

#### B. Uygulama Arka Plandayken (Background)
```
Müşteri "Köz İste" yapar
  ↓
Firestore: restaurantNotifications koleksiyonuna eklenir
  ↓
Cloud Function: sendPushNotificationOnCreate tetiklenir
  ↓
FCM: Push notification gönderir
  ↓
Service Worker: onBackgroundMessage() yakalar
  ↓
✅ Native bildirim gösterir (ekran üstünde)
  ↓
✅ Titreşim (vibrate)
  ↓
✅ Ses çalar (tarayıcı default)
  ↓
✅ Action buttons: "Geliyorum" | "Kapat"
```

#### C. Telefon Kilitliyken
```
Müşteri "Hesap İste" yapar
  ↓
Firestore: restaurantNotifications koleksiyonuna eklenir
  ↓
Cloud Function: sendPushNotificationOnCreate tetiklenir
  ↓
FCM: Push notification gönderir
  ↓
Service Worker: onBackgroundMessage() yakalar
  ↓
✅ Kilit ekranında bildirim gösterilir
  ↓
✅ Titreşim + ses
  ↓
Kullanıcı bildirime tıklar
  ↓
✅ Telefon açılır ve uygulama açılır
```

---

## 🔧 KURULUM ADIMLARI

### 1. Firebase Console Ayarları

#### A. Cloud Messaging API Aktif Et
```
Firebase Console → Project Settings → Cloud Messaging
  ↓
"Cloud Messaging API (Legacy)" disabled olabilir
  ↓
"Cloud Messaging API" enabled olmalı
  ↓
Google Cloud Console → APIs & Services → Enable "FCM API"
```

#### B. VAPID Key Al
```
Firebase Console → Project Settings → Cloud Messaging
  ↓
"Web Push certificates" bölümü
  ↓
"Generate key pair" tıkla
  ↓
✅ VAPID key kopyala
```

#### C. Environment Variables Ayarla
```.env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=<BURAYA_VAPID_KEY_YAPISTIR>
```

### 2. Service Worker Config

**public/firebase-messaging-sw.js** dosyasını güncelleyin:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY", // .env'den alın
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

⚠️ **ÖNEMLİ:** Service Worker'da environment variable kullanılamaz, hardcode edilmeli!

### 3. Cloud Functions Deploy

```bash
cd functions
npm install
firebase deploy --only functions:sendPushNotificationOnCreate
firebase deploy --only functions:sendTestNotification
```

### 4. Firestore Data Model

#### users koleksiyonu
```typescript
{
  id: string,
  email: string,
  name: string,
  fcmToken: string | null,        // 🆕 FCM token
  fcmRole: string | null,          // 🆕 Rol (waiter, kitchen, cashier)
  fcmUpdatedAt: string | null,     // 🆕 Token son güncelleme
  notificationsEnabled: boolean,   // 🆕 Bildirimler aktif mi?
  ...
}
```

#### restaurantStaff koleksiyonu
```typescript
{
  id: string,
  restaurantId: string,
  userId: string,                  // users koleksiyonuna referans
  name: string,
  role: 'waiter' | 'kitchen' | 'cashier' | 'owner',
  isActive: boolean,
  ...
}
```

---

## 🎨 FRONTEND KOMPONENTLERİ

### 1. NotificationPermissionDialog

**Özellikler:**
- İlk girişte 2 saniye sonra gösterilir
- Kullanıcı dostu açıklamalar
- Action buttons
- Dark mode support
- "Şimdi değil" → localStorage'a kaydedilir

**Props:**
```typescript
interface NotificationPermissionDialogProps {
  role: 'owner' | 'waiter' | 'kitchen' | 'cashier';
  restaurantId: string;
}
```

**Kullanım:**
```tsx
// WaiterPanel.tsx
<NotificationPermissionDialog role="waiter" restaurantId={restaurantId} />

// KitchenPanel.tsx
<NotificationPermissionDialog role="kitchen" restaurantId={restaurantId} />

// CashierPanel.tsx
<NotificationPermissionDialog role="cashier" restaurantId={restaurantId} />
```

### 2. FCM Service

**fcmService.ts** - Token yönetimi ve dinleme:

```typescript
// İzin iste ve token al
const token = await fcmService.requestPermissionAndGetToken();

// Token'ı Firestore'a kaydet
await fcmService.saveTokenToFirestore(userId, token, role);

// Ön planda bildirim dinle
const unsubscribe = fcmService.onForegroundMessage((payload) => {
  console.log('Bildirim alındı:', payload);
  toast.success(payload.notification.title);
});

// Cleanup
unsubscribe();
```

---

## 🔥 BACKEND (CLOUD FUNCTIONS)

### 1. sendPushNotificationOnCreate (Trigger)

**Tetiklenir:** `restaurantNotifications` koleksiyonuna yeni belge eklendiğinde

**Akış:**
```typescript
1. Bildirim verisini al (type, message, tableName, restaurantId)
2. Restoranın aktif personelini bul (restaurantStaff)
3. Rol filtrelemesi yap (checkIfRoleShouldReceive)
4. Her personel için FCM token'ı al (users koleksiyonundan)
5. Push notification payload hazırla
6. FCM üzerinden multi-token gönderimi yap
7. Başarısız token'ları temizle
```

**Rol Filtreleme:**
```typescript
waiter_call → waiter, owner
coal_request → waiter, owner
bill_request → cashier, waiter, owner
new_order → kitchen, owner
order_ready → waiter, owner
```

### 2. sendTestNotification (Callable)

Manuel test bildirimi gönderme:

```typescript
const sendTest = httpsCallable(functions, 'sendTestNotification');
await sendTest({
  userId: 'user_id',
  title: 'Test',
  body: 'Test bildirimi'
});
```

---

## 📊 BİLDİRİM PAYLOAD YAPISI

### Notification Payload
```typescript
{
  notification: {
    title: "🔥 Masa 5 - Köz İstiyor",
    body: "Köz yenilenmesi isteniyor",
    icon: "/favicon.svg"
  },
  data: {
    type: "coal_request",
    message: "Köz yenilenmesi isteniyor",
    tableName: "5",
    icon: "🔥",
    notificationId: "abc123",
    restaurantId: "rest_123"
  },
  webpush: {
    notification: {
      requireInteraction: true,  // Kullanıcı kapatana kadar kalsın
      vibrate: [200, 100, 200]   // Titreşim paterni
    },
    fcmOptions: {
      link: "/restaurant/rest_123/waiter"  // Tıklandığında açılacak sayfa
    }
  }
}
```

### Action Buttons
```typescript
actions: [
  { action: 'respond', title: '✓ Geliyorum' },
  { action: 'dismiss', title: '✕ Kapat' }
]
```

---

## 🧪 TEST SENARYOLARI

### Test 1: Foreground Notification
```
1. Garson paneli açık
2. Müşteri "Garson Çağır" yapar
3. ✅ Toast bildirimi gösterilmeli
4. ✅ Ses çalmalı
5. ✅ UI güncellenmeli
```

### Test 2: Background Notification
```
1. Garson paneli açık
2. Başka sekmeye geç
3. Müşteri "Köz İste" yapar
4. ✅ Ekran üstünde native bildirim gösterilmeli
5. ✅ Titreşim + ses
6. ✅ Action buttons görünmeli
```

### Test 3: Locked Phone
```
1. Garson panelinde bildirimler aktif
2. Telefonu kilitle
3. Müşteri "Hesap İste" yapar
4. ✅ Kilit ekranında bildirim gösterilmeli
5. ✅ Titreşim + ses
6. ✅ Bildirime tıklayınca uygulama açılmalı
```

### Test 4: Browser Closed
```
1. Garson panelinde bildirimler aktif
2. Tarayıcıyı kapat
3. Müşteri bildirim gönderir
4. ✅ İşletim sistemi bildirimi gösterilmeli
5. ✅ Tarayıcı kapalı bile olsa bildirim gelir
```

### Test 5: Role-Based Filtering
```
1. Mutfak panelinde bildirimler aktif
2. Müşteri "Garson Çağır" yapar
3. ❌ Mutfak bildirim almamalı (sadece waiter + owner alır)
4. Müşteri "Sipariş Ver" yapar
5. ✅ Mutfak bildirim almalı (kitchen + owner alır)
```

---

## 🔐 GÜVENLİK

### 1. Token Yönetimi
- Token her kullanıcı için unique
- Token'lar Firestore'da güvenli şekilde saklanır
- Geçersiz token'lar otomatik temizlenir
- Token refresh mekanizması

### 2. İzin Kontrolü
- Kullanıcı izni olmadan bildirim gönderilmez
- `Notification.permission` kontrolü
- Kullanıcı istediği zaman iptal edebilir

### 3. Rol Bazlı Filtreleme
- Her bildirim tipi için rol kontrolü
- Backend'de double-check
- Yetkisiz erişim engellenir

---

## ⚡ PERFORMANS

### 1. Token Caching
- Token local'de saklanmaz (güvenlik)
- Her sayfa yüklendiğinde kontrol edilir
- Gerekirse yenilenir

### 2. Multi-Token Delivery
- Tek request ile multiple recipient
- FCM batch sending
- Başarısız token'lar ayrı işlenir

### 3. Background Sync
- Service Worker cache kullanır
- Offline support
- Retry mekanizması

---

## 🐛 HATA AYIKLAMA

### Console Logs

**Frontend:**
```javascript
✅ FCM Token alındı: BPLnvB3qRg0A...
✅ Service Worker kaydedildi
✅ FCM token Firestore'a kaydedildi
📬 Ön plan bildirimi alındı: {...}
```

**Backend (Cloud Functions):**
```javascript
📬 Yeni bildirim oluşturuldu: {...}
✅ Ahmet (waiter) bildirim alacak
⚠️ Mehmet için token yok
✅ Push notification gönderildi: { successCount: 2, failureCount: 0 }
```

### Sık Karşılaşılan Hatalar

#### 1. "Messaging: We are unable to register the default service worker"
**Çözüm:**
- `public/firebase-messaging-sw.js` dosyası mevcut mu?
- Service Worker'da syntax hatası var mı?
- Console'da detaylı hata mesajını kontrol et

#### 2. "Permission denied"
**Çözüm:**
- Kullanıcı "Engelle" seçmiş olabilir
- Tarayıcı ayarlarından izni manuel ver
- Farklı tarayıcıda dene

#### 3. "VAPID key is not set"
**Çözüm:**
- `.env` dosyasında `VITE_FIREBASE_VAPID_KEY` var mı?
- Firebase Console'dan VAPID key oluşturuldu mu?

#### 4. Token alınıyor ama bildirim gelmiyor
**Çözüm:**
- Cloud Function deploy edildi mi?
- Firestore'da `fcmToken` ve `notificationsEnabled` true mu?
- `restaurantStaff` koleksiyonunda `userId` doğru mu?

---

## 📱 TARAYICI DESTEĞİ

| Tarayıcı | Desktop | Mobile | Background | Lock Screen |
|----------|---------|--------|------------|-------------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ⚠️ | ⚠️ | ❌ | ❌ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Opera | ✅ | ✅ | ✅ | ✅ |

**Safari Notu:** Safari'de push notification desteği sınırlı. iOS 16.4+ ve macOS 13+ gerekli.

---

## 🚀 PRODÜKSİYON ÖNCESİ

### Checklist
- [ ] Firebase Cloud Messaging API enabled
- [ ] VAPID key oluşturuldu ve .env'e eklendi
- [ ] `firebase-messaging-sw.js` config güncellendi
- [ ] Cloud Functions deploy edildi
- [ ] Firestore rules güncellendi (users, restaurantStaff read)
- [ ] Tüm panellerde NotificationPermissionDialog eklendi
- [ ] Test senaryoları başarıyla tamamlandı
- [ ] Farklı tarayıcılarda test edildi
- [ ] Kilit ekran testi yapıldı
- [ ] Rol filtreleme testi yapıldı

---

## 📞 DESTEK

### Troubleshooting
1. Console log'ları kontrol et (frontend + backend)
2. Firebase Console → Cloud Messaging → Logs
3. Chrome DevTools → Application → Service Workers
4. Network tab'de FCM request'leri kontrol et

### Kaynaklar
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## ✨ SONUÇ

**Artık sisteminizde:**
- ✅ Telefon kilitli bile olsa bildirim gelir
- ✅ Uygulama arka planda bile olsa bildirim + ses gelir
- ✅ Tarayıcı kapalı bile olsa bildirim gelir
- ✅ Native mobil uygulama deneyimi
- ✅ Rol bazlı akıllı bildirim filtreleme
- ✅ Action buttons ile hızlı yanıt
- ✅ Multi-device support
- ✅ Professional ve güvenilir

**Web sitesi APK olmadan tam bir mobil uygulama gibi çalışıyor! 🎉**
