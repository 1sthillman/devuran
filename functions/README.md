# Firebase Cloud Functions - Randevu App

Bu klasör, Randevu uygulaması için Firebase Cloud Functions içerir.

## 📦 Kurulum

```bash
cd functions
npm install
```

## 🔧 Geliştirme

### Local Test (Emulator)
```bash
# Emulator'ı başlat
npm run serve

# Test endpoint'i
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions
```

### Build
```bash
npm run build
```

## 🚀 Deployment

### Tüm Functions'ları Deploy Et
```bash
npm run deploy
```

### Tek Bir Function Deploy Et
```bash
firebase deploy --only functions:resetMonthlyBookings
firebase deploy --only functions:checkExpiredSubscriptions
```

## 📋 Fonksiyonlar

### 1. resetMonthlyBookings
**Çalışma Zamanı:** Her ayın 1'i, saat 00:00 (Türkiye saati)
**Görev:** Tüm aktif aboneliklerin aylık randevu sayacını sıfırlar

```typescript
// Cron: 0 0 1 * *
// Timezone: Europe/Istanbul
```

### 2. checkExpiredSubscriptions
**Çalışma Zamanı:** Her gün saat 02:00 (Türkiye saati)
**Görev:** Süresi dolmuş abonelikleri 'expired' durumuna getirir

```typescript
// Cron: 0 2 * * *
// Timezone: Europe/Istanbul
```

### 3. notifyTrialExpiring
**Çalışma Zamanı:** Her gün saat 10:00 (Türkiye saati)
**Görev:** Trial süresi 2 gün içinde dolacak işletmelere bildirim gönderir

```typescript
// Cron: 0 10 * * *
// Timezone: Europe/Istanbul
```

### 4. notifySubscriptionExpiring
**Çalışma Zamanı:** Her gün saat 09:00 (Türkiye saati)
**Görev:** Aboneliği 7, 3, 1 gün kala yenileme hatırlatması gönderir

```typescript
// Cron: 0 9 * * *
// Timezone: Europe/Istanbul
```

### 5. onStaffDeleted
**Trigger:** Firestore - staff koleksiyonunda silme
**Görev:** Personel silindiğinde abonelik sayacını azaltır

```typescript
// Trigger: onDelete('staff/{staffId}')
```

### 6. onServiceDeleted
**Trigger:** Firestore - services koleksiyonunda silme
**Görev:** Hizmet silindiğinde abonelik sayacını azaltır

```typescript
// Trigger: onDelete('services/{serviceId}')
```

### 7. testSubscriptionFunctions
**Trigger:** HTTP Request (Sadece emulator)
**Görev:** Manuel test için endpoint

```bash
# Test URL'leri
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions?action=resetMonthly
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions?action=checkExpired
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions?action=notifyTrial
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions?action=notifyExpiring
```

## 🕐 Cron Schedule Açıklaması

```
┌───────────── dakika (0 - 59)
│ ┌───────────── saat (0 - 23)
│ │ ┌───────────── ayın günü (1 - 31)
│ │ │ ┌───────────── ay (1 - 12)
│ │ │ │ ┌───────────── haftanın günü (0 - 6) (Pazar=0)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Örnekler:**
- `0 0 1 * *` - Her ayın 1'i, gece 00:00
- `0 2 * * *` - Her gün saat 02:00
- `0 10 * * *` - Her gün saat 10:00
- `0 9 * * *` - Her gün saat 09:00

## 📊 Monitoring

### Logları Görüntüle
```bash
# Tüm loglar
npm run logs

# Belirli bir function
firebase functions:log --only resetMonthlyBookings

# Canlı loglar (tail)
firebase functions:log --only resetMonthlyBookings --tail
```

### Firebase Console
https://console.firebase.google.com/project/randevu-app/functions

## ⚙️ Environment Variables

Functions için environment variable'lar:

```bash
# Set
firebase functions:config:set someservice.key="THE API KEY"

# Get
firebase functions:config:get

# Unset
firebase functions:config:unset someservice
```

## 🔒 Güvenlik

- Tüm functions Firebase Admin SDK kullanır
- Firestore rules bypass edilir (admin yetkisi)
- HTTP functions sadece emulator'da çalışır
- Production'da scheduled functions otomatik çalışır

## 🐛 Troubleshooting

### Build Hatası
```bash
cd functions
rm -rf node_modules
npm install
npm run build
```

### Deploy Hatası
```bash
# Firebase CLI'yi güncelle
npm install -g firebase-tools

# Tekrar dene
firebase deploy --only functions
```

### Timezone Sorunu
Functions varsayılan olarak UTC kullanır. Türkiye saati için:
```typescript
.timeZone('Europe/Istanbul')
```

## 📚 Daha Fazla Bilgi

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
