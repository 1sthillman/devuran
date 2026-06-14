# 🔍 KAPORA SİSTEMİ KAPSAMLI ANALİZ RAPORU

## 📊 GENEL DURUM ÖZETİ

**Tarih:** 12 Haziran 2026  
**Sistem Durumu:** ✅ Çalışıyor (Legacy Mode)  
**Backend Validation:** ⚠️ Kapalı (Firebase Blaze plan gerekli)  
**Kritiklik:** 🔴 Yüksek (Production'da güvenlik riski)

---

## 1. KAPORA SİSTEMİ AKIŞI

### 1.1 İşletme Tarafı (Admin Panel)

```
┌─────────────────────────────────────────────────┐
│  İşletme Sahibi → Admin Panel → Ayarlar Tab     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  PaymentSettingsForm Component                  │
│  - Havale/EFT Aktif/Pasif                      │
│  - Banka Hesapları (IBAN, Ad, Hesap Sahibi)   │
│  - Kapora Sistemi ON/OFF                       │
│  - Kapora Tipi: Yüzde (%) / Sabit (₺)         │
│  - Kapora Miktarı                              │
│  - Minimum Randevu Tutarı                      │
│  - Ödeme Süresi (24-168 saat)                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Firestore: salons/{salonId}                    │
│  paymentSettings: {                             │
│    bankTransferEnabled: boolean,                │
│    bankAccounts: [...],                         │
│    depositSettings: {...}                       │
│  }                                              │
└─────────────────────────────────────────────────┘
```


### 1.2 Müşteri Tarafı (Booking Flow)

```
┌─────────────────────────────────────────────────┐
│  Müşteri → Salon Seçimi → Hizmet/Paket Seçimi  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  SlotBookingWizard / Diğer Wizard'lar          │
│  - Salon verisi yüklenir                       │
│  - paymentSettings kontrol edilir              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  KAPORA HESAPLAMA (useEffect)                   │
│  ✅ 1. IBAN Kontrolü yapılır                    │
│     - bankTransferEnabled === true?            │
│     - bankAccounts var mı?                     │
│     - En az 1 geçerli IBAN var mı?             │
│                                                 │
│  ✅ 2. Kapora Ayarları Kontrolü                 │
│     - depositSettings.enabled === true?        │
│     - totalPrice >= minimumReservationAmount?  │
│                                                 │
│  ✅ 3. Kapora Hesaplama                         │
│     - percentage: totalPrice * (amount/100)    │
│     - fixed: amount                            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Kullanıcıya Gösterim                          │
│  - Toplam Tutar: 2.000 ₺                       │
│  - Şimdi Ödenecek Kapora: 600 ₺                │
│  - Randevuda Ödenecek: 1.400 ₺                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Rezervasyon Gönderme (bookingStore)           │
│  - USE_BACKEND_VALIDATION kontrolü             │
│  - false: Legacy method (reservationService)   │
│  - true: Backend validation (Cloud Function)   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  BookingSuccess Sayfası                        │
│  ✅ IBAN kontrolü tekrar yapılır                │
│  - Eğer IBAN yoksa ödeme bilgisi gösterilmez   │
│  - Eğer IBAN varsa PaymentInformation gösterilir│
└─────────────────────────────────────────────────┘
```

---

## 2. KRİTİK KONTROL NOKTALARı

### 2.1 ✅ IBAN Kontrolü (3 Katmanlı)

| Katman | Lokasyon | Kontrol |
|--------|----------|---------|
| **Frontend (Wizard)** | `SlotBookingWizard.tsx:62-66` | IBAN var mı? → Kapora hesapla |
| **Backend (Cloud Function)** | `functions/src/reservations.ts:187-193` | IBAN var mı? → Kapora gerekli |
| **Success Page** | `BookingSuccess.tsx:211-214` | IBAN var mı? → Ödeme bilgisi göster |

**✅ DOĞRU:** Üç katmanda da aynı kontrol var.

### 2.2 ⚠️ POTANSİYEL SORUN: Salon Verisi Yüklenme Zamanlaması

**Senaryo:**  
Müşteri rezervasyon yaparken salon verisi cache'den gelebilir veya eski olabilir.

**Risk:**  
```typescript
// bookingStore'da salon verisi state'te tutuluyor
init: (salonId, salon) => {
  set({ salon, ... });
}
```

**Çözüm Önerisi:**  
Rezervasyon göndermeden hemen önce salon verisini fresh olarak çek.



---

## 3. BULDUĞUM KRİTİK SORUNLAR

### 🔴 SORUN #1: Salon Verisi Güncel Değilse Kapora Yanlış Hesaplanır

**Lokasyon:** `src/store/bookingStore.ts:346-349`

**Mevcut Kod:**
```typescript
submitReservation: async () => {
  const state = get();
  const salonData = state.salon!; // ⚠️ Cache'deki veri kullanılıyor!
}
```

**Problem:**  
İşletme admin panelden kapora ayarlarını değiştirirse, müşterinin browser'ında eski salon verisi olabilir.

**Çözüm:**
```typescript
submitReservation: async () => {
  const state = get();
  
  // ✅ Fresh salon verisi çek
  const { salonsService } = await import('@/services/firebaseService');
  const freshSalon = await salonsService.getById(state.salonId!);
  
  // Kapora kontrolü fresh veri ile yap
  const hasDeposit = freshSalon?.paymentSettings?.depositSettings?.enabled;
}
```

### 🔴 SORUN #2: IBAN Kontrolü Wizard'da Var, Backend'de Var AMA reservationService.ts'de YOK

**Lokasyon:** `src/services/reservationService.ts:410-465`

**Mevcut Kod:**
```typescript
private calculateDeposit(data, totalAmount, depositSettings?) {
  if (depositSettings?.enabled) {
    // ⚠️ IBAN kontrolü YOK!
    return { required: true, ... };
  }
}
```

**Problem:**  
Legacy method kullanılırken IBAN kontrolü yapılmıyor. Kapora "required" olarak işaretleniyor ama IBAN yok!

**Çözüm:**
IBAN kontrolü ekle veya `calculateDeposit`'e `hasValidIBAN` parametresi ekle.



### 🟡 SORUN #3: reservationService.ts'de Salon Ayarları Hatalı Çekiliyor

**Lokasyon:** `src/services/reservationService.ts:50-58`

**Mevcut Kod:**
```typescript
let salonSettings: any = null;
if (sanitizedData.businessId) {
  try {
    const { salonsService } = await import('./firebaseService');
    salonSettings = await salonsService.getById(sanitizedData.businessId);
  } catch (error) {
    console.warn('Salon settings could not be loaded');
  }
}

const pricing = this.calculatePricing(sanitizedData, salonSettings?.paymentSettings?.depositSettings);
```

**Problem:**  
Hata olursa `salonSettings = null` oluyor ve kapora hesaplanmıyor. **SESSIZCE GEÇİYOR!**

**Çözüm:**
```typescript
if (!salonSettings) {
  throw new Error('İşletme ayarları yüklenemedi. Lütfen tekrar deneyin.');
}
```

### 🟡 SORUN #4: Rezervasyon Sonrası Salon Verisi Tekrar Çekilmiyor

**Lokasyon:** `src/pages/BookingSuccess.tsx`

**Durum:**  
BookingSuccess sayfasında salon verisi nereden geliyor? `useParams` ile reservationId alınıyor, sonra reservation fetch ediliyor ama salon verisi?

**Kontrol Edelim:**


**Kontrol Sonucu:**
```typescript
// src/pages/BookingSuccess.tsx:30-34
const salonData = await salonsService.getById(data.businessId);
setSalon(salonData);
```

✅ **İYİ:** Salon verisi fresh çekiliyor. SORUN YOK.

---

## 4. REZERVASYON AKIŞINDA FİYAT MANİPÜLASYONU RİSKİ

### 🔴 KRİTİK GÜVENLİK SORUNU: Client-Side Price Manipulation

**Senaryo:**  
1. Kullanıcı browser console'u açar
2. `useBookingStore.getState().selectedServices` dizisini değiştirir
3. Fiyatı 2000₺'den 20₺'ye düşürür
4. Rezervasyonu gönderir

**Mevcut Durum:**
```typescript
// USE_BACKEND_VALIDATION = false
// ⚠️ Client fiyatı doğrudan kabul ediliyor!
```

**Sonuç:**  
Kullanıcı 20₺ ödeyerek 2000₺'lik hizmeti alabilir!

### 🛡️ ÇÖZÜM: Backend Validation Zorunlu

**Adım 1:** Firebase Blaze Plan Upgrade
**Adım 2:** Cloud Functions Deploy
**Adım 3:** `USE_BACKEND_VALIDATION = true`

---

## 5. KAPORA SİSTEMİ TEST SENARYOLARI

### Test Senaryosu #1: IBAN Yok, Kapora Ayarı Açık

**Durum:**
- `depositSettings.enabled = true`
- `bankTransferEnabled = false` veya `bankAccounts = []`

**Beklenen Sonuç:**  
Kapora gösterilmemeli.

**Mevcut Kod Test:**
```typescript
// SlotBookingWizard.tsx:63-66
const hasValidIBAN = salon?.paymentSettings?.bankTransferEnabled && 
                     salon?.paymentSettings?.bankAccounts &&
                     salon.paymentSettings.bankAccounts.length > 0 &&
                     salon.paymentSettings.bankAccounts.some(acc => acc.iban ...);

if (hasValidIBAN && salon?.paymentSettings?.depositSettings && totalPrice > 0) {
  // Kapora hesapla
}
```

✅ **DOĞRU:** IBAN yoksa kapora hesaplanmıyor.



### Test Senaryosu #2: Minimum Tutar Altında

**Durum:**
- `depositSettings.enabled = true`
- `minimumReservationAmount = 1000₺`
- `totalPrice = 500₺`

**Beklenen Sonuç:**  
Kapora gösterilmemeli.

**Mevcut Kod Test:**
```typescript
// SlotBookingWizard.tsx:72-75
if (!settings.enabled || 
    (settings.minimumReservationAmount && totalPrice < settings.minimumReservationAmount)) {
  setDepositInfo({ required: false, amount: 0, remaining: totalPrice });
  return;
}
```

✅ **DOĞRU:** Minimum tutar kontrolü var.

### Test Senaryosu #3: IBAN Sonradan Silindi

**Durum:**
1. Müşteri rezervasyon wizard'ını açtı (IBAN vardı, kapora gösterildi)
2. İşletme admin panelden IBAN'ı sildi
3. Müşteri rezervasyonu gönderdi

**Risk:**  
Müşteriye "600₺ kapora öde" diyor ama IBAN yok!

**Mevcut Durum:**
```typescript
// BookingSuccess.tsx:211-214
{salon?.paymentSettings?.bankTransferEnabled && 
 salon.paymentSettings.bankAccounts && 
 salon.paymentSettings.bankAccounts.length > 0 &&
 salon.paymentSettings.bankAccounts.some(acc => acc.iban...) && (
  <PaymentInformation ... />
)}
```

✅ **DOĞRU:** BookingSuccess'te tekrar kontrol ediliyor. IBAN yoksa gösterilmiyor.

**AMA:** Rezervasyon zaten `depositRequired: true` olarak kaydedildi!

**Çözüm Önerisi:**  
`submitReservation` içinde fresh salon verisi çekerek IBAN kontrolü yap.

---

## 6. ÖNERİLEN DÜZELTMELER

### Düzeltme #1: submitReservation'da Fresh Salon Verisi Çek

**Dosya:** `src/store/bookingStore.ts`

**Eklenecek Kod:**
```typescript
submitReservation: async () => {
  const state = get();
  
  // ✅ Fresh salon verisi çek
  const { salonsService } = await import('@/services/firebaseService');
  const freshSalon = await salonsService.getById(state.salonId!);
  
  // IBAN kontrolü
  const hasValidIBAN = freshSalon?.paymentSettings?.bankTransferEnabled && 
                       freshSalon?.paymentSettings?.bankAccounts &&
                       freshSalon.paymentSettings.bankAccounts.length > 0 &&
                       freshSalon.paymentSettings.bankAccounts.some(acc => 
                         acc.iban && acc.iban.trim().length > 0
                       );
  
  // Kapora kontrolü
  const depositSettings = freshSalon?.paymentSettings?.depositSettings;
  const shouldRequireDeposit = hasValidIBAN && 
                               depositSettings?.enabled &&
                               (!depositSettings.minimumReservationAmount || 
                                totalPrice >= depositSettings.minimumReservationAmount);
  
  // Rezervasyon verisine ekle
  reservationData._hasValidIBAN = hasValidIBAN;
  reservationData._shouldRequireDeposit = shouldRequireDeposit;
}
```



### Düzeltme #2: reservationService.ts'de IBAN Kontrolü Ekle

**Dosya:** `src/services/reservationService.ts`

**Değiştirilecek Fonksiyon:**
```typescript
async createReservation(data: Partial<Reservation>): Promise<Reservation> {
  // ... sanitization ...
  
  // 🆕 İşletme ayarlarını al
  let salonSettings: any = null;
  if (sanitizedData.businessId) {
    try {
      const { salonsService } = await import('./firebaseService');
      salonSettings = await salonsService.getById(sanitizedData.businessId);
      
      // ✅ CRITICAL: Salon ayarları yüklenemezse hata fırlat
      if (!salonSettings) {
        throw new Error('İşletme ayarları yüklenemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Salon settings loading error:', error);
      throw new Error('İşletme ayarları yüklenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  // ✅ IBAN kontrolü
  const hasValidIBAN = salonSettings?.paymentSettings?.bankTransferEnabled && 
                       salonSettings?.paymentSettings?.bankAccounts &&
                       salonSettings.paymentSettings.bankAccounts.length > 0 &&
                       salonSettings.paymentSettings.bankAccounts.some((acc: any) => 
                         acc.iban && acc.iban.trim().length > 0
                       );
  
  // Fiyat hesapla (IBAN kontrolü ile)
  const pricing = this.calculatePricing(
    sanitizedData, 
    hasValidIBAN ? salonSettings?.paymentSettings?.depositSettings : undefined
  );
  
  // ...
}
```

### Düzeltme #3: calculateDeposit Fonksiyonunu Güncelle

**Dosya:** `src/services/reservationService.ts`

**Signature Değişikliği:**
```typescript
private calculateDeposit(
  data: Partial<Reservation>, 
  totalAmount: number,
  depositSettings?: {...},
  hasValidIBAN: boolean = false // 🆕 Yeni parametre
) {
  // IBAN yoksa kapora YOK
  if (!hasValidIBAN) {
    return {
      required: false,
      percentage: 0,
      amount: 0
    };
  }
  
  // İşletme kapora ayarları varsa ve aktifse
  if (depositSettings?.enabled) {
    // ... hesaplama ...
  }
  
  // Varsayılan: Kapora yok
  return { required: false, percentage: 0, amount: 0 };
}
```

---

## 7. DEPLOYMENT DURUMU

### ✅ Frontend Deploy: BAŞARILI
```
Production: https://app-ofv6ht13a-minifinise-gmailcoms-projects.vercel.app
Aliased: https://app-ruby-ten-20.vercel.app
```

### ⚠️ Backend Deploy: BAŞARISIZ
```
Error: Your project ruloposs must be on the Blaze (pay-as-you-go) plan
```

**Gerekli Adım:**  
Firebase Console'dan Blaze planına upgrade: https://console.firebase.google.com/project/ruloposs/usage/details

---

## 8. ÖNCELİK SıRASI

### 🔴 YÜKSEK ÖNCELİK (Hemen Yapılmalı)

1. **Düzeltme #1 Uygula:** submitReservation'da fresh salon verisi çek
2. **Düzeltme #2 Uygula:** reservationService'te IBAN kontrolü ekle
3. **Firebase Blaze Upgrade:** Backend validation için gerekli
4. **Backend Functions Deploy:** Güvenli fiyat doğrulama

### 🟡 ORTA ÖNCELİK (1 Hafta İçinde)

5. Test senaryolarını çalıştır
6. Edge case'leri test et (IBAN sonradan silme, vb.)
7. Monitoring ekle (Sentry, Firebase Analytics)

### 🟢 DÜŞÜK ÖNCELİK (İyileştirme)

8. Kapora ödeme takip sistemi
9. Otomatik kapora hatırlatma (SMS/Email)
10. Kapora ödenme raporu

---

## 9. RİSK DEĞERLENDİRMESİ

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| **Fiyat Manipülasyonu** | Yüksek | Kritik | Backend validation deploy |
| **IBAN Sonradan Silme** | Orta | Yüksek | Fresh salon verisi çek |
| **Salon Ayarları Yüklenememe** | Düşük | Yüksek | Error handling ekle |
| **Cache'li Salon Verisi** | Orta | Orta | Fresh data çek |
| **Minimum Tutar Kontrolü** | Düşük | Düşük | ✅ Zaten var |

---

## 10. SONUÇ VE TAVSİYELER

### ✅ İYİ Yanlar
1. IBAN kontrolü 3 katmanda yapılıyor
2. Minimum tutar kontrolü çalışıyor
3. BookingSuccess'te fresh salon verisi çekiliyor
4. PaymentInformation component kapora desteği var

### ⚠️ Sorunlu Yanlar
1. submitReservation'da eski salon verisi kullanılıyor
2. reservationService'te IBAN kontrolü yok
3. Backend validation kapalı (güvenlik riski)
4. Salon ayarları yüklenemezse sessizce devam ediyor

### 🎯 Aksiyon Planı

**Bugün (12 Haziran 2026):**
- [ ] Düzeltme #1 ve #2'yi uygula
- [ ] Test et (IBAN var/yok senaryoları)
- [ ] Firebase Blaze upgrade yap

**Yarın (13 Haziran 2026):**
- [ ] Backend functions deploy et
- [ ] USE_BACKEND_VALIDATION = true yap
- [ ] Production'da test et

**Bu Hafta:**
- [ ] Edge case testleri
- [ ] Monitoring ekle
- [ ] Kullanıcı dökümantasyonu

---

**Rapor Hazırlayan:** Kiro AI  
**Tarih:** 12 Haziran 2026  
**Versiyon:** 1.0
