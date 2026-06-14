# 🔒 GÜVENLİK DÜZELTMELERİ - DEPLOYMENT KILAVUZU

Bu dokümanda yapılan tüm güvenlik düzeltmeleri ve production'a geçiş adımları açıklanmıştır.

## 📋 YAPILAN DÜZELTMELER

### ✅ 1. Firestore Rules - Güvenlik Sıkılaştırma
**Dosya:** `firestore.rules`

**Değişiklikler:**
- ❌ Public read kaldırıldı - Artık sadece kendi aboneliğini görebilir
- ❌ Custom price manipülasyonu engellendi
- ❌ Status manipülasyonu engellendi - Sadece admin değiştirebilir
- ✅ Pending status zorunluluğu eklendi
- ✅ Usage stats güncelleme izni eklendi

**Etki:** İşletmeler artık kendi aboneliğini 'active' yapamaz, admin onayı gerekir.

---

### ✅ 2. Subscription Service - Custom Price Kaldırma
**Dosya:** `src/services/subscriptionService.ts`

**Değişiklikler:**
- ❌ `customPrice` parametresi kaldırıldı
- ✅ Fiyatlar SADECE plan tanımından alınır
- ✅ Trial history kontrolü eklendi (status değiştirme bypass engellendi)
- ✅ `incrementUsageStat()` fonksiyonu eklendi (atomic counter)

**Etki:** Müşteriler artık fiyatı manipüle edemez.

---

### ✅ 3. Queue Processing - Transaction Güvenliği
**Dosya:** `src/services/firebaseService.ts`

**Değişiklikler:**
- ✅ WriteBatch kullanılarak atomic operation sağlandı
- ✅ Appointment creation + queue deletion aynı transaction'da
- ❌ Race condition engellendi

**Etki:** Aynı kişi 2 kez randevu alamaz, slot çakışması olmaz.

---

### ✅ 4. Usage Counter - Atomic Increment
**Dosya:** `src/services/subscriptionService.ts`

**Yeni Fonksiyon:**
```typescript
async incrementUsageStat(
  businessId: string,
  field: 'staffCount' | 'serviceCount' | 'monthlyBookings',
  amount: number = 1
): Promise<void>
```

**Etki:** Concurrent updates artık güvenli, plan limiti bypass edilemez.

---

### ✅ 5. Admin Service - Rate Limiting & Atomicity
**Dosya:** `src/services/adminService.ts`

**Değişiklikler:**
- ✅ Bulk operations max 100 item limit
- ✅ Hard delete transaction güvenliği (audit log + delete atomik)

**Etki:** DoS attack engellendi, audit log her zaman yazılır.

---

### ✅ 6. Email Function - Authentication & Validation
**Dosya:** `functions/src/email.ts`

**Değişiklikler:**
- ✅ Appointment validation eklendi (fake appointment kontrolü)
- ✅ Salon ve user existence kontrolü
- ✅ Rate limiting (max 10 instances)
- ✅ Memory limit: 256MB

**Etki:** Spam email engellendi, maliyetler düştü.

---

### ✅ 7. Booking Store - Backend Validation Hazırlığı
**Dosya:** `src/store/bookingStore.ts`

**Değişiklikler:**
- ✅ `_requiresPriceValidation` flag eklendi
- ✅ `_packageId` eklendi (backend validation için)
- ⚠️ Uyarı yorumları eklendi

**Etki:** Frontend fiyat hesaplıyor ama backend validation için hazır.

---

### ✅ 8. Rate Limiter - Race Condition Fix
**Dosya:** `src/utils/rateLimiter.ts`

**Değişiklikler:**
- ✅ Entry referansı korunarak increment yapıldı
- ❌ Gereksiz `this.limits.set()` kaldırıldı

**Etki:** Rate limiting artık doğru çalışıyor.

---

### ✅ 9. Backend Price Validation - Yeni Cloud Function
**Dosya:** `functions/src/reservations.ts` (YENİ)

**Fonksiyonlar:**
1. `createReservationWithValidation` - Fiyat doğrulama ve rezervasyon oluşturma
2. `onReservationCreated` - Otomatik onay kontrolü
3. `cleanupExpiredReservations` - Expired rezervasyonları temizleme

**Özellikler:**
- ✅ Tüm rezervasyon tipleri için fiyat validation
- ✅ Servis/paket/item ID'lerinden gerçek fiyat çekiliyor
- ✅ Client-side fiyat manipülasyonu engelleniyor
- ✅ Otomatik onay kategorileri (kuaför, berber vs.)

**Etki:** Müşteriler artık fiyatı manipüle edemez, tüm fiyatlar backend'de doğrulanır.

---

## 🚀 DEPLOYMENT ADIMLARI

### Adım 1: Firestore Rules Deployment
```bash
firebase deploy --only firestore:rules
```

**Doğrulama:**
```bash
firebase firestore:rules:list
```

---

### Adım 2: Firebase Functions Deployment

**Gereksinimler:**
```bash
cd functions
npm install firebase-functions firebase-admin stripe resend
```

**Environment Variables:**
```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_KEY" \
  resend.api_key="re_YOUR_KEY"
```

**Deployment:**
```bash
firebase deploy --only functions
```

**Alternatif (Sadece yeni functions):**
```bash
firebase deploy --only functions:createReservationWithValidation,functions:onReservationCreated,functions:cleanupExpiredReservations
```

**Doğrulama:**
```bash
firebase functions:log --only createReservationWithValidation
```

---

### Adım 3: Frontend Güncellemesi

**reservationService.ts Güncelleme:**

Mevcut `createReservation()` fonksiyonunu değiştirin:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

async createReservation(reservationData: any) {
  const functions = getFunctions();
  const createReservationFn = httpsCallable(functions, 'createReservationWithValidation');
  
  try {
    const result = await createReservationFn(reservationData);
    return result.data;
  } catch (error: any) {
    console.error('Reservation error:', error);
    throw new Error(error.message || 'Rezervasyon oluşturulamadı');
  }
}
```

---

### Adım 4: Custom Claims Setup (Admin)

**Admin custom claims ekleme:**

```typescript
// Admin SDK ile (server-side)
admin.auth().setCustomUserClaims('ADMIN_USER_ID', {
  admin: true
});
```

**Veya Firebase CLI:**
```bash
firebase auth:export users.json
# users.json'u düzenle
firebase auth:import users.json --hash-algo=scrypt
```

---

## ✅ DOĞRULAMA TEST SENARYOLARI

### Test 1: Fiyat Manipülasyonu Engelleme
```typescript
// ❌ BAŞARISIZ OLMALI
const fakeReservation = {
  services: [{id: 'service1', price: 100}],
  totalPrice: 1 // Manipüle edilmiş fiyat
};

// ✅ Backend gerçek fiyatı hesaplayacak
```

### Test 2: Trial Bypass Engelleme
```typescript
// ❌ BAŞARISIZ OLMALI
// 1. Trial al
await subscriptionService.createTrialSubscription('business1', 'Test');

// 2. Status değiştir
await updateDoc(doc(db, 'subscriptions', 'business1'), {
  status: 'cancelled'
});

// 3. Tekrar trial almaya çalış
await subscriptionService.createTrialSubscription('business1', 'Test');
// Error: "Bu işletme daha önce trial kullanmış"
```

### Test 3: Queue Race Condition
```typescript
// ✅ BAŞARILI OLMALI (dublicate yok)
// Aynı anda 2 cancel işlemi
await Promise.all([
  appointmentsService.cancel('appointment1', 'test', 'salon'),
  appointmentsService.cancel('appointment1', 'test', 'salon')
]);

// Sadece 1 kişi queue'dan çıkmalı
```

### Test 4: Bulk Operation Limit
```typescript
// ❌ BAŞARISIZ OLMALI
const userIds = Array.from({length: 101}, (_, i) => `user${i}`);
await adminUserService.bulkBan(userIds, 'test', 'admin1', 'Admin');
// Error: "Tek seferde en fazla 100 kullanıcı"
```

---

## 📊 MONITORING & ALERTS

### Cloud Functions Monitoring
```bash
# Function invocation count
firebase functions:log --limit 50

# Specific function logs
firebase functions:log --only createReservationWithValidation

# Error tracking
firebase functions:log --only-errors
```

### Firestore Rules Monitoring
Firebase Console > Firestore > Rules tab > Metrics

**İzlenecek:**
- Denied operations (artış varsa sorun var)
- Read/Write distribution

### Cost Monitoring
Firebase Console > Usage and billing

**İzlenecek:**
- Function invocations (spike varsa abuse olabilir)
- Firestore reads/writes
- Email send count

---

## 🔧 ROLLBACK PLANI

Sorun olursa geri alma:

### Firestore Rules Rollback
```bash
# Önceki version'ı geri yükle
firebase firestore:rules:list
firebase firestore:rules:rollback VERSION_ID
```

### Functions Rollback
```bash
# Function'ı devre dışı bırak
firebase functions:delete createReservationWithValidation

# Veya önceki version'a dön
gcloud functions deploy createReservationWithValidation \
  --source gs://YOUR_BUCKET/previous_version.zip
```

### Emergency: Client-side Fallback
`reservationService.ts` dosyasında:
```typescript
const USE_BACKEND_VALIDATION = false; // Emergency switch

async createReservation(data: any) {
  if (USE_BACKEND_VALIDATION) {
    // Backend validation
  } else {
    // Old direct Firestore write (temporary)
  }
}
```

---

## 📈 BAŞARI KRİTERLERİ

Deployment başarılı sayılır:

✅ Firestore Rules deployed (no errors)
✅ Functions deployed (3/3 successful)
✅ Email function running (no spam)
✅ Price validation working (100% backend)
✅ Trial bypass blocked
✅ Queue race condition fixed
✅ Admin operations limited (max 100)
✅ Cost increase < 10% (function calls)

---

## 🆘 SORUN GİDERME

### Problem: Function deployment failed
**Çözüm:**
```bash
# Dependencies kontrol et
cd functions
npm install

# TypeScript compile kontrol et
npm run build

# Logs kontrol et
firebase functions:log --only-errors
```

### Problem: Price validation çalışmıyor
**Çözüm:**
```bash
# Function var mı?
firebase functions:list | grep createReservationWithValidation

# Çağrılabiliyor mu?
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createReservationWithValidation

# Client-side çağrı kontrol et (browser console)
```

### Problem: Rules too restrictive
**Çözüm:**
```bash
# Simulator kullan
firebase emulators:start --only firestore

# Test et
# Browser'da: http://localhost:4000
```

---

## 📞 İLETİŞİM

Sorun olursa:
- GitHub Issues: [devuran/issues](https://github.com/devuran/devuran/issues)
- Email: support@devuran.com
- Discord: [devuran-community](https://discord.gg/devuran)

---

**Son Güncelleme:** 2026-06-12
**Version:** 1.0.0
**Hazırlayan:** Kiro AI Security Team
