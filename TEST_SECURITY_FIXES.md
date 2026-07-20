# 🧪 GÜVENLİK DÜZELTMELERİ TEST CHECKLIST

**Tarih:** 20 Temmuz 2026  
**Test Edilen Sistemler:** Firestore Rules, Backend Validation, Double-Booking Prevention

## ✅ Test Adımları

### 1. Firestore Rules - Yetkisiz Erişim Testi

#### Test 1.1: Reservations - Başkasının Rezervasyonunu Değiştirme
```javascript
// Browser Console'da test edin:

// 1. Bir rezervasyon ID'si alın
const reservationId = 'HERHANGI_BIR_REZERVASYON_ID';

// 2. Başka bir kullanıcıyla giriş yapın (veya çıkış yapın)
// 3. Rezervasyonu değiştirmeye çalışın
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'reservations', reservationId), {
  status: 'cancelled',
  totalPrice: 0 // Fiyat manipülasyonu denemesi
});

// ✅ BEKLENEN SONUÇ: "Missing or insufficient permissions" hatası
```

#### Test 1.2: Subscriptions - Abonelik Yükseltme Denemesi
```javascript
// Browser Console'da test edin:

const businessId = 'KENDI_BUSINESS_ID';

await updateDoc(doc(db, 'subscriptions', businessId), {
  plan: 'premium',
  status: 'active'
});

// ✅ BEKLENEN SONUÇ: "Missing or insufficient permissions" hatası
```

#### Test 1.3: Customers - Rakip Müşteri Listesini Okuma
```javascript
// Browser Console'da test edin:

// Başka bir işletmenin müşteri belgesini okumaya çalış
const otherBusinessCustomerId = 'BASKA_BUSINESS_CUSTOMER_ID';

const customerDoc = await getDoc(doc(db, 'customers', otherBusinessCustomerId));
console.log(customerDoc.data());

// ✅ BEKLENEN SONUÇ: "Missing or insufficient permissions" hatası
```

### 2. Backend Validation - Fiyat Manipülasyonu Testi

#### Test 2.1: Client-Side Fiyat Değiştirme
```javascript
// Browser Console'da test edin:

// 1. Rezervasyon wizard'ını açın
// 2. Bir hizmet seçin (örn: Saç Kesimi - 100 TL)
// 3. Console'da store'u değiştirin:

import { useBookingStore } from '@/store/bookingStore';
const store = useBookingStore.getState();

// Fiyatı manipüle et
store.selectedServices[0].price = 1; // 100 TL → 1 TL
store.totalPrice = 1;

// 4. Rezervasyonu oluşturmaya çalış
await store.submitReservation();

// ✅ BEKLENEN SONUÇ: 
// - Backend validasyonu gerçek fiyatı (100 TL) kullanır
// - Console'da warning görülür: "Price mismatch detected"
// - Firestore'da 100 TL olarak kaydedilir
```

#### Test 2.2: Network İsteğini Değiştirme
```javascript
// Browser DevTools Network Tab'da test edin:

// 1. Rezervasyon oluşturmaya başlayın
// 2. Network tab'da "createReservationWithValidation" isteğini bulun
// 3. Request'i "Copy as fetch" ile kopyalayın
// 4. totalPrice değerini değiştirin ve tekrar gönderin

// ✅ BEKLENEN SONUÇ:
// - Backend validasyonu servislerin gerçek fiyatını hesaplar
// - Manipüle edilmiş fiyat göz ardı edilir
```

### 3. Double-Booking Prevention - Çifte Rezervasyon Testi

#### Test 3.1: Eşzamanlı Rezervasyon Denemesi
```javascript
// İki farklı tarayıcı sekmesi açın:

// SEKME 1:
const store1 = useBookingStore.getState();
store1.selectDateTime('2026-07-25', '14:00');
// Henüz submit etmeyin

// SEKME 2:
const store2 = useBookingStore.getState();
store2.selectDateTime('2026-07-25', '14:00');
// Henüz submit etmeyin

// Şimdi ikisini DE AYNI ANDA submit edin:
Promise.all([
  store1.submitReservation(),
  store2.submitReservation()
]);

// ✅ BEKLENEN SONUÇ:
// - Sadece BİR tanesı başarılı olur
// - Diğeri "Bu saat aralığı artık müsait değil" hatası alır
```

#### Test 3.2: Lock Timeout Kontrolü
```javascript
// Firestore Console'da kontrol edin:

// 1. reservationLocks koleksiyonuna gidin
// 2. Yeni oluşan lock belgelerini görün
// 3. createdAt timestamp'ını kontrol edin
// 4. 5 dakika sonra tekrar kontrol edin (lock expire olmalı)

// ✅ BEKLENEN SONUÇ:
// - Her slot rezervasyonu için lock belgesi oluşur
// - Lock format: {staffId}_{date}_{startTime}
// - 5 dakika sonra eski lock'lar overwrite edilebilir
```

### 4. Admin Access - 2FA Kontrolü

#### Test 4.1: Admin Custom Claims
```javascript
// Firebase Console'da kontrol edin:

// 1. Authentication → Users'a gidin
// 2. Admin kullanıcıları bulun
// 3. Custom claims'i kontrol edin

// ✅ BEKLENEN SONUÇ:
{
  "admin": true
}

// 4. Firestore Rules'da email fallback kaldırıldığından emin olun
// isSuperAdmin() fonksiyonu sadece token.admin kontrolü yapmalı
```

#### Test 4.2: 2FA Durumu
```
Firebase Console → Authentication → Sign-in method → Advanced → Multi-factor authentication

✅ YAPILACAK:
- "Require multi-factor authentication for your project" → Enabled
- Veya her admin kullanıcı için individual 2FA açın
```

## 📊 Test Sonuçları Tablosu

| Test | Durum | Sonuç | Notlar |
|------|-------|-------|--------|
| 1.1 - Reservations yetkisiz update | ⬜ | | |
| 1.2 - Subscriptions manipülasyonu | ⬜ | | |
| 1.3 - Rakip customers okuma | ⬜ | | |
| 2.1 - Client-side fiyat değiştirme | ⬜ | | |
| 2.2 - Network request manipülasyonu | ⬜ | | |
| 3.1 - Eşzamanlı rezervasyon | ⬜ | | |
| 3.2 - Lock timeout | ⬜ | | |
| 4.1 - Admin custom claims | ⬜ | | |
| 4.2 - 2FA durumu | ⬜ | | |

## 🚀 Test Sonrası Deploy

Tüm testler başarılı olduktan sonra:

```bash
# 1. Firestore Rules
firebase deploy --only firestore:rules

# 2. Hosting
npm run build
vercel --prod

# 3. Functions (eğer güncellenmişse)
cd functions
npm run build
firebase deploy --only functions
```

## 📝 Test Raporlama

Her test için sonuçları kaydedin:
- ✅ BAŞARILI: Beklenen hata/sonuç alındı
- ❌ BAŞARISIZ: Hata alınmadı veya yanlış davranış
- ⚠️ KISMİ: Bazı senaryolarda çalışıyor

Başarısız testler varsa `KRITIK_GUVENLIK_DUZELTMELERI.md` dosyasını kontrol edin.
