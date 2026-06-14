# 🔍 KAPORA SİSTEMİ - KRİTİK ANALİZ VE DURUM RAPORU

## ✅ TAMAMLANAN İYİLEŞTİRMELER

### 1. Type Definitions (src/types/index.ts)
✅ **TAMAMLANDI**
- `depositSettings` eklendi (Salon paymentSettings içinde)
- `PaymentInfo` interface'i tam çalışıyor
- `Appointment` interface'ine `pricing` alanı eklendi

### 2. Salon Ayarları UI (src/components/dashboard/PaymentSettingsForm.tsx)
✅ **TAMAMLANDI**
- Kapora açma/kapama toggle
- Yüzde veya sabit tutar seçimi
- Minimum randevu tutarı
- Ödeme süresi (24-168 saat)
- Otomatik onay ve dekont zorunluluğu
- Örnek hesaplama gösterimi

### 3. Fiyat Hesaplama (src/services/reservationService.ts)
✅ **TAMAMLANDI**
- `calculatePricing()` işletme ayarlarını alıyor
- `calculateDeposit()` dinamik hesaplama yapıyor
- Minimum tutar kontrolü var
- Geriye dönük uyumluluk korundu

### 4. Müşteri Arayüzü (src/components/booking/PaymentInformation.tsx)
✅ **TAMAMLANDI**
- Toplam tutar, kapora ve kalan tutar ayrı gösteriliyor
- Kapora vurgulanmış
- Responsive tasarım

### 5. Başarı Sayfası (src/pages/BookingSuccess.tsx)
✅ **TAMAMLANDI**
- `PaymentInformation` bileşeni entegre edildi
- Salon bankTransferEnabled kontrolü
- Kapora bilgileri gösteriliyor

### 6. Randevular Sayfası (src/pages/Appointments.tsx)
✅ **TAMAMLANDI**
- Kapora bilgisi kartlarda gösteriliyor
- Ödeme durumu (Ödendi/Bekleniyor)
- Kalan tutar bilgisi

### 7. Firestore Rules
✅ **DEPLOY EDİLDİ**
- Salon paymentSettings güncellenebilir
- Rezervasyon oluşturma izinleri var

---

## ⚠️ KRİTİK SORUNLAR VE ÇÖZÜMLERİ

### ❌ SORUN 1: Backend Validation Eksik

**Problem:**
`reservationServiceBackend.createReservationWithValidation()` çağrılıyor ama **Firebase Cloud Function yok!**

```typescript
// src/store/bookingStore.ts - Line 425
const result = await reservationServiceBackend.createReservationWithValidation(reservationData);
```

**Sonuç:**
- İstek atılıyor ama function bulunamıyor
- Hata: `functions/createReservationWithValidation not found`
- Rezervasyon oluşturulamıyor

**✅ ÇÖZÜM:** 
Cloud Function oluşturulmalı veya geçici olarak direkt Firestore write kullanılmalı.

#### Geçici Çözüm (Hemen):
```typescript
// src/store/bookingStore.ts içinde
const USE_BACKEND_VALIDATION = false; // true yerine false yap
```

#### Kalıcı Çözüm (Önerilen):
Firebase Cloud Function oluştur:

```typescript
// functions/src/reservations/createReservationWithValidation.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const createReservationWithValidation = functions.https.onCall(async (data, context) => {
  // 1. Auth kontrolü
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş yapmanız gerekiyor');
  }

  const { businessId, type, totalPrice } = data;

  // 2. İşletme ayarlarını al
  const salonDoc = await admin.firestore().collection('salons').doc(businessId).get();
  if (!salonDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'İşletme bulunamadı');
  }

  const salon = salonDoc.data();
  const depositSettings = salon.paymentSettings?.depositSettings;

  // 3. Kapora hesapla
  let depositRequired = false;
  let depositAmount = 0;
  let depositPercentage = 0;

  if (depositSettings?.enabled && totalPrice >= (depositSettings.minimumReservationAmount || 0)) {
    depositRequired = true;
    if (depositSettings.type === 'percentage') {
      depositPercentage = depositSettings.amount;
      depositAmount = Math.round(totalPrice * (depositSettings.amount / 100));
    } else {
      depositAmount = depositSettings.amount;
      depositPercentage = Math.round((depositSettings.amount / totalPrice) * 100);
    }
  }

  // 4. Rezervasyon oluştur
  const reservationData = {
    ...data,
    pricing: {
      basePrice: totalPrice,
      totalAmount: totalPrice,
      depositRequired,
      depositAmount,
      depositPercentage,
      finalAmount: totalPrice - depositAmount,
      currency: 'TRY'
    },
    priceValidated: true, // ✅ Backend tarafından doğrulandı
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await admin.firestore().collection('reservations').add(reservationData);

  return {
    success: true,
    reservationId: docRef.id,
    validatedPrice: totalPrice,
    message: 'Rezervasyon başarıyla oluşturuldu'
  };
});
```

---

### ❌ SORUN 2: Wizard'larda Kapora Gösterilmiyor

**Problem:**
4. adımda (İletişim Bilgileri) sadece toplam tutar gösteriliyor, kapora bilgisi yok!

**Etkilenen Dosyalar:**
- `src/components/booking/wizards/SlotBookingWizard.tsx`
- `src/components/booking/wizards/DailyRentalWizard.tsx`
- `src/components/booking/wizards/NightlyBookingWizard.tsx`
- `src/components/booking/wizards/ProjectBookingWizard.tsx`
- `src/components/booking/wizards/OrderBookingWizard.tsx`

**✅ ÇÖZÜM:**
4. adımda kapora bilgisini hesapla ve göster:

```typescript
// SlotBookingWizard.tsx - 4. adımda
const [depositInfo, setDepositInfo] = useState<any>(null);

useEffect(() => {
  // Salon ayarlarından kapora hesapla
  if (activeStep === 4 && salon && totalPrice > 0) {
    const settings = salon.paymentSettings?.depositSettings;
    if (settings?.enabled && totalPrice >= (settings.minimumReservationAmount || 0)) {
      if (settings.type === 'percentage') {
        setDepositInfo({
          required: true,
          amount: Math.round(totalPrice * (settings.amount / 100)),
          remaining: totalPrice - Math.round(totalPrice * (settings.amount / 100))
        });
      } else {
        setDepositInfo({
          required: true,
          amount: settings.amount,
          remaining: totalPrice - settings.amount
        });
      }
    }
  }
}, [activeStep, salon, totalPrice]);

// 4. adımda UI:
{step.id === 4 && (
  <>
    {/* Müşteri bilgileri formları */}
    
    {/* Fiyat bilgisi */}
    {depositInfo?.required ? (
      <div className="space-y-2">
        <div className="p-3 rounded-xl bg-white/[0.03]">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-lead)]">Toplam Tutar</span>
            <span className="font-mono text-[var(--silver-frost)]">{totalPrice}₺</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
          <div className="flex justify-between items-center">
            <span className="text-sm text-purple-300">✨ Şimdi Ödenecek Kapora</span>
            <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {depositInfo.amount}₺
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03]">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-lead)]">Randevuda Ödenecek</span>
            <span className="font-mono text-[var(--silver-frost)]">{depositInfo.remaining}₺</span>
          </div>
        </div>
      </div>
    ) : (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--muted-lead)]">Toplam Tutar</span>
          <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            {totalPrice}₺
          </span>
        </div>
      </div>
    )}
    
    <button onClick={handleSubmit}>Randevu Oluştur</button>
  </>
)}
```

---

### ❌ SORUN 3: Otomatik İptal Sistemi Yok

**Problem:**
Kapora süresi dolunca (örn: 48 saat) otomatik iptal olmuyor.

**✅ ÇÖZÜM:**
Firebase Scheduled Function:

```typescript
// functions/src/cron/checkDepositDeadlines.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const checkDepositDeadlines = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Pending ve kapora gerekli rezervasyonları bul
    const snapshot = await admin.firestore()
      .collection('reservations')
      .where('status', '==', 'pending')
      .where('pricing.depositRequired', '==', true)
      .get();
    
    const batch = admin.firestore().batch();
    let expiredCount = 0;

    for (const doc of snapshot.docs) {
      const reservation = doc.data();
      const createdAt = reservation.createdAt.toDate();
      const deadlineHours = 48; // Salon ayarlarından alınabilir
      const deadline = new Date(createdAt.getTime() + (deadlineHours * 60 * 60 * 1000));
      
      if (now.toDate() > deadline && !reservation.pricing.depositPaidAt) {
        batch.update(doc.ref, {
          status: 'expired',
          expiredAt: now,
          expiredReason: 'Kapora ödemesi yapılmadı',
          updatedAt: now
        });
        
        expiredCount++;
        
        // Bildirim gönder
        // await sendExpiredNotification(reservation);
      }
    }
    
    if (expiredCount > 0) {
      await batch.commit();
      console.log(`${expiredCount} rezervasyon süresi doldu`);
    }
    
    return null;
  });
```

---

### ❌ SORUN 4: Dekont Yükleme Yok

**Problem:**
Müşteri ödeme kanıtı yükleyemiyor.

**✅ ÇÖZÜM:**
Firebase Storage + File Upload bileşeni:

```typescript
// src/components/booking/ReceiptUpload.tsx
import { useState } from 'react';
import { Upload, Check, X } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ReceiptUploadProps {
  reservationId: string;
  required: boolean;
  onUpload: (url: string) => void;
}

export function ReceiptUpload({ reservationId, required, onUpload }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Sadece JPG, PNG veya PDF dosyaları yüklenebilir');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const storageRef = ref(storage, `receipts/${reservationId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setUploaded(true);
      onUpload(url);
    } catch (err: any) {
      setError(err.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--chrome-white)]">
        Dekont/Makbuz Yükle {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleUpload}
          disabled={uploading || uploaded}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className={cn(
          "p-4 rounded-xl border-2 border-dashed transition-all",
          uploaded ? "border-green-500/50 bg-green-500/10" : "border-white/20 bg-white/[0.02] hover:border-purple-500/50"
        )}>
          <div className="flex items-center justify-center gap-2">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--muted-lead)]">Yükleniyor...</span>
              </>
            ) : uploaded ? (
              <>
                <Check size={18} className="text-green-400" />
                <span className="text-sm text-green-400">Yüklendi</span>
              </>
            ) : (
              <>
                <Upload size={18} className="text-purple-400" />
                <span className="text-sm text-[var(--muted-lead)]">Dosya seçin veya sürükleyin</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X size={12} />
          {error}
        </p>
      )}
      
      <p className="text-xs text-[var(--muted-lead)]">
        JPG, PNG veya PDF (Max 5MB)
      </p>
    </div>
  );
}
```

---

## 🎯 MANTIK KONTROLÜ

### ✅ Doğru Çalışan Mantık

1. **İşletme Ayarları → Fiyat Hesaplama:**
   - `paymentSettings.depositSettings` → `calculateDeposit()` ✅
   - Yüzde veya sabit tutar doğru hesaplanıyor ✅
   - Minimum tutar kontrolü çalışıyor ✅

2. **Müşteri Deneyimi:**
   - Toplam, kapora, kalan ayrı gösteriliyor ✅
   - IBAN kopyalanabiliyor ✅
   - Randevu numarası vurgulanmış ✅

3. **Veri Yapısı:**
   - `PaymentInfo` interface tam ✅
   - `pricing.depositRequired` boolean ✅
   - `pricing.depositAmount` number ✅
   - `pricing.finalAmount` kalan tutar ✅

### ⚠️ Eksik Mantık

1. **Backend Validation:**
   - Cloud Function yok → İstek başarısız
   - Fiyat manipülasyonu mümkün
   - Security risk

2. **Ödeme Takibi:**
   - `depositPaidAt` alanı var ama manuel güncelleniyor
   - Otomatik onay mekanizması yok
   - Dekont kontrolü yok

3. **Otomatik İşlemler:**
   - Süresi dolan randevular iptal edilmiyor
   - Hatırlatma bildirimleri gönderilmiyor
   - Payment deadline takibi yok

---

## 📊 ÖNCELİK SIRALAMASı

### 🔥 YÜKSEK ÖNCELİK (Hemen Yapılmalı)

1. **Backend Validation Cloud Function** - Kritik güvenlik
2. **Wizard'larda Kapora Gösterimi** - Kullanıcı deneyimi
3. **USE_BACKEND_VALIDATION = false** - Geçici çözüm

### 🟡 ORTA ÖNCELİK (1 Hafta İçinde)

4. **Dekont Yükleme Sistemi** - İşletme ihtiyacı
5. **Otomatik İptal Cron Job** - Sistem otomasyonu
6. **Manuel Kapora Onay Butonu** - İşletme paneli

### 🟢 DÜŞÜK ÖNCELİK (Gelecekte)

7. **SMS/Email Bildirimleri** - İletişim
8. **İade Hesaplama** - Finans
9. **Ödeme Gateway Entegrasyonu** - iyzico/stripe

---

## 🚀 SONRAKI ADIMLAR

### 1. Hemen (5 dakika):
```typescript
// src/store/bookingStore.ts
const USE_BACKEND_VALIDATION = false; // ← Bu satırı değiştir
```

### 2. Bugün (1 saat):
- SlotBookingWizard'a kapora gösterimi ekle
- Diğer wizard'lara da ekle
- Test et

### 3. Bu Hafta:
- Cloud Function oluştur
- Deploy et
- `USE_BACKEND_VALIDATION = true` yap

### 4. Gelecek Hafta:
- Dekont yükleme
- Otomatik iptal
- İşletme paneli iyileştirmeleri

---

## 📝 TEST PLANI

### Manuel Testler

```
□ İşletme kapora ayarlarını açabilir mi?
□ Yüzde bazlı kapora doğru hesaplanıyor mu?
□ Sabit tutar kapora doğru hesaplanıyor mu?
□ Minimum tutar altında kapora alınmıyor mu?
□ Müşteri wizard'da kapora görebiliyor mu?
□ Success sayfasında IBAN gösteriliyor mu?
□ Randevular sayfasında kapora bilgisi var mı?
□ Toplam = Kapora + Kalan olarak doğru mu?
```

### Otomatik Testler (Gelecekte)

```typescript
describe('Deposit Calculation', () => {
  it('calculates percentage deposit correctly', () => {
    const result = calculateDeposit({
      totalAmount: 2000,
      type: 'percentage',
      amount: 30,
      minimumReservationAmount: 1000
    });
    expect(result.depositAmount).toBe(600);
    expect(result.finalAmount).toBe(1400);
  });
  
  it('skips deposit for amount below minimum', () => {
    const result = calculateDeposit({
      totalAmount: 800,
      type: 'percentage',
      amount: 30,
      minimumReservationAmount: 1000
    });
    expect(result.depositRequired).toBe(false);
  });
});
```

---

## ✅ ÖZET

**Tamamlandı:**
- Type definitions ✅
- UI bileşenleri ✅
- Fiyat hesaplama mantığı ✅
- Firestore rules ✅

**Kritik Eksikler:**
- Backend Cloud Function ❌
- Wizard'larda kapora gösterimi ❌
- Otomatik iptal sistemi ❌
- Dekont yükleme ❌

**Geçici Çözüm:**
`USE_BACKEND_VALIDATION = false` yaparak sistemi hemen çalıştırabilirsin. Ancak bu güvenlik riski taşır. Production için mutlaka Cloud Function eklenme li!

**Son Güncelleme:** 12 Haziran 2026, 15:20  
**Durum:** ⚠️ Kısmen Hazır (Geçici çözümle çalışır)
