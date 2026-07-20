# Cloud Functions Deployment Guide 🚀

## Özet
Firebase Cloud Functions ile abonelik sisteminin eksik kısımları tamamlandı. Bu guide deployment sürecini açıklıyor.

---

## 📦 Kurulum Adımları

### 1. Firebase CLI Kurulumu
```bash
# Firebase CLI'yi global olarak kur
npm install -g firebase-tools

# Firebase'e login ol
firebase login

# Projeyi seç
firebase use --add
# Proje ID'sini seç: randevu-app (veya sizin proje ID'niz)
```

### 2. Functions Dependencies Kurulumu
```bash
# Functions klasörüne git
cd functions

# Dependencies'leri kur
npm install

# Build et
npm run build
```

### 3. Local Test (Opsiyonel)
```bash
# Emulator'ı başlat
npm run serve

# Tarayıcıda aç
# http://localhost:4000 (Firebase UI)
# http://localhost:5001 (Functions)

# Test endpoint
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions
```

---

## 🚀 Production Deployment

### Tüm Functions'ları Deploy Et
```bash
# Root dizinde
firebase deploy --only functions

# Veya functions klasöründe
cd functions
npm run deploy
```

### Tek Bir Function Deploy Et
```bash
# Sadece aylık sayaç sıfırlama
firebase deploy --only functions:resetMonthlyBookings

# Sadece süre dolma kontrolü
firebase deploy --only functions:checkExpiredSubscriptions

# Sadece trigger'lar
firebase deploy --only functions:onStaffDeleted,onServiceDeleted
```

### İlk Deployment (Tüm Sistem)
```bash
# Firestore rules + indexes + functions
firebase deploy

# Veya ayrı ayrı
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

---

## 📋 Deployed Functions Listesi

### Scheduled Functions (Cron Jobs)

#### 1. resetMonthlyBookings
```
Schedule: Her ayın 1'i, saat 00:00 (Türkiye saati)
Görev: Aylık randevu sayaçlarını sıfırla
Cron: 0 0 1 * *
```

#### 2. checkExpiredSubscriptions
```
Schedule: Her gün saat 02:00 (Türkiye saati)
Görev: Süresi dolmuş abonelikleri expired yap
Cron: 0 2 * * *
```

#### 3. notifyTrialExpiring
```
Schedule: Her gün saat 10:00 (Türkiye saati)
Görev: Trial süresi 2 gün kala bildirim gönder
Cron: 0 10 * * *
```

#### 4. notifySubscriptionExpiring
```
Schedule: Her gün saat 09:00 (Türkiye saati)
Görev: Abonelik 7/3/1 gün kala hatırlatma
Cron: 0 9 * * *
```

### Firestore Triggers

#### 5. onStaffDeleted
```
Trigger: staff/{staffId} silme
Görev: Personel sayacını azalt
```

#### 6. onServiceDeleted
```
Trigger: services/{serviceId} silme
Görev: Hizmet sayacını azalt
```

### HTTP Functions (Development Only)

#### 7. testSubscriptionFunctions
```
URL: /testSubscriptionFunctions
Görev: Manuel test endpoint
Sadece emulator'da çalışır
```

---

## 🔍 Deployment Sonrası Kontrol

### 1. Firebase Console'da Kontrol
```
1. https://console.firebase.google.com açın
2. Projenizi seçin
3. Functions sekmesine gidin
4. Tüm functions'ların "Deployed" durumunda olduğunu kontrol edin
```

### 2. Logları Kontrol Et
```bash
# Tüm loglar
firebase functions:log

# Belirli bir function
firebase functions:log --only resetMonthlyBookings

# Canlı loglar
firebase functions:log --tail
```

### 3. Manuel Test
```bash
# Scheduled function'ı manuel çalıştır (Firebase Console'dan)
1. Functions sekmesine git
2. Function'ı seç
3. "Test function" butonuna tıkla
```

---

## 📊 Çalışma Zamanları (Türkiye Saati)

```
00:00 - Aylık randevu sayaçları sıfırlanır (Her ayın 1'i)
02:00 - Süresi dolmuş abonelikler kontrol edilir (Her gün)
09:00 - Abonelik yenileme hatırlatmaları gönderilir (Her gün)
10:00 - Trial süre dolma bildirimleri gönderilir (Her gün)
```

---

## 🔧 Yapılandırma

### Timezone Ayarı
```typescript
// Tüm scheduled functions Türkiye saati kullanıyor
.timeZone('Europe/Istanbul')
```

### Cron Schedule Değiştirme
```typescript
// Örnek: Her 6 saatte bir çalıştır
.schedule('0 */6 * * *')

// Örnek: Sadece hafta içi, saat 09:00
.schedule('0 9 * * 1-5')

// Örnek: Her Pazartesi saat 08: