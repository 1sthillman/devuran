# 🚀 Bildirim Sistemi - Hızlı Başlangıç Rehberi

## 5 Dakikada Çalıştırma

### 1️⃣ VAPID Key Oluştur (2 dk)

1. [Firebase Console](https://console.firebase.google.com/) → Projeniz
2. ⚙️ **Project Settings** → **Cloud Messaging** sekmesi
3. **Web Push certificates** → **Generate key pair**
4. Key'i kopyala

### 2️⃣ Environment Variable Ekle (30 sn)

`.env` dosyasını aç ve en alta ekle:

```env
VITE_FIREBASE_VAPID_KEY=YOUR_COPIED_KEY_HERE
```

**⚠️ ÖNEMLİ:** `YOUR_COPIED_KEY_HERE` yerine kopyaladığınız key'i yapıştırın!

### 3️⃣ Uygulamayı Yeniden Başlat (30 sn)

```bash
# Development server'ı yeniden başlat
npm run dev
```

### 4️⃣ Test Et (2 dk)

1. Tarayıcıda profil sayfanıza gidin
2. "Bildirimleri Etkinleştir" switch'ini açın
3. İzin ver butonuna tıklayın
4. "Test Bildirimi Gönder" butonuna tıklayın
5. Bildirim geldi mi? ✅

---

## 🎯 Temel Kullanım

### Müşteri Bildirimleri

```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Randevu oluşturulduğunda otomatik çalışır
await pushNotificationService.scheduleAppointmentReminders(
  userId,
  appointmentId,
  appointmentDateTime,
  businessName,
  businessAddress
);
```

### İşletme Bildirimleri

```typescript
// Yeni randevu geldiğinde otomatik çalışır
await pushNotificationService.notifyBusinessNewAppointment(
  businessId,
  appointmentId,
  customerName,
  date,
  services
);
```

---

## 🏃 Hızlı Entegrasyon

### Profil Sayfası

`src/pages/Profile.tsx` dosyasına zaten eklenmiştir:

```tsx
<NotificationSetup 
  userId={user.uid} 
  userType={user.role === 'owner' ? 'owner' : 'customer'}
  businessId={user.salonId}
/>
```

### Dashboard

İsterseniz dashboard'a bildirim merkezi ekleyin:

```tsx
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';

<NotificationCenter />
```

---

## 🔧 Cloud Functions (Opsiyonel - Zamanlanmış Bildirimler İçin)

Zamanlanmış bildirimlerin çalışması için Firebase Cloud Functions gereklidir.

### Hızlı Kurulum

```bash
# Firebase CLI kurulu değilse
npm install -g firebase-tools

# Functions başlat
firebase init functions

# Örnek kodu kopyala
cp functions_example/notifications.ts functions/src/

# Deploy
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Not:** Cloud Functions için Firebase Blaze (Pay as you go) planı gereklidir. Aylık ilk 2M çağrı ücretsizdir.

---

## ✅ Kontrol Listesi

Sisteminiz çalışıyor mu?

- [ ] VAPID key eklendi
- [ ] Uygulama yeniden başlatıldı
- [ ] Profil sayfasında bildirim ayarı görünüyor
- [ ] "Bildirimleri Etkinleştir" çalışıyor
- [ ] Test bildirimi geldi
- [ ] Tarayıcı kapatıldığında da bildirim geliyor (arka plan testi)

---

## 🐛 Hızlı Sorun Giderme

### Bildirim İzni Çalışmıyor
```
Chrome → Ayarlar → Gizlilik ve Güvenlik → Site Ayarları → Bildirimler
→ Sitenizi "İzin Verilenlere" ekleyin
```

### Token Alınamıyor
```bash
# .env dosyasını kontrol et
echo $VITE_FIREBASE_VAPID_KEY

# Boş geliyorsa, .env'yi yeniden düzenle ve uygulamayı yeniden başlat
```

### Service Worker Hatası
```
F12 → Application → Service Workers
→ "firebase-messaging-sw.js" kayıtlı mı?
→ Değilse, tarayıcıyı yenile ve cache'i temizle
```

---

## 🎉 Hepsi Bu Kadar!

Bildirim sisteminiz artık çalışıyor. Detaylı bilgi için `BILDIRIM_SISTEMI_DOKUMANTASYON.md` dosyasına bakın.

### Sonraki Adımlar

1. ✅ Gerçek randevu ile test edin
2. ✅ Farklı tarayıcılarda deneyin
3. ✅ Cloud Functions'ı kurun (zamanlanmış bildirimler için)
4. ✅ Production'a deploy edin

---

## 📞 Yardım

Sorun mu yaşıyorsunuz?

1. `BILDIRIM_SISTEMI_DOKUMANTASYON.md` → "Sorun Giderme" bölümü
2. Browser Console'u kontrol edin
3. Firebase Console → Functions → Logs

Başarılar! 🚀
