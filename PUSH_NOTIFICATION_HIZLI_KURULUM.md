# ⚡ Push Notification - Hızlı Kurulum Rehberi

## 🎯 5 Adımda Kurulum

### 1️⃣ Firebase Console'da VAPID Key Al (2 dakika)

```
1. Firebase Console aç: https://console.firebase.google.com
2. Projenizi seçin
3. Settings (⚙️) → Project Settings
4. Cloud Messaging sekmesi
5. "Web Push certificates" bölümünü bul
6. "Generate key pair" butonuna tıkla
7. ✅ Key'i kopyala (örnek: BPLnvB3qRg0A-8xYzV...)
```

---

### 2️⃣ Environment Variables Ekle (1 dakika)

`.env` dosyanıza ekleyin:

```env
VITE_FIREBASE_VAPID_KEY=BURAYA_KOPYALADIGINIZ_KEY_YAPISTIR
```

**Örnek:**
```env
VITE_FIREBASE_VAPID_KEY=BPLnvB3qRg0A-8xYzVmKtPqWx4rN2cJl9dFhG6sA
```

---

### 3️⃣ Service Worker Config Güncelle (2 dakika)

**Dosya:** `public/firebase-messaging-sw.js`

Şu satırları bulun ve `.env` dosyanızdaki değerlerle değiştirin:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",              // ← .env'deki VITE_FIREBASE_API_KEY
  authDomain: "YOUR_AUTH_DOMAIN",      // ← .env'deki VITE_FIREBASE_AUTH_DOMAIN
  projectId: "YOUR_PROJECT_ID",        // ← .env'deki VITE_FIREBASE_PROJECT_ID
  storageBucket: "YOUR_STORAGE_BUCKET",// ← .env'deki VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← .env'deki VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "YOUR_APP_ID"                 // ← .env'deki VITE_FIREBASE_APP_ID
});
```

⚠️ **ÖNEMLİ:** Service Worker'da environment variable KULLANILMAZ, hardcode edilmelidir!

---

### 4️⃣ Cloud Functions Deploy Et (3 dakika)

Terminal'de:

```bash
# functions klasörüne git
cd functions

# Package'ları kur (ilk kez ise)
npm install

# Sadece notification fonksiyonlarını deploy et
firebase deploy --only functions:sendPushNotificationOnCreate,functions:sendTestNotification
```

**Başarılı output:**
```
✔ functions[sendPushNotificationOnCreate(europe-west1)] Successful update operation.
✔ functions[sendTestNotification(europe-west1)] Successful update operation.
✔ Deploy complete!
```

---

### 5️⃣ Uygulamayı Başlat ve Test Et (2 dakika)

```bash
# Development server'ı başlat
npm run dev
```

**Test:**
1. Garson paneline girin: `http://localhost:3000/restaurant/YOUR_ID/waiter`
2. 2 saniye sonra bildirim izin dialogu açılmalı
3. "Bildirimleri Aktif Et" → Tarayıcı izin ister → "İzin Ver"
4. ✅ Test bildirimi gösterilmeli
5. ✅ Console'da "FCM Token alındı" mesajı olmalı

---

## ✅ Test Senaryoları

### Test 1: Foreground (Kolay)
```
1. Garson paneli açık tut
2. Müşteri menüsünden "Garson Çağır" yap
3. ✅ Toast bildirimi + ses gelmeli
```

### Test 2: Background (Orta)
```
1. Garson paneli açık
2. Başka sekmeye geç
3. Müşteri menüsünden "Köz İste" yap
4. ✅ Native bildirim gelmeli (ekran üstünde)
```

### Test 3: Locked Phone (Zor)
```
1. Mobilde garson paneli aç
2. Telefonu kilitle
3. Başka cihazdan "Hesap İste" yap
4. ✅ Kilit ekranında bildirim gelmeli
```

---

## 🐛 Sorun Giderme

### "Permission denied" hatası
**Çözüm:** Tarayıcı ayarlarından site izinlerini kontrol edin

### "Token alınamadı" hatası
**Çözüm:** 
1. VAPID key doğru mu kontrol edin
2. Service Worker'da config doğru mu kontrol edin
3. Chrome DevTools → Application → Service Workers kontrol edin

### Bildirim gelmiyor
**Çözüm:**
1. Cloud Functions deploy edildi mi?
2. Console'da "FCM Token alındı" mesajı var mı?
3. `users` koleksiyonunda `fcmToken` field var mı?
4. `restaurantStaff` koleksiyonunda `userId` doğru mu?

---

## 📞 Hızlı Kontrol Komutu

Console'da çalıştırın:

```javascript
// VAPID key kontrolü
console.log('VAPID:', import.meta.env.VITE_FIREBASE_VAPID_KEY ? '✅' : '❌');

// Service Worker kontrolü
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Worker:', regs.length > 0 ? '✅' : '❌');
});

// Bildirim izni kontrolü
console.log('Permission:', Notification.permission);
```

**Beklenen output:**
```
VAPID: ✅
Service Worker: ✅
Permission: granted
```

---

## 🎉 Tamamlandı!

Artık sisteminiz:
- ✅ Telefon kilitli bile olsa bildirim gönderiyor
- ✅ Uygulama arka planda bile olsa çalışıyor
- ✅ Profesyonel ve güvenilir

**Toplam kurulum süresi: ~10 dakika**

Detaylı dokümantasyon için: `PUSH_NOTIFICATION_SISTEMI.md`
