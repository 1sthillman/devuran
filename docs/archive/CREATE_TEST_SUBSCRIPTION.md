# Test Aboneliği Oluşturma

## 🧪 Firestore Console'dan Test Aboneliği Oluştur

### Adım 1: Firestore Console'a Git
https://console.firebase.google.com/project/ruloposs/firestore/data

### Adım 2: `subscriptions` Koleksiyonu Oluştur
1. "Start collection" butonuna tıkla
2. Collection ID: `subscriptions`
3. Document ID: Auto-ID

### Adım 3: Test Verisi Ekle

```json
{
  "id": "AUTO_GENERATED_ID",
  "businessId": "SALON_ID_BURAYA",
  "businessName": "Test Salonu",
  "planType": "professional",
  "interval": "monthly",
  "status": "active",
  "startDate": "2024-05-24T00:00:00.000Z",
  "endDate": "2024-06-24T00:00:00.000Z",
  "price": 299,
  "currency": "TRY",
  "usage": {
    "staffCount": 5,
    "serviceCount": 15,
    "monthlyBookings": 87,
    "lastUpdated": "2024-05-24T10:00:00.000Z"
  },
  "createdAt": "2024-05-24T10:00:00.000Z",
  "updatedAt": "2024-05-24T10:00:00.000Z"
}
```

### Adım 4: businessId'yi Bul

#### Yöntem 1: User'dan Bul
1. Firestore'da `users` koleksiyonunu aç
2. Kendi kullanıcını bul
3. `salonId` alanını kopyala
4. Yukarıdaki JSON'da `SALON_ID_BURAYA` yerine yapıştır

#### Yöntem 2: Salons'dan Bul
1. Firestore'da `salons` koleksiyonunu aç
2. Kendi salonunu bul
3. Document ID'yi kopyala
4. Yukarıdaki JSON'da `SALON_ID_BURAYA` yerine yapıştır

### Adım 5: Kaydet ve Test Et
1. "Save" butonuna tıkla
2. Tarayıcıyı yenile (Ctrl+F5)
3. Dashboard'da abonelik bilgilerini gör

---

## 🚀 Alternatif: Browser Console'dan Oluştur

```javascript
// Browser Console'u aç (F12)
// Aşağıdaki kodu çalıştır:

import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

// Kendi salon ID'ni buraya yaz
const salonId = 'SALON_ID_BURAYA';

const now = new Date();
const endDate = new Date(now);
endDate.setDate(endDate.getDate() + 30); // 30 gün sonra

const subscription = {
  id: doc(collection(db, 'subscriptions')).id,
  businessId: salonId,
  businessName: 'Test Salonu',
  planType: 'professional',
  interval: 'monthly',
  status: 'active',
  startDate: now.toISOString(),
  endDate: endDate.toISOString(),
  price: 299,
  currency: 'TRY',
  usage: {
    staffCount: 5,
    serviceCount: 15,
    monthlyBookings: 87,
    lastUpdated: now.toISOString()
  },
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

await setDoc(doc(db, 'subscriptions', subscription.id), subscription);
console.log('✅ Test aboneliği oluşturuldu!', subscription);
```

---

## 📊 Beklenen Sonuç

Dashboard'da şunları görmelisin:
```
┌─────────────────────────────────┐
│  💼 Professional Plan           │
│  Aylık                 299₺/ay  │
├─────────────────────────────────┤
│  📅  Kalan Süre                 │
│      ╔═══════════════╗          │
│      ║   30 GÜN      ║          │
│      ║               ║          │
│      ║ Bitiş: 24 Haz ║          │
│      ╚═══════════════╝          │
├─────────────────────────────────┤
│  👥 Personel: 5 / 10            │
│  💼 Hizmet: 15 / 50             │
│  📅 Randevu: 87 / 500           │
└─────────────────────────────────┘
```

---

## 🔍 Sorun Giderme

### Hata: "Missing or insufficient permissions"
- Firestore rules'ı kontrol et
- `businessId` doğru mu?
- Kullanıcı giriş yapmış mı?

### Hata: "The query requires an index"
- Index'lerin hazır olmasını bekle (2-3 dakika)
- Firebase Console'da index durumunu kontrol et

### Abonelik Görünmüyor
- `businessId` doğru mu kontrol et
- Browser console'da hata var mı?
- Firestore'da kayıt var mı?

---

## ✅ Kontrol Listesi

- [ ] Firestore Console'a gittim
- [ ] `subscriptions` koleksiyonu oluşturdum
- [ ] Test verisi ekledim
- [ ] `businessId` doğru
- [ ] Kaydettim
- [ ] Tarayıcıyı yeniledim
- [ ] Abonelik bilgileri görünüyor
- [ ] Kalan gün sayısı doğru
- [ ] Kullanım istatistikleri görünüyor

---

**Not:** Index'ler hazır olana kadar (2-3 dakika) hata alabilirsin. Bu normaldir, bekle ve tekrar dene.
