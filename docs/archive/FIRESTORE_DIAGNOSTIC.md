# 🔍 FIRESTORE DIAGNOSTIC REPORT

## Problem
Restoran müşteri rezervasyon yapamıyor - "Henüz Ürün Yok" hatası alıyor.

## Kritik Sorular

### 1. ST CAFE'nin gerçek salon ID'si nedir?
- URL'deki: `nkSO1R145VhqxiB0F7Tjr`
- Kontrol edilmesi gereken: Firestore Console → salons collection

### 2. ST CAFE'nin services field'ı var mı?
- Firestore Console'da salon document'ı aç
- `services` field'ı var mı?
- Array mi, object mi?
- Kaç eleman var?

### 3. ST CAFE category'si "restoran" mi?
- `category` field değeri nedir?

### 4. Services collection'ında ST CAFE'ye ait service var mı?
- Firestore Console → services collection
- Filter: `salonId == "nkSO1R145VhqxiB0F7Tjr"`
- Sonuç: Kaç document?

## Beklenen Senaryolar

### Senaryo 1: Legacy Restoran Pattern
```
salons/nkSO1R145VhqxiB0F7Tjr
  - category: "restoran"
  - services: [
      { id: "masa1", name: "Masa 1", ... },
      { id: "masa2", name: "Masa 2", ... }
    ]
```
**Çözüm**: Booking.tsx zaten bu pattern'i destekliyor, ama getById() field'ı kaybediyor olabilir

### Senaryo 2: Modern Pattern
```
services/masa1
  - salonId: "nkSO1R145VhqxiB0F7Tjr"
  - name: "Masa 1"
  - category: "restoran"
```
**Çözüm**: servicesService.getBySalon() bulmalı ama bulamıyor = ID mismatch

### Senaryo 3: Hybrid (Her İkisi de Var)
Her iki pattern de kullanılıyor olabilir

## Diagnostic Commands

### Chrome DevTools'da çalıştır:
```javascript
// Firestore'dan direkt oku
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const salonId = 'nkSO1R145VhqxiB0F7Tjr';
const docRef = doc(db, 'salons', salonId);
const docSnap = await getDoc(docRef);

console.log('Salon exists:', docSnap.exists());
console.log('Salon data:', docSnap.data());
console.log('Services field:', docSnap.data()?.services);
```

## Sonraki Adımlar

1. ✅ Firebase Console'da manuel kontrol
2. ⏳ Diagnostic tool çalıştır
3. ⏳ Gerçek data'ya göre kod düzelt
4. ⏳ Test et
