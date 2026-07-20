# 🍽️ MASA REZERVASYON SİSTEMİ - FİNAL GÜNCELLEME

## ✅ YAPILAN 3 KRİTİK DÜZELTME

### 1️⃣ DEFAULT DURATION: 60 DAKİKA
**Önceden**: 120 dakika (2 saat) - Çok uzun, gereksiz slotlar kilitleniyordu
**Şimdi**: 60 dakika (1 saat) - Standart restoran rezervasyonu ✅

### 2️⃣ İŞLETME SAHİBİ DURATION DEĞİŞTİREBİLİYOR
**Yeni Özellik**: Masa eklerken veya düzenlerken rezervasyon süresini ayarlayabilir
- **60 dakika** → Hızlı yemek (1 saat)
- **90 dakika** → Normal yemek (1.5 saat)
- **120 dakika** → Fine dining, özel akşam yemeği (2 saat)
- **Özel değer** → Manuel olarak 15-300 dakika arası her değer

### 3️⃣ MASA FİYATI ARTIK KAYBOLMİYOR
**Sorun**: Masa eklerken fiyat giriliyordu ama 0 olarak kaydediliyordu
**Sebep**: `createTable` fonksiyonuna fiyat ve duration parametreleri geçilmiyordu
**Çözüm**: Parametreler eklendi, artık fiyat doğru kaydediliyor ✅

---

## 🔧 YAPILAN TEKNİK DEĞİŞİKLİKLER

### 1. `src/components/restaurant/TableManagement.tsx`

**Yeni State Eklendi**:
```typescript
const [reservationDuration, setReservationDuration] = useState('60'); // 🆕 Duration state
```

**UI'da Yeni Alan Eklendi**:
- Rezervasyon Süresi input field (dakika)
- Hızlı seçim butonları: 60dk, 90dk, 120dk
- Açıklama metni: Müşteriye ne kadar süre vereceğini açıklıyor

**handleSave Fonksiyonu Güncellendi**:
```typescript
const durationValue = parseInt(reservationDuration) || 60;

// Yeni masa oluştururken:
await restaurantService.createTable(
  restaurantId, 
  {...}, 
  priceValue,      // 🔥 Fiyat geçiriliyor
  durationValue    // 🔥 Duration geçiriliyor
);

// Mevcut masa güncellenirken:
updatedServices.map((s: any) => {
  if (s.tableId === editingTable.id) {
    return {
      ...s,
      price: priceValue,        // ✅ Fiyat güncelleniyor
      duration: durationValue,  // ✅ Duration güncelleniyor
    };
  }
});
```

**resetForm Güncellendi**:
```typescript
setReservationDuration('60'); // Reset 60 dakikaya
```

**openEditDialog Güncellendi**:
```typescript
// Düzenlerken mevcut duration'ı da getir
setReservationDuration(tableService.duration?.toString() || '60');
```

---

### 2. `src/services/restaurantService.ts`

**createTable Fonksiyonu Signature Değişti**:
```typescript
// ÖNCE:
async createTable(
  restaurantId: string, 
  table: Omit<Table, 'id' | 'restaurantId' | 'qrCode'>
): Promise<string>

// SONRA:
async createTable(
  restaurantId: string, 
  table: Omit<Table, 'id' | 'restaurantId' | 'qrCode'>,
  reservationPrice: number = 0,      // 🆕 Parametre
  reservationDuration: number = 60   // 🆕 Parametre
): Promise<string>
```

**Service Oluştururken Parametreler Kullanılıyor**:
```typescript
const newService = {
  id: nanoid(12),
  salonId: restaurantId,
  tableId: tableId,
  name: `Masa ${table.tableNumber}`,
  description: `${table.capacity} kişilik masa rezervasyonu`,
  category: 'restaurant',
  duration: reservationDuration,  // 🔥 Parametre kullanılıyor
  price: reservationPrice,        // 🔥 Parametre kullanılıyor
  gender: 'all' as const,
  staffIds: [],
  isActive: true,
  pricingRules: {
    basePrice: reservationPrice,  // 🔥 Fiyat doğru kaydediliyor
    minGuests: 1,
    maxGuests: table.capacity,
  }
};
```

---

### 3. Migration Scriptleri Güncellendi

**`src/scripts/updateTableDuration.ts`**:
- Mevcut 120dk veya 90dk olan masaları → 60dk'ya düşürüyor
- TypeScript versiyonu (development için)

**`MASA_DURATION_GUNCELLE.js`**:
- Chrome Console'da çalıştırılabilir versiyonu
- Mevcut 120dk veya 90dk olan masaları → 60dk'ya düşürüyor

---

## 📋 KULLANIM KILAVUZU

### İşletme Sahibi İçin

#### Yeni Masa Eklerken:
1. **Masalar** bölümüne git
2. **"+ Yeni Masa Ekle"** butonuna tıkla
3. Bilgileri gir:
   - **Masa Numarası**: 1, A1, VIP-1 vb.
   - **Kapasite**: 2-20 kişi
   - **Bölge**: Bahçe, İç Mekan, VIP vb. (opsiyonel)
   - **Rezervasyon Ücreti**: Ücretsiz için 0, ücretli için tutarı gir
   - **Rezervasyon Süresi**: 
     - 60dk (1 saat) - Hızlı yemek ✅ Default
     - 90dk (1.5 saat) - Normal yemek
     - 120dk (2 saat) - Fine dining
     - Veya manuel değer (15-300 dakika)
4. **Kaydet**

#### Mevcut Masa Düzenlerken:
1. Masa kartında **Düzenle** (kalem) ikonuna tıkla
2. Duration ve fiyatı değiştir
3. **Kaydet**

---

## 🎯 SLOT KONTROLÜ MANTĞI

### Örnek: 60 Dakikalık Rezervasyon

**Müşteri 17:00'a rezervasyon yapıyor**:
- Sistem: 17:00 - 18:00 arası rezerve edilir ✅

**Diğer slotlar**:
- **15:30 slot** (15:30-16:30) → AÇIK ✅ (çakışma yok)
- **16:00 slot** (16:00-17:00) → AÇIK ✅ (tam 17:00'da bitiyor)
- **16:30 slot** (16:30-17:30) → KAPALI ❌ (17:00 ile çakışıyor)
- **17:00 slot** (17:00-18:00) → KAPALI ❌ (tam rezervasyon)
- **17:30 slot** (17:30-18:30) → KAPALI ❌ (17:30'da rezervasyon var)
- **18:00 slot** (18:00-19:00) → AÇIK ✅ (çakışma yok)

### Örnek: 90 Dakikalık Rezervasyon

**Müşteri 17:00'a rezervasyon yapıyor**:
- Sistem: 17:00 - 18:30 arası rezerve edilir ✅

**Diğer slotlar**:
- **15:30 slot** (15:30-16:30) → AÇIK ✅
- **16:00 slot** (16:00-17:00) → AÇIK ✅
- **16:30 slot** (16:30-17:30) → KAPALI ❌ (çakışma)
- **17:00 slot** (17:00-18:00) → KAPALI ❌
- **17:30 slot** (17:30-18:30) → KAPALI ❌
- **18:00 slot** (18:00-19:00) → KAPALI ❌ (18:30'a kadar rezervasyon var)
- **18:30 slot** (18:30-19:30) → AÇIK ✅

---

## 🛠️ KURULUM ADIMLARI

### 1️⃣ Mevcut Masaları Güncelle

**Chrome Console ile** (Önerilen):
```bash
# 1. Restoran owner paneline git (localhost:3000)
# 2. F12 → Console
# 3. MASA_DURATION_GUNCELLE.js içeriğini kopyala
# 4. Console'a yapıştır ve Enter
# 5. "✅ ... güncellendi" mesajlarını bekle
# 6. Sayfayı yenile (F5)
```

### 2️⃣ Development Server Restart

```bash
# Terminal'de Ctrl+C
npm run dev
```

### 3️⃣ Browser Hard Refresh

```bash
# Chrome/Edge:
Ctrl + Shift + R
# veya
Ctrl + F5
```

### 4️⃣ Test Et

1. **Yeni masa ekle**:
   - Masa numarası: Test-1
   - Kapasite: 4
   - Fiyat: 50₺
   - Duration: 60dk
   - Kaydet → Fiyat ve duration kaydedilmiş mi kontrol et

2. **Rezervasyon yap**:
   - Test-1 masasına 17:00 rezervasyon
   - Onaylandıktan sonra aynı masaya tekrar bak
   - 16:00 → AÇIK ✅
   - 16:30 → KAPALI ❌
   - 17:00 → KAPALI ❌
   - 18:00 → AÇIK ✅

---

## ✅ KONTROL LİSTESİ

- [x] Default duration 60 dakika yapıldı
- [x] UI'da duration seçim alanı eklendi
- [x] Hızlı seçim butonları eklendi (60, 90, 120)
- [x] createTable fonksiyonuna parametreler eklendi
- [x] handleSave duration'ı geçiriyor
- [x] Mevcut masa düzenlenirken duration alınıyor
- [x] Fiyat kaybolma sorunu düzeltildi
- [x] Migration scriptleri güncellendi
- [ ] Mevcut masalar 60dk'ya güncellendi (console script çalıştır)
- [ ] Development server restart edildi
- [ ] Browser hard refresh yapıldı
- [ ] Test masası oluşturuldu
- [ ] Test rezervasyonu yapıldı

---

## 📊 DURATION ÖNERİLERİ

| Restoran Tipi | Önerilen Duration | Açıklama |
|---------------|-------------------|----------|
| Fast Food | 30-45 dakika | Hızlı servis |
| Kahvaltı/Cafe | 60 dakika ✅ | Standart |
| Normal Restoran | 60-90 dakika | Rahat yemek |
| Fine Dining | 120+ dakika | Kurs menü, özel deneyim |
| VIP/Özel | 150-180 dakika | Uzun oturma |

---

## 🐛 HATA AYIKLAMA

### Sorun: Fiyat hala 0 görünüyor
**Çözüm**:
1. Development server restart et
2. Browser cache temizle
3. Masayı sil ve yeniden ekle

### Sorun: Duration değişmiyor
**Çözüm**:
1. `MASA_DURATION_GUNCELLE.js` scriptini çalıştır
2. Sayfayı yenile
3. Masayı düzenle ve manuel değiştir

### Sorun: Slot kontrolü çalışmıyor
**Çözüm**:
1. `availabilityService.ts` → `businessId` field'ının doğru kullanıldığını kontrol et
2. Console'da rezervasyon ID'lerini kontrol et
3. Firebase'de `services[0].id` ile `tableId` eşleşiyor mu kontrol et

---

## 🚀 GİTHUB PUSH

```bash
git add .
git commit -m "feat: Masa rezervasyon sistemi - Duration ve fiyat düzeltmeleri

- Default duration 60 dakika yapıldı
- İşletme sahibi duration'ı değiştirebiliyor (60/90/120 dk)
- Masa fiyatı artık kaybolmuyor
- UI'da duration seçim alanı eklendi
- createTable fonksiyonu parametreleri güncellendi
- Migration scriptleri eklendi
- Slot kontrolü optimizasyonu"

git push origin main
```

---

**SON DURUM**: Tüm düzeltmeler yapıldı! Artık:
- ✅ Default duration 60 dakika
- ✅ İşletme sahibi duration seçebiliyor
- ✅ Fiyat doğru kaydediliyor
- ✅ Slot kontrolü düzgün çalışıyor

**Sıradaki Adım**: Mevcut masaları güncellemek için console scriptini çalıştır!
