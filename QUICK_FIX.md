# Quick Fix - Subscription Permission Error

## Sorun
Firestore rules salon dokümanının `ownerId` field'ını kontrol ediyor ama bu field yok veya yanlış.

## Hızlı Çözüm

### Adım 1: Kullanıcının UID'sini Bul
1. Firebase Console: https://console.firebase.google.com/project/ruloposs/authentication/users
2. Giriş yaptığın email'i bul
3. UID'yi kopyala (örn: `abc123xyz`)

### Adım 2: Salon Dokümanını Kontrol Et
1. Firebase Console: https://console.firebase.google.com/project/ruloposs/firestore/data/salons/DLbNzdU5yGTaA1xiSACC
2. Dokümanı aç
3. `ownerId` field'ını kontrol et:
   - **Varsa:** Değeri kullanıcının UID'si ile eşleşiyor mu?
   - **Yoksa:** Eklemen gerekiyor

### Adım 3: ownerId Field'ını Ekle/Düzelt
1. Salon dokümanında "Add field" veya "Edit" butonuna tıkla
2. Field name: `ownerId`
3. Type: `string`
4. Value: `[Kullanıcının UID'si]` (Adım 1'den kopyaladığın)
5. Save

### Adım 4: Test Et
1. Tarayıcıyı yenile
2. Subscription satın almayı dene
3. Console'da hata olmamalı

## Alternatif: Browser Console'dan Hızlı Fix

Tarayıcının console'ına şunu yapıştır (UID'yi kendi UID'inle değiştir):

```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// UID'ni buraya yaz
const YOUR_UID = 'BURAYA_KENDI_UID_NI_YAZ';

// Salon dokümanını güncelle
await updateDoc(doc(db, 'salons', 'DLbNzdU5yGTaA1xiSACC'), {
  ownerId: YOUR_UID
});

console.log('✅ Salon ownerId güncellendi!');
```

## Doğrulama

Düzeltme sonrası kontrol et:
- [ ] Salon dokümanında `ownerId` field'ı var
- [ ] `ownerId` değeri kullanıcının UID'si ile eşleşiyor
- [ ] Subscription satın alma çalışıyor
- [ ] Console'da permission hatası yok

## Neden Bu Sorun Oluştu?

Muhtemelen salon oluşturulurken `ownerId` field'ı eklenmemiş. Yeni salonlar için bu field otomatik eklenmeli. Salon oluşturma kodunu kontrol etmek gerekebilir.
