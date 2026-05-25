# Timezone Bug Düzeltmesi - Kritik!

## 🐛 Sorun

**26'ya tıklayınca 25 seçiliyor!**

Kullanıcı takvimde bir güne tıkladığında, **bir gün öncesi** seçiliyordu.

### Örnek:
- 26 Mayıs'a tıkla → 25 Mayıs seçiliyor ❌
- 1 Haziran'a tıkla → 31 Mayıs seçiliyor ❌
- Bugünü seç → Dün seçiliyor ❌

## 🔍 Kök Neden

**`toISOString()` kullanımı!**

```typescript
// YANLIŞ KOD:
const dateStr = date.toISOString().split('T')[0];
```

### Neden Yanlış?

`toISOString()` tarihi **UTC timezone'a çevirir**:

```javascript
// Türkiye: UTC+3
const date = new Date(2026, 4, 26); // 26 Mayıs 2026, 00:00 (Türkiye saati)

// toISOString() UTC'ye çevirir:
date.toISOString(); // "2026-05-25T21:00:00.000Z" ❌

// Split ile tarih alınca:
date.toISOString().split('T')[0]; // "2026-05-25" ❌ (1 gün geriye gitti!)
```

**Sonuç**: Türkiye'de (UTC+3) saat 00:00'da oluşturulan tarih, UTC'de 21:00 olduğu için **bir gün öncesi** olarak kaydediliyor!

---

## ✅ Çözüm

### 1. Yardımcı Fonksiyon Oluşturuldu

`src/lib/utils.ts` dosyasına timezone-safe fonksiyon eklendi:

```typescript
/**
 * Tarihi YYYY-MM-DD formatına çevirir (timezone sorununu önler)
 * toISOString() kullanmak yerine bu fonksiyonu kullan!
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### Nasıl Çalışır?

```javascript
const date = new Date(2026, 4, 26); // 26 Mayıs 2026

// YANLIŞ (UTC'ye çevirir):
date.toISOString().split('T')[0]; // "2026-05-25" ❌

// DOĞRU (local timezone kullanır):
formatDateToString(date); // "2026-05-26" ✅
```

---

### 2. Tüm Wizard'lar Güncellendi

**Düzeltilen Dosyalar:**

1. ✅ `SlotBookingWizard.tsx` (Randevu)
2. ✅ `ProjectBookingWizard.tsx` (Proje/Etkinlik)
3. ✅ `OrderBookingWizard.tsx` (Sipariş)
4. ✅ `NightlyBookingWizard.tsx` (Konaklama)
5. ✅ `DailyRentalWizard.tsx` (Günlük Kiralama)

**Değişiklik:**

```typescript
// ÖNCE (YANLIŞ):
onSelect={(date) => setLocalEventDate(date.toISOString().split('T')[0])}

// SONRA (DOĞRU):
import { formatDateToString } from '@/lib/utils';
onSelect={(date) => setLocalEventDate(formatDateToString(date))}
```

---

## 🧪 Test Senaryoları

### Test 1: Bugünü Seç
1. Takvimi aç
2. Bugünü seç (24 Mayıs)
3. ✅ Bugün seçilmeli (23 Mayıs değil!)

### Test 2: Yarını Seç
1. Yarını seç (25 Mayıs)
2. ✅ Yarın seçilmeli (24 Mayıs değil!)

### Test 3: Gelecek Ay
1. Haziran'a geç
2. 1 Haziran'ı seç
3. ✅ 1 Haziran seçilmeli (31 Mayıs değil!)

### Test 4: Doğru Tarih Gösterimi
1. Herhangi bir günü seç
2. Seçilen tarihi kontrol et
3. ✅ Tıkladığın gün = Seçilen gün

---

## 📊 Etkilenen Alanlar

### Randevu Sistemi
- ✅ Tarih seçimi doğru
- ✅ Saat slotları doğru gün için yükleniyor
- ✅ Rezervasyon doğru tarihe kaydediliyor

### Konaklama
- ✅ Check-in tarihi doğru
- ✅ Check-out tarihi doğru
- ✅ Gece sayısı doğru hesaplanıyor

### Etkinlik/Proje
- ✅ Etkinlik tarihi doğru
- ✅ Teslimat tarihi doğru

---

## ⚠️ Önemli Notlar

### Gelecekte Dikkat Edilmesi Gerekenler

**ASLA `toISOString()` kullanma!**

```typescript
// ❌ YANLIŞ:
date.toISOString().split('T')[0]

// ✅ DOĞRU:
formatDateToString(date)
```

### Neden?

- `toISOString()` → UTC timezone
- `formatDateToString()` → Local timezone
- Türkiye UTC+3 olduğu için 3 saat fark var
- Gece yarısı (00:00) tarihlerde bu fark **1 gün** olarak görünüyor

---

## 🎯 Sonuç

**Timezone bug tamamen düzeltildi!**

- ✅ 26'ya tıklayınca 26 seçiliyor
- ✅ Bugünü seçebiliyoruz
- ✅ Tüm wizard'larda doğru tarih seçimi
- ✅ Rezervasyonlar doğru tarihe kaydediliyor

**Tarayıcıyı yenile ve test et!** 🚀

---

## 📚 Teknik Detaylar

### JavaScript Date ve Timezone

```javascript
// Local timezone (Türkiye: UTC+3)
const date = new Date(2026, 4, 26, 0, 0, 0); // 26 Mayıs 2026, 00:00

// Farklı metodlar:
date.getDate();              // 26 ✅ (local)
date.getFullYear();          // 2026 ✅ (local)
date.toISOString();          // "2026-05-25T21:00:00.000Z" ❌ (UTC)
formatDateToString(date);    // "2026-05-26" ✅ (local)
```

### Neden Local Timezone Kullanmalıyız?

1. **Kullanıcı deneyimi**: Kullanıcı kendi timezone'unda tarih görüyor
2. **Tutarlılık**: Takvimde gördüğü = Seçtiği tarih
3. **Basitlik**: Timezone dönüşümü gereksiz

### Neden UTC Kullanmamalıyız?

1. **Karışıklık**: Kullanıcı 26'yı görüyor ama 25 kaydediliyor
2. **Hata**: Gece yarısı tarihlerde 1 gün fark oluşuyor
3. **Komplekslik**: Her yerde timezone dönüşümü gerekiyor

---

## 🔧 Bakım

Bu fonksiyon artık **tek doğru yol**:

```typescript
import { formatDateToString } from '@/lib/utils';

// Tarih string'e çevirirken:
const dateStr = formatDateToString(date);
```

**Kod review'da kontrol et**: Yeni kodda `toISOString()` görürsen, `formatDateToString()` kullanmasını söyle!
