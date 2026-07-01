# 🧪 Rezervasyon Gösterimi Test Senaryoları

## 📋 TEST ADIMLARI

### 1️⃣ Test Verisi Oluşturma (Firebase Console)

**Rezervasyon Koleksiyonu**: `reservations`

#### Test Rezervasyonu Ekle:
```json
{
  "salonId": "YOUR_RESTAURANT_ID",
  "type": "slot",
  "status": "confirmed",
  "date": "2026-07-01",
  "time": "14:30",
  "userName": "Test Müşteri",
  "userPhone": "+905551234567",
  "services": [
    {
      "name": "Masa 5",
      "pricingRules": {
        "maxGuests": 4
      }
    }
  ],
  "createdAt": "Firestore Timestamp (now)"
}
```

**NOT**: 
- `salonId` → Restoranınızın ID'si
- `date` → **Bugünün tarihi** (2026-07-01 formatında)
- `time` → **Şu andan 30-45 dakika sonrası** (örn: şimdi 14:00 ise, 14:30 girin)
- `services[0].name` → Mevcut bir masa adı (örn: "Masa 5")

---

### 2️⃣ Garson Panelini Aç

```
http://localhost:3000/restaurant/YOUR_RESTAURANT_ID/waiter
```

veya

Restoran Dashboard → "Garson Paneli" butonu

---

### 3️⃣ Beklenen Sonuç

#### ✅ Masa 5 Kartında Görmeli:

1. **Üstte Badge**
   ```
   📅 30 dk sonra
   ```
   - Mor-pembe gradient
   - Pulse animasyonu
   - Kayan pozisyon

2. **Ring Effect**
   - Masa kartının etrafında mor halka
   - 2px kalınlık
   - Offset ile boşluk

3. **Bilgi Kartı (Masa Boşken)**
   ```
   📅 Rezervasyon
   Test Müşteri
   14:30
   ```
   - Mor tonlarında
   - Kompakt tasarım
   - Masa durumu altında

---

## 🔍 TEST VARYASYONLARI

### Test 1: 30 Dakika Öncesi
```json
{
  "time": "14:30",  // Şu an: 14:00
  "date": "2026-07-01"
}
```
**Beklenen**: ✅ Gösterilir (30 dk < 60 dk)

---

### Test 2: 1 Saat Öncesi (Limit)
```json
{
  "time": "15:00",  // Şu an: 14:00
  "date": "2026-07-01"
}
```
**Beklenen**: ✅ Gösterilir (60 dk = limit)

---

### Test 3: 1 Saat 1 Dakika Öncesi
```json
{
  "time": "15:01",  // Şu an: 14:00
  "date": "2026-07-01"
}
```
**Beklenen**: ❌ Gösterilmez (61 dk > 60 dk)

---

### Test 4: Geçmiş Rezervasyon
```json
{
  "time": "12:00",  // Şu an: 14:00
  "date": "2026-07-01"
}
```
**Beklenen**: ❌ Gösterilmez (zaman geçmiş)

---

### Test 5: Yarınki Rezervasyon
```json
{
  "time": "14:30",
  "date": "2026-07-02"  // Bugün: 2026-07-01
}
```
**Beklenen**: ❌ Gösterilmez (yarın)

---

### Test 6: Masa Dolu + Rezervasyon Var
```json
// Rezervasyon
{
  "time": "20:00",  // Şu an: 19:45
  "date": "2026-07-01",
  "services": [{ "name": "Masa 3" }]
}

// Masa 3 durumu: "occupied"
```
**Beklenen**: ❌ Gösterilmez (masa dolu, sadece boş masalarda göster)

---

### Test 7: İptal Edilmiş Rezervasyon
```json
{
  "time": "14:30",
  "date": "2026-07-01",
  "status": "cancelled"  // ❌
}
```
**Beklenen**: ❌ Gösterilmez (aktif değil)

---

## 🎨 GÖRSEL TEST

### Masa Kartı Durumları

#### 1. Boş Masa + Rezervasyon YOK
```
┌─────────────┐
│      5      │
│   👥 4      │
│    Boş      │
└─────────────┘
```

#### 2. Boş Masa + Rezervasyon VAR (30dk önce)
```
   📅 30 dk sonra
┌─────────────┐ ← Mor ring
│      5      │
│   👥 4      │
│    Boş      │
├─────────────┤
│ 📅 Rezerv.  │
│Test Müşteri │
│   14:30     │
└─────────────┘
```

#### 3. Dolu Masa + Rezervasyon VAR
```
┌─────────────┐
│      5      │
│   👥 4      │
│    Dolu     │
├─────────────┤
│ Sipariş #12 │
│   450 ₺     │
└─────────────┘
```

---

## 🐛 HATA AYIKLAMA

### Sorun 1: Rezervasyon Görünmüyor

**Kontrol Listesi:**
- [ ] `date` bugünkü tarih mi? (2026-07-01)
- [ ] `time` şu andan 1 saat içinde mi?
- [ ] `status` = "confirmed" mi?
- [ ] `type` = "slot" mi?
- [ ] `salonId` = restaurant ID ile aynı mı?
- [ ] `services[0].name` = "Masa X" formatında mı?

**Console Log:**
```javascript
console.log('Rezervasyonlar:', reservations);
console.log('Masa:', table.tableNumber);
console.log('Eşleşen rez:', reservationInfo);
```

---

### Sorun 2: Zaman Hesabı Yanlış

**Debug:**
```typescript
const now = new Date();
console.log('Şu an:', now.toLocaleTimeString('tr-TR'));

const [hours, minutes] = '14:30'.split(':').map(Number);
const reservationTime = new Date();
reservationTime.setHours(hours, minutes, 0, 0);
console.log('Rezervasyon:', reservationTime.toLocaleTimeString('tr-TR'));

const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / 60000);
console.log('Kalan dakika:', minutesUntil);
```

---

### Sorun 3: Masa İsimleri Eşleşmiyor

**Kontrol:**
```typescript
// Rezervasyon
services[0].name = "Masa 5"  // ✅ Doğru
services[0].name = "Masa  5" // ❌ Ekstra boşluk
services[0].name = "5"       // ❌ "Masa" prefix yok

// Masa
table.tableNumber = "5"      // ✅ Match!
```

---

## 📊 PERFORMANS KONTROLÜ

### Browser DevTools → Network Tab

**Beklenen:**
- ✅ 1 Firestore listener (reservations)
- ✅ Real-time updates
- ❌ Tekrarlanan queries yok

### Console Logs

```javascript
// TableGrid.tsx - useEffect
📅 Rezervasyonlar güncellendi: 3

// Her render'da ÇALIŞMAMALI:
❌ Rezervasyon listener yeniden bağlandı (infinite loop)
```

---

## ✅ BAŞARILI TEST SONUÇU

### Garson Deneyimi:
1. ✅ Paneli açtım
2. ✅ Masa 5'te mor ring gördüm
3. ✅ "30 dk sonra" badge'i görünüyor
4. ✅ "Test Müşteri - 14:30" bilgisini gördüm
5. ✅ Masayı hazırladım
6. ✅ Müşteri geldiğinde masa hazırdı

---

## 🚀 PRODÜKSİYON ÖNCESİ

### Kontrol Listesi:
- [ ] Tüm test senaryoları başarılı
- [ ] Dark mode test edildi
- [ ] Mobil görünüm test edildi
- [ ] Performans kabul edilebilir (<100ms render)
- [ ] Console'da hata yok
- [ ] Network tab'de gereksiz query yok

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Console log'ları kontrol edin
2. Network tab'de Firestore query'lerini inceleyin
3. Rezervasyon verisini Firebase Console'dan kontrol edin
4. Masa isimlerinin eşleştiğinden emin olun
