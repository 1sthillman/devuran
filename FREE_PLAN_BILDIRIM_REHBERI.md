# 🆓 Free Plan İçin Bildirim Sistemi Rehberi

## ⚠️ Önemli Bilgi

Firebase **Free (Spark) Plan** Cloud Functions'ı desteklemez. Bu nedenle:

- ✅ **Anlık Bildirimler** çalışır (müşteri randevu oluşturduğunda, işletme onayladığında)
- ❌ **Zamanlanmış Bildirimler** çalışmaz (24 saat/1 saat öncesi hatırlatmalar)

## 🎯 Free Plan'da Çalışan Özellikler

### ✅ Tam Çalışır
1. **Ön Plan Bildirimleri**: Site açıkken anında bildirim
2. **Arka Plan Bildirimleri**: Site kapalıyken Service Worker ile bildirim
3. **Manuel Bildirimler**: Test bildirimi, anlık bildirimler
4. **Cihaz Kaydı**: FCM token yönetimi
5. **Bildirim İzinleri**: Kullanıcı izin yönetimi
6. **Bildirim Merkezi**: Gelen bildirimleri görüntüleme

### ❌ Çalışmaz (Cloud Functions Gerektirir)
1. **Zamanlanmış Bildirimler**: 24 saat/1 saat öncesi otomatik hatırlatmalar
2. **Otomatik Temizlik**: Eski bildirimlerin silinmesi
3. **Batch İşlemler**: Toplu bildirim gönderimi

## 🚀 Hızlı Kurulum (Free Plan)

### 1. VAPID Key Eklendi ✅
```env
VITE_FIREBASE_VAPID_KEY=BKaHAlV-y5l24aMBiRWJWAlB85cZ13ZkRrk7mE1Ryjsbl_8fQau4iia_3-TKkPHSIxFuyeL_fBjMKvmKipqUw9g
```

### 2. Firestore Rules Deploy
```bash
firebase deploy --only firestore:rules
```

### 3. Test Et
```bash
npm run dev
```

Profil sayfasına git → "Bildirimleri Etkinleştir" → "Test Bildirimi Gönder"

## 💡 Free Plan'da Nasıl Kullanılır?

### Müşteri Randevu Oluşturduğunda
```typescript
// Otomatik çalışır - src/services/reservationService.ts
// İşletmeye ANINDA bildirim gider
await pushNotificationService.notifyBusinessNewAppointment(
  businessId,
  appointmentId,
  customerName,
  date,
  services
);
```

### İşletme Randevu Onayladığında
```typescript
// Otomatik çalışır - src/services/reservationService.ts
// Müşteriye ANINDA bildirim gider
await pushNotificationService.scheduleNotification({
  userId,
  userType: 'customer',
  type: 'appointment_reminder',
  scheduledFor: new Date().toISOString(), // ANINDA gönder
  payload: {
    title: 'Randevunuz Onaylandı',
    body: `${businessName} randevunuz onaylandı!`,
    // ...
  }
});
```

### Manuel Bildirim Gönderme
```typescript
// Herhangi bir yerden manuel bildirim gönderebilirsiniz
await pushNotificationService.scheduleNotification({
  userId: targetUserId,
  userType: 'customer',
  type: 'appointment_reminder',
  scheduledFor: new Date().toISOString(), // Şimdi gönder
  payload: {
    title: 'Başlık',
    body: 'Mesaj içeriği',
    icon: '/favicon.svg',
  }
});
```

## 🔧 Workaround: Zamanlanmış Bildirimler

Free plan'da zamanlanmış bildirimleri manuel olarak tetikleyebilirsiniz:

### Seçenek 1: Browser Extension (Basit)
Tarayıcınızda bir zamanlayıcı eklentisi kullanın:
- Randevu gününde manuel olarak bildirimleri kontrol et
- Veya kullanıcıya email/SMS gönder

### Seçenek 2: Cron Job (Harici Sunucu)
Ücretsiz bir cron job servisi kullanın:
- [Cron-job.org](https://cron-job.org) (ücretsiz)
- [EasyCron](https://www.easycron.com) (ücretsiz plan var)

API endpoint oluşturun:
```typescript
// src/api/check-notifications.ts
export async function checkScheduledNotifications() {
  const now = new Date();
  
  const snapshot = await db.collection('scheduledNotifications')
    .where('status', '==', 'pending')
    .where('scheduledFor', '<=', now.toISOString())
    .get();
  
  for (const doc of snapshot.docs) {
    const notification = doc.data();
    // FCM ile bildirim gönder
    // ...
  }
}
```

### Seçenek 3: Email/SMS Bildirimleri (Alternatif)
Free plan'da email/SMS bildirimleri zaten çalışıyor:
```typescript
// Email hatırlatması gönder (var olan notificationService)
await notificationService.sendReservationReminder({
  userId,
  userName,
  userEmail,
  userPhone,
  businessName,
  reservationId,
  date,
  time,
  address
});
```

## 📊 Free Plan Limitleri

| Özellik | Free Plan | Blaze Plan |
|---------|-----------|------------|
| FCM Mesajları | ✅ Sınırsız | ✅ Sınırsız |
| Ön Plan Bildirimleri | ✅ Var | ✅ Var |
| Arka Plan Bildirimleri | ✅ Var | ✅ Var |
| Cloud Functions | ❌ Yok | ✅ 2M/ay ücretsiz |
| Zamanlanmış Bildirimler | ❌ Yok | ✅ Var |
| Firestore Okuma | 50K/gün | 50K/gün ücretsiz |
| Firestore Yazma | 20K/gün | 20K/gün ücretsiz |

## 🎯 Önerilen Çözüm

### Kısa Vadeli (Free Plan)
1. ✅ Anlık bildirimleri kullan
2. ✅ Email/SMS hatırlatmaları kullan
3. ✅ Manuel bildirim gönder (dashboard'dan)

### Uzun Vadeli (Blaze Plan'a Geçiş)
Blaze plan'a geçtiğinizde:
```bash
# Cloud Functions deploy et
firebase deploy --only functions
```

**Maliyet:** ~$0-5/ay (çoğu küçük işletme için ücretsiz limitler yeterli)

## ✅ Şu An Çalışan Bildirimler

1. **Yeni Randevu**: Müşteri randevu oluşturur → İşletmeye ANINDA bildirim
2. **Randevu Onayı**: İşletme onaylar → Müşteriye ANINDA bildirim
3. **Randevu İptali**: Herhangi bir taraf iptal eder → Diğer tarafa ANINDA bildirim
4. **Test Bildirimi**: Profil sayfasından test et → ANINDA bildirim
5. **Manuel Bildirim**: Dashboard'dan manuel gönder → ANINDA bildirim

## 🔔 Kullanıcıya Bilgilendirme

Müşterilerinize şu bilgiyi verin:

> "Randevu oluşturduğunuzda ve işletme onayladığında anında bildirim alacaksınız. 
> Randevunuzu telefonunuzun takvimine ekleyerek hatırlatma ayarlayabilirsiniz."

## 📅 Takvim Entegrasyonu

Free plan'da zamanlanmış bildirimler yerine takvim entegrasyonu kullanın:

```typescript
// AddToCalendarButton componenti zaten var
import { AddToCalendarButton } from '@/components/calendar/AddToCalendarButton';

<AddToCalendarButton 
  title="Randevu"
  description={businessName}
  location={address}
  startDate={appointmentDate}
  endDate={appointmentEndDate}
/>
```

Bu sayede kullanıcı kendi cihazının hatırlatma sistemini kullanır.

## 🚀 Deploy Komutu

```bash
# Sadece Firestore rules deploy et (Free plan için yeterli)
firebase deploy --only firestore:rules

# Hosting de deploy etmek isterseniz
firebase deploy --only hosting,firestore:rules
```

## ✅ Kontrol Listesi

Free plan için kontrol:

- [x] VAPID key eklendi
- [x] Firestore rules güncellendi
- [x] Service Worker yapılandırıldı
- [x] Anlık bildirimler çalışıyor
- [x] Email/SMS bildirimleri çalışıyor
- [ ] Takvim entegrasyonu aktif
- [ ] Kullanıcılara bilgilendirme yapıldı

## 💰 Blaze Plan'a Ne Zaman Geçilmeli?

Şu durumlarda Blaze plan'a geçin:

1. Günlük 50+ randevu alıyorsanız
2. Otomatik hatırlatmalar önemliyse
3. Müşteri memnuniyetini artırmak istiyorsanız
4. Randevu iptal oranını düşürmek istiyorsanız

**Not:** İlk 2M Cloud Functions çağrısı ücretsiz. Küçük işletmeler için genelde ücretsiz limitler yeterli.

---

## 🎉 Özet

Free plan'da:
- ✅ **Anlık bildirimler** tamamen çalışır
- ✅ **Email/SMS** bildirimleri çalışır
- ✅ **Takvim entegrasyonu** ile hatırlatmalar
- ❌ **Otomatik zamanlanmış** bildirimler çalışmaz

Bu, çoğu küçük işletme için **yeterlidir**! 🚀
