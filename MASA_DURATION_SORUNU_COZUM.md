# 🍽️ MASA DURATION SORUNU - ÇÖZÜM

## 🔴 SORUN
**Müşteri 17:00'a rezervasyon yapıyor ama 15:30, 16:00, 16:30 gibi önceki saatler de kilitleniyor!**

### Neden Oluyor?
- Masa duration: **120 dakika (2 saat)**
- Müşteri 17:00 seçiyor → Sistem 17:00-19:00 arası rezerve ediyor ✅
- Slot kontrolü çakışma hesaplıyor:
  - **15:30 slot**: 15:30'dan başlar + 120dk = **17:30**'a kadar → 17:00 ile ÇAKIŞIYOR ❌
  - **16:00 slot**: 16:00'dan başlar + 120dk = **18:00**'e kadar → 17:00 ile ÇAKIŞIYOR ❌
  - **16:30 slot**: 16:30'dan başlar + 120dk = **18:30**'a kadar → 17:00 ile ÇAKIŞIYOR ❌

## ✅ ÇÖZÜM
Duration'ı **120 dakikadan → 90 dakikaya** düşürdüm (1.5 saat - restoran standart)

### Yeni Mantık:
- Müşteri 17:00 seçiyor → Sistem 17:00-18:30 arası rezerve ediyor ✅
- Slot kontrolü:
  - **15:30 slot**: 15:30 + 90dk = **17:00**'a kadar → ÇAKIŞMIYOR ✅
  - **16:00 slot**: 16:00 + 90dk = **17:30**'a kadar → Hafif çakışıyor ⚠️
  - **16:30 slot**: 16:30 + 90dk = **18:00**'e kadar → 17:00 ile ÇAKIŞIYOR ❌
  - **17:00 slot**: 17:00 + 90dk = **18:30**'a kadar → DOLU 🔴
  - **18:30 slot**: 18:30 + 90dk = **20:00**'e kadar → ÇAKIŞMIYOR ✅

## 🛠️ YAPILMASI GEREKENLER

### 1️⃣ Mevcut Masaları Güncelle

**YÖNTEM 1 - Chrome Console (Önerilen):**
1. Restoran owner paneline git
2. `F12` → Console
3. `MASA_DURATION_GUNCELLE.js` dosyasını aç, içeriği kopyala
4. Console'a yapıştır ve Enter
5. "✅ ... güncellendi" mesajlarını bekle
6. Sayfayı yenile (F5)

**YÖNTEM 2 - Manuel:**
- Her masayı Düzenle → Duration'ı manuel 90'a çek → Kaydet

### 2️⃣ Test Et
1. Development server yeniden başlat:
   ```bash
   # Terminal'de Ctrl+C
   npm run dev
   ```

2. Browser'da Hard Refresh:
   - `Ctrl + Shift + R` veya `Ctrl + F5`

3. Rezervasyon yap:
   - Masa 1'e 17:00 rezervasyonu yap
   - Onaylandıktan sonra tekrar aynı masaya bak
   - **15:30, 16:00** → Artık AÇIK olmalı ✅
   - **16:30** → Hala kilitli (çakışma var) ⚠️
   - **17:00, 17:30, 18:00** → DOLU 🔴
   - **18:30, 19:00** → AÇIK ✅

## 📊 DURATION SEÇENEKLERİ

### Restoran Standartları:
- **60 dakika**: Hızlı servis restoranlar (fast food, kahvaltı)
- **90 dakika**: Normal restoranlar (önerilen) ✅
- **120 dakika**: Fine dining, özel akşam yemekleri
- **150+ dakika**: VIP, kurs menü

### Önerim:
- **Genel masalar**: 90 dakika
- **VIP masalar**: 120 dakika (ayrı kategori oluştur)

## 🔧 İLERİYE YÖNELİK

### Dinamik Duration (Gelecek özellik):
```typescript
// Her masa için ayrı duration
{
  tableNumber: '1',
  capacity: 4,
  reservationDuration: 90, // Normal masa
}

{
  tableNumber: 'VIP-1',
  capacity: 6,
  reservationDuration: 120, // VIP masa
}
```

## 📝 YAPILAN DEĞİŞİKLİKLER

1. **`src/services/restaurantService.ts`** (Line 205):
   ```typescript
   // ÖNCE:
   duration: 120, // 2 saat
   
   // SONRA:
   duration: 90, // 1.5 saat (restoran standart)
   ```

2. **Oluşturulan Dosyalar**:
   - `src/scripts/updateTableDuration.ts` - TypeScript migration script
   - `MASA_DURATION_GUNCELLE.js` - Console komutu
   - `MASA_DURATION_SORUNU_COZUM.md` - Bu doküman

## ✅ KONTROL LİSTESİ

- [x] Duration 90'a düşürüldü
- [ ] Mevcut masalar güncellendi (console script çalıştır)
- [ ] Development server restart edildi
- [ ] Browser hard refresh yapıldı
- [ ] Test rezervasyonu yapıldı
- [ ] Slot kontrolü doğrulandı

---

**SON DURUM**: Duration 120dk → 90dk'ya düşürüldü. Şimdi mevcut masaları güncellemen gerekiyor!
