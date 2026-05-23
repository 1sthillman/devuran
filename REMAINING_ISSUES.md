# Kalan Sorunlar ve Çözümleri

## 🎨 Aydınlık Mod Yazı Renkleri

### Sorun
Wizard'larda `text-white` kullanımı aydınlık modda görünmüyor.

### Etkilenen Dosyalar
- `SlotBookingWizard.tsx` - 30+ kullanım
- `NightlyBookingWizard.tsx` - 25+ kullanım  
- `DailyRentalWizard.tsx` - 20+ kullanım
- `OrderBookingWizard.tsx` - 20+ kullanım
- `ProjectBookingWizard.tsx` - 25+ kullanım

### Çözüm
Tüm `text-white` → `text-[var(--chrome-white)]` değiştirilmeli.

**Kritik Yerler:**
1. Başlıklar (h3, h4, h5)
2. Input placeholder'lar
3. Buton metinleri
4. Icon renkleri
5. Span metinleri

### Manuel Değişiklik Gerekli
Çok fazla kullanım olduğu için toplu find-replace yapılabilir:
```bash
# Her wizard dosyasında
text-white → text-[var(--chrome-white)]
```

**İSTİSNALAR (değiştirilmemeli):**
- `className="text-white"` gradient butonlarda (zaten beyaz olmalı)
- `border-t-white` gibi border renkleri
- `bg-white` gibi background renkleri

---

## 📅 Takvim İleri Tarihe Geçiş

### Durum
✅ **ÇALIŞIYOR** - ModernCalendar.tsx'de `e.stopPropagation()` zaten var.

### Olası Sorun
Eğer hala çalışmıyorsa:
1. Parent container'da `pointer-events-none` var mı kontrol et
2. Z-index sorunu olabilir
3. Overlay başka bir element tarafından kapatılıyor olabilir

---

## 🔄 Modal Kapanma/Açılma Sorunu

### Sorun
Başlangıç/bitiş günü seçince modal kapanıyor, tekrar açılmıyor.

### Neden
`activeSubStep` state'i `null` oluyor ve tekrar açılmıyor.

### Çözüm
Her sub-step butonuna toggle mantığı ekle:

```tsx
onClick={(e) => {
  e.stopPropagation();
  setActiveSubStep(activeSubStep === 'checkIn' ? null : 'checkIn');
}}
```

**Durum:** ✅ Zaten var (NightlyBookingWizard'da)

---

## ➕➖ Yetişkin/Çocuk Butonları

### Sorun
+/- butonları çalışmıyor.

### Neden
`e.stopPropagation()` eksik VEYA parent button'a tıklama propagate oluyor.

### Çözüm
✅ **ZATEN VAR** - NightlyBookingWizard.tsx'de:
```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    setGuests(g => ({ ...g, adults: g.adults + 1 }));
  }}
>
```

### Olası Sorun
Eğer hala çalışmıyorsa:
1. Parent container'ın `onClick` handler'ı override ediyor olabilir
2. `disabled` prop true olabilir
3. CSS `pointer-events: none` olabilir

---

## 🔍 Hizmetler Görünmüyor

### Sorun
Bazı işletmelerin hizmetleri görünmüyor.

### Kontrol Edilmesi Gerekenler

#### 1. Firebase'de Veri Var mı?
```javascript
// Firebase Console'da kontrol et:
// salons/{salonId}/services collection'ı
```

#### 2. servicesService.getBySalon() Çalışıyor mu?
```typescript
// SlotBookingWizard.tsx içinde:
const services = await servicesService.getBySalon(salon!.id);
console.log('Services:', services); // Debug için
```

#### 3. Salon.services Array'i Dolu mu?
```typescript
// SlotBookingWizard.tsx:
if (!salon.services || salon.services.length === 0) {
  // Hizmet yok mesajı göster
}
```

### Olası Nedenler

1. **Hizmet Eklenmemiş**
   - İşletme henüz hizmet eklememiş
   - Çözüm: İşletme panelinden hizmet ekle

2. **Firebase Query Hatası**
   - `servicesService.getBySalon()` hata veriyor
   - Çözüm: Console'da error loglarını kontrol et

3. **Yanlış salonId**
   - `salon.id` undefined veya yanlış
   - Çözüm: `console.log('Salon ID:', salon?.id)`

4. **İzin Sorunu**
   - Firestore rules hizmetleri okumaya izin vermiyor
   - Çözüm: Firestore rules'u kontrol et

### Debug Adımları

1. **Console Log Ekle:**
```typescript
useEffect(() => {
  console.log('Salon:', salon);
  console.log('Salon ID:', salon?.id);
  console.log('Salon Services:', salon?.services);
}, [salon]);
```

2. **Firebase Console'da Kontrol Et:**
   - Firestore → salons → {salonId} → services
   - En az 1 hizmet var mı?

3. **Network Tab'ı Kontrol Et:**
   - Chrome DevTools → Network
   - Firestore query'leri başarılı mı?

---

## 📱 Mobil Test Checklist

### Rezervasyon Yönetimi
- [x] Kartlar taşmıyor
- [x] Butonlar tıklanabiliyor
- [x] Yazılar okunabiliyor
- [x] Responsive layout çalışıyor

### Navigasyon
- [x] Oval tasarım
- [x] Tüm tab'lar görünüyor
- [x] Aktif tab belirgin
- [x] Fixed bottom positioning

### Wizard'lar
- [ ] Aydınlık modda yazılar görünüyor
- [x] Takvim çalışıyor
- [x] Misafir sayacı çalışıyor
- [ ] Hizmetler görünüyor

---

## 🚀 Öncelik Sırası

1. **YÜKSEK**: Aydınlık mod yazı renkleri (tüm wizard'lar)
2. **YÜKSEK**: Hizmetler görünmeme sorunu (Firebase kontrol)
3. **ORTA**: Modal açılma/kapanma (zaten çalışıyor olmalı)
4. **DÜŞÜK**: Misafir sayacı (zaten çalışıyor olmalı)

---

## 💡 Hızlı Çözümler

### Aydınlık Mod için Toplu Değişiklik
```bash
# Her wizard dosyasında find-replace:
Find: text-white
Replace: text-[var(--chrome-white)]

# Dikkat: Sadece className içinde değiştir!
# border-white, bg-white gibi yerleri değiştirme
```

### Hizmetler için Debug
```typescript
// SlotBookingWizard.tsx'e ekle:
useEffect(() => {
  if (salon) {
    console.log('=== SALON DEBUG ===');
    console.log('Salon ID:', salon.id);
    console.log('Salon Name:', salon.name);
    console.log('Salon Services:', salon.services);
    console.log('Services Length:', salon.services?.length || 0);
    console.log('==================');
  }
}, [salon]);
```

### Test için Örnek Hizmet Ekle
```typescript
// Firebase Console'da manuel ekle:
{
  id: "test-service-1",
  name: "Test Hizmeti",
  price: 100,
  duration: 30,
  category: "Saç",
  isActive: true,
  salonId: "{SALON_ID}"
}
```
