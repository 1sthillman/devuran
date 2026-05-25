# Abonelik Sistemi - Final Versiyon ✅

## 🎯 Tüm Sorunlar Çözüldü

### ✅ Düzeltilen Sorunlar

1. **Aylık Sayaç Sıfırlama** - Her abonelik kendi döngüsünde sıfırlanır
2. **Admin Onay Sistemi** - Tüm işlemler admin onayı gerektirir
3. **Plan Değiştirme** - Admin onayı olmadan plan değişmez
4. **Silme İşlemleri** - Sayaçlar otomatik azalır

---

## 🔄 1. AYLIK SAYAÇ SIFIRLAMA - DOĞRU MANTIK

### Önceki Sistem (YANLIŞ) ❌
```
Tüm abonelikler her ayın 1'inde sıfırlanıyordu

İşletme A: 15 Ocak'ta abonelik aldı
→ 1 Şubat'ta sıfırlandı ❌ (15 gün erken!)

İşletme B: 30 Ocak'ta abonelik aldı  
→ 1 Şubat'ta sıfırlandı ❌ (2 gün sonra!)
```

### Yeni Sistem (DOĞRU) ✅
```
Her abonelik kendi döngüsünde sıfırlanır

İşletme A: 15 Ocak'ta abonelik aldı
→ 15 Şubat'ta sıfırlanır ✅ (30 gün sonra)

İşletme B: 30 Ocak'ta abonelik aldı
→ 1 Mart'ta sıfırlanır ✅ (30 gün sonra)

İşletme C: 5 Şubat'ta abonelik aldı
→ 7 Mart'ta sıfırlanır ✅ (30 gün sonra)
```

### Nasıl Çalışıyor?

#### Cloud Function
```typescript
// Her saat başı çalışır
schedule('0 * * * *')

// Her abonelik için kontrol
const lastResetDate = subscription.usage.lastResetDate || lastPaymentDate;
const daysSinceLastReset = (now - lastResetDate) / (1000 * 60 * 60 * 24);

// 30 gün geçmişse sıfırla
if (daysSinceLastReset >= 30) {
  monthlyBookings = 0;
  lastResetDate = now;
}
```

#### Örnek Senaryo
```
İşletme: Salon A
Abonelik Tarihi: 15 Ocak 2024, 10:00
lastPaymentDate: 2024-01-15T10:00:00Z
lastResetDate: 2024-01-15T10:00:00Z

Kontroller:
- 14 Şubat 23:00 → 29.5 gün geçti → Sıfırlanmaz
- 15 Şubat 01:00 → 30.6 gün geçti → Sıfırlanır ✅
- lastResetDate: 2024-02-15T01:00:00Z

Sonraki Sıfırlama:
- 17 Mart 01:00 → 30.0 gün geçti → Sıfırlanır ✅
```

---

## 🔐 2. ADMİN ONAY SİSTEMİ - TAM KONTROL

### Tüm İşlemler Admin Onayı Gerektirir

#### A. Yeni Abonelik
```typescript
// Kullanıcı: Starter planı seçer
await purchaseSubscription(businessId, 'starter', 'monthly');

// Durum: pending ⏳
// Admin onayı beklenir
// İşletme henüz aktif değil
```

#### B. Abonelik Yenileme
```typescript
// Kullanıcı: Mevcut planı yeniler
await purchaseSubscription(businessId, 'professional', 'monthly');

// Durum: pending ⏳
// Admin onayı beklenir
// Mevcut abonelik devam eder
```

#### C. Plan Değiştirme (Yükseltme/Düşürme)
```typescript
// Kullanıcı: Professional → Business
await changePlan(businessId, 'business');

// Durum: pending ⏳
// pendingPlanChange kaydedilir
// Mevcut plan devam eder
// Admin onayı beklenir
```

### Admin İşlemleri

#### 1. Abonelik Onaylama
```typescript
// Admin: Yeni aboneliği onayla
await approveSubscription(businessId, 'admin@randevu.com');

// Sonuç:
// - status: pending → active ✅
// - approvedAt: 2024-01-15T10:00:00Z
// - approvedBy: admin@randevu.com
// - İşletme aktif olur
```

#### 2. Abonelik Reddetme
```typescript
// Admin: Aboneliği reddet
await rejectSubscription(businessId, 'admin@randevu.com', 'Ödeme alınamadı');

// Sonuç:
// - status: pending → cancelled ❌
// - rejectedBy: admin@randevu.com
// - rejectionReason: 'Ödeme alınamadı'
```

#### 3. Plan Değişikliği Onaylama
```typescript
// Admin: Plan değişikliğini onayla
await approvePlanChange(businessId, 'admin@randevu.com');

// Sonuç:
// - planType: starter → professional ✅
// - price: 1000 → 2500
// - pendingPlanChange: silindi
// - planChangedAt: 2024-01-15T10:00:00Z
// - planChangedBy: admin@randevu.com
```

#### 4. Plan Değişikliği Reddetme
```typescript
// Admin: Plan değişikliğini reddet
await rejectPlanChange(businessId, 'admin@randevu.com', 'Ödeme yetersiz');

// Sonuç:
// - planType: starter (değişmedi) ✅
// - pendingPlanChange: silindi
// - Mevcut plan devam eder
```

---

## 📊 3. KULLANICI AKIŞLARI

### Senaryo 1: İlk Abonelik
```
1. İşletme kaydı oluşturulur
   → Trial abonelik otomatik başlar (7 gün)
   → status: trial

2. Kullanıcı Starter planı seçer
   → Talep oluşturulur
   → status: pending
   → Trial devam eder

3. Admin onaylar
   → status: active
   → Trial sona erer
   → Starter başlar (30 gün)

4. 30 gün sonra
   → Sayaç otomatik sıfırlanır
   → Abonelik devam eder
```

### Senaryo 2: Plan Yükseltme
```
1. Mevcut: Starter (10 gün kaldı)
   → planType: starter
   → endDate: 25 Ocak

2. Kullanıcı Professional'a yükseltmek ister
   → changePlan('professional')
   → pendingPlanChange: { requestedPlanType: 'professional' }
   → Mevcut plan devam eder

3. Admin onaylar
   → planType: professional ✅
   → endDate: 25 Ocak (değişmez)
   → Limitler hemen güncellenir

4. 25 Ocak'ta süre dolar
   → Yenileme gerekir
```

### Senaryo 3: Erken Yenileme
```
1. Mevcut: Professional (15 gün kaldı)
   → endDate: 30 Ocak

2. Kullanıcı 30 gün daha eklemek ister
   → purchaseSubscription('professional', 'monthly')
   → status: pending
   → Mevcut abonelik devam eder

3. Admin onaylar
   → status: active
   → endDate: 30 Ocak + 30 gün = 1 Mart ✅
   → Hiçbir gün kaybolmaz

4. Sayaç sıfırlama
   → 30 Ocak'ta sıfırlanır (ilk dönem)
   → 1 Mart'ta sıfırlanır (ikinci dönem)
```

### Senaryo 4: Geç Yenileme
```
1. Mevcut: Professional (süresi dolmuş)
   → endDate: 15 Ocak (geçmiş)
   → status: expired

2. Kullanıcı yenilemek ister
   → purchaseSubscription('professional', 'monthly')
   → status: pending

3. Admin onaylar
   → status: active
   → endDate: Bugün + 30 gün ✅
   → Yeni dönem başlar
```

---

## 🔢 4. SAYAÇ YÖNETİMİ

### Ekleme İşlemleri ✅
```typescript
// Personel ekleme
await staffService.create(staffData);
→ staffCount++

// Hizmet ekleme
await servicesService.create(serviceData);
→ serviceCount++

// Randevu oluşturma
await appointmentsService.create(appointmentData);
→ monthlyBookings++
```

### Silme İşlemleri ✅ (Cloud Function)
```typescript
// Personel silme
onStaffDeleted trigger
→ staffCount--

// Hizmet silme
onServiceDeleted trigger
→ serviceCount--
```

### Sıfırlama İşlemi ✅ (Cloud Function)
```typescript
// Her saat başı kontrol
resetMonthlyBookings schedule
→ 30 gün geçmişse monthlyBookings = 0
→ lastResetDate = now
```

---

## 🎯 5. CLOUD FUNCTIONS

### 1. resetMonthlyBookings
```typescript
Schedule: Her saat başı (0 * * * *)
Timezone: Europe/Istanbul

Görev:
- Her aboneliği kontrol et
- lastResetDate'den 30 gün geçmiş mi?
- Geçmişse monthlyBookings = 0
- lastResetDate = now

Örnek:
İşletme A: lastResetDate = 15 Ocak
→ 15 Şubat'ta sıfırlanır
İşletme B: lastResetDate = 30 Ocak
→ 1 Mart'ta sıfırlanır
```

### 2. checkExpiredSubscriptions
```typescript
Schedule: Her gün 02:00 (0 2 * * *)
Timezone: Europe/Istanbul

Görev:
- Aktif ama süresi dolmuş abonelikleri bul
- status: active → expired
- Geçmiş kaydı oluştur
```

### 3. notifyTrialExpiring
```typescript
Schedule: Her gün 10:00 (0 10 * * *)
Timezone: Europe/Istanbul

Görev:
- Trial süresi 2 gün içinde dolacakları bul
- Bildirim kaydı oluştur
- E-posta/SMS gönder
```

### 4. notifySubscriptionExpiring
```typescript
Schedule: Her gün 09:00 (0 9 * * *)
Timezone: Europe/Istanbul

Görev:
- Aboneliği 7, 3, 1 gün kala olanları bul
- Yenileme hatırlatması gönder
```

### 5. onStaffDeleted
```typescript
Trigger: Firestore onDelete('staff/{staffId}')

Görev:
- Silinen personelin salonId'sini al
- Aboneliği bul
- staffCount--
```

### 6. onServiceDeleted
```typescript
Trigger: Firestore onDelete('services/{serviceId}')

Görev:
- Silinen hizmetin salonId'sini al
- Aboneliği bul
- serviceCount--
```

---

## 📋 6. FIRESTORE YAPISI

### subscriptions Collection
```typescript
{
  id: "sub_123",
  businessId: "salon_456",
  businessName: "Salon A",
  
  // Plan
  planType: "professional",
  interval: "monthly",
  status: "active", // pending, active, trial, expired, cancelled
  
  // Tarihler
  startDate: "2024-01-15T10:00:00Z",
  endDate: "2024-02-15T10:00:00Z",
  
  // Fiyat
  price: 2500,
  currency: "TRY",
  
  // Ödeme
  lastPaymentDate: "2024-01-15T10:00:00Z",
  lastPaymentAmount: 2500,
  nextPaymentDate: "2024-02-15T10:00:00Z",
  
  // Kullanım
  usage: {
    staffCount: 5,
    serviceCount: 25,
    monthlyBookings: 120,
    lastUpdated: "2024-01-20T15:30:00Z",
    lastResetDate: "2024-01-15T10:00:00Z" // ⭐ Yeni
  },
  
  // Bekleyen Plan Değişikliği ⭐ Yeni
  pendingPlanChange: {
    requestedPlanType: "business",
    requestedPrice: 5000,
    requestedAt: "2024-01-20T10:00:00Z",
    requestStatus: "pending"
  },
  
  // Admin Onay ⭐ Yeni
  approvedAt: "2024-01-15T11:00:00Z",
  approvedBy: "admin@randevu.com",
  planChangedAt: "2024-01-20T11:00:00Z",
  planChangedBy: "admin@randevu.com",
  
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-20T15:30:00Z"
}
```

---

## ✅ 7. DEPLOYMENT

### Adım 1: Functions Kurulum
```bash
cd functions
npm install
```

### Adım 2: Build
```bash
npm run build
```

### Adım 3: Deploy
```bash
# Tüm functions
firebase deploy --only functions

# Veya tek tek
firebase deploy --only functions:resetMonthlyBookings
firebase deploy --only functions:checkExpiredSubscriptions
firebase deploy --only functions:onStaffDeleted
firebase deploy --only functions:onServiceDeleted
```

### Adım 4: Test (Emulator)
```bash
# Emulator başlat
npm run serve

# Test endpoint
http://localhost:5001/randevu-app/us-central1/testSubscriptionFunctions
```

---

## 🎯 8. SONUÇ

### ✅ Tamamlanan Özellikler

1. **Aylık Sayaç Sıfırlama**
   - Her abonelik kendi döngüsünde
   - 30 gün bazlı
   - Otomatik (Cloud Function)

2. **Admin Onay Sistemi**
   - Tüm işlemler onay gerektirir
   - Yeni abonelik: pending
   - Yenileme: pending
   - Plan değiştirme: pending

3. **Silme İşlemleri**
   - Personel silme: sayaç azalır
   - Hizmet silme: sayaç azalır
   - Otomatik (Firestore Trigger)

4. **Bildirimler**
   - Trial süre dolma: 2 gün kala
   - Abonelik yenileme: 7, 3, 1 gün kala
   - Otomatik (Cloud Function)

5. **Süre Dolma Kontrolü**
   - Her gün otomatik kontrol
   - Expired durumuna geçiş
   - Otomatik (Cloud Function)

### 🎉 Sistem %100 Hazır!

**Tüm sorunlar çözüldü:**
- ✅ Aylık sayaç her abonelik için ayrı
- ✅ Admin onayı zorunlu
- ✅ Plan değiştirme kontrollü
- ✅ Silme işlemleri sayaçları günceller
- ✅ Otomatik bildirimler
- ✅ Otomatik süre kontrolü

**Üretim için hazır!** 🚀
