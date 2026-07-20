# 🐛 Debug Talimatları - Veri Tutarsızlığı

## Sorun
- **Genel Bakış**: 1 randevu, 1.050₺ gelir
- **Analitik**: 5 randevu, 0 TL gelir
- Veriler tutarsız!

## Debug Adımları

### 1. Tarayıcı Console'unu Aç
```
1. Uygulamayı aç (npm run dev)
2. F12 tuşuna bas
3. Console sekmesine git
4. Sayfayı yenile (F5)
```

### 2. Console'da Aranacak Loglar

#### Dashboard Logları
```
🔍 DEBUG - Dashboard Data:
Total reservations: X
Today date: YYYY-MM-DD
Reservations data: [...]
```

**Kontrol Edilecekler:**
- [ ] `Total reservations` sayısı kaç?
- [ ] `Today date` doğru mu?
- [ ] `Reservations data` array'inde kaç eleman var?
- [ ] Her rezervasyonun `businessId` aynı mı?
- [ ] `date` alanları dolu mu?
- [ ] `status` değerleri ne?
- [ ] `price` değerleri var mı?

#### Analytics Logları
```
🔍 DEBUG - Loading Analytics for salonId: XXX
📊 Reservations fetched: X
📋 Reservations data: [...]
📊 Converted to appointments: X
```

**Kontrol Edilecekler:**
- [ ] `salonId` doğru mu?
- [ ] `Reservations fetched` sayısı Dashboard ile aynı mı?
- [ ] `Reservations data` Dashboard ile aynı mı?
- [ ] `Converted to appointments` sayısı aynı mı?

### 3. Olası Sorunlar ve Çözümler

#### Sorun 1: Farklı businessId
**Belirti:** Dashboard'da X randevu, Analytics'te Y randevu
**Sebep:** Rezervasyonlar farklı businessId'lere ait
**Çözüm:** 
```javascript
// Console'da kontrol et:
reservations.forEach(r => console.log(r.businessId));
// Hepsi aynı olmalı!
```

#### Sorun 2: Tarih Formatı Yanlış
**Belirti:** "Today apps count: 0" ama rezervasyon var
**Sebep:** Tarih formatı uyuşmuyor
**Çözüm:**
```javascript
// Console'da kontrol et:
console.log('Today:', new Date().toISOString().split('T')[0]);
console.log('Reservation date:', reservation.date);
// Format: YYYY-MM-DD olmalı
```

#### Sorun 3: Status Filtresi
**Belirti:** Randevular sayılmıyor
**Sebep:** Status 'confirmed' veya 'pending' değil
**Çözüm:**
```javascript
// Console'da kontrol et:
reservations.forEach(r => console.log(r.status));
// 'confirmed', 'pending', 'completed' olmalı
```

#### Sorun 4: Price Hesaplama
**Belirti:** Gelir 0 TL gösteriyor
**Sebep:** Price alanı yanlış yerde
**Çözüm:**
```javascript
// Console'da kontrol et:
reservations.forEach(r => {
  console.log('Price:', r.pricing?.totalAmount || r.totalPrice);
});
// Sayı olmalı, undefined değil
```

### 4. Firestore Console Kontrolü

1. Firebase Console'a git: https://console.firebase.google.com
2. Projeyi seç: `ruloposs`
3. Firestore Database'e git
4. `reservations` collection'ını aç
5. STHILLMAN işletmesinin rezervasyonlarını bul

**Kontrol Edilecekler:**
- [ ] `businessId` alanı var mı?
- [ ] `businessId` değeri doğru mu?
- [ ] `date` alanı var mı? (veya eventDate, checkIn, deliveryDate)
- [ ] `status` alanı var mı?
- [ ] `pricing.totalAmount` veya `totalPrice` var mı?
- [ ] `services` array'i var mı?

### 5. Veri Yapısı Örnekleri

#### Doğru Rezervasyon Yapısı
```json
{
  "id": "res123",
  "businessId": "salon123",
  "businessName": "STHILLMAN",
  "userId": "user123",
  "userName": "Ahmet Yılmaz",
  "userPhone": "+905551234567",
  "date": "2024-05-24",
  "startTime": "14:00",
  "endTime": "15:00",
  "status": "confirmed",
  "pricing": {
    "totalAmount": 150
  },
  "services": [
    {
      "id": "service1",
      "name": "Saç Kesimi",
      "price": 150,
      "duration": 60
    }
  ],
  "createdAt": "2024-05-20T10:00:00Z"
}
```

#### Yanlış Rezervasyon Yapısı (Eksik Alanlar)
```json
{
  "id": "res123",
  // ❌ businessId yok!
  "salonId": "salon123",  // ❌ Yanlış alan adı
  "date": "24/05/2024",   // ❌ Yanlış format
  "status": "active",     // ❌ Yanlış status
  "price": "150 TL",      // ❌ String olmamalı
  // ❌ services yok!
}
```

### 6. Hızlı Test

Console'da şunu çalıştır:
```javascript
// Dashboard'da
console.log('Reservations:', reservations);
console.log('Today Apps:', todayApps);
console.log('Week Apps:', weekApps);
console.log('Monthly Revenue:', monthlyRevenue);

// Analytics'te
console.log('Analytics Data:', data);
console.log('Revenue:', data?.revenue);
console.log('Appointments:', data?.appointments);
```

### 7. Sonuç Raporu

Aşağıdaki bilgileri toplayın:

```
=== DEBUG RAPORU ===

Dashboard:
- Total reservations: ___
- Today apps: ___
- Week apps: ___
- Monthly revenue: ___

Analytics:
- Reservations fetched: ___
- Revenue (today): ___
- Revenue (month): ___
- Appointments (today): ___
- Appointments (month): ___

Firestore:
- businessId: ___
- Reservation count: ___
- Date format: ___
- Status values: ___
- Price field: ___

Sorun:
- [ ] businessId yanlış
- [ ] Tarih formatı yanlış
- [ ] Status filtresi yanlış
- [ ] Price hesaplama yanlış
- [ ] Başka: ___________
```

## Sonraki Adım

Debug loglarını topladıktan sonra:
1. Console çıktısını kopyala
2. Firestore'daki örnek bir rezervasyonu kopyala
3. Yukarıdaki raporu doldur
4. Sorunu belirle ve düzelt

## Hızlı Düzeltmeler

### Eğer businessId Yanlışsa
```typescript
// reservationService.ts'de kontrol et
where('businessId', '==', salonId)  // ✅ Doğru
where('salonId', '==', salonId)     // ❌ Yanlış
```

### Eğer Tarih Formatı Yanlışsa
```typescript
// Tarih karşılaştırması
const resDate = r.date || r.eventDate || r.checkIn || r.deliveryDate || '';
const isToday = resDate === todayStr;  // YYYY-MM-DD formatında olmalı
```

### Eğer Price Yanlışsa
```typescript
// Price çekme
const price = r.pricing?.totalAmount || r.totalPrice || 0;
```

### Eğer Status Yanlışsa
```typescript
// Status kontrolü
const isActive = r.status === 'confirmed' || r.status === 'pending';
const isCompleted = r.status === 'completed' || r.status === 'confirmed';
```
