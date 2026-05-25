# Çalışma Saatleri ve Randevu Sistemi Debug

## Sorunlar

1. ❌ Çalışma saatleri kaydedilmiyor - refresh sonrası geri dönüyor
2. ❌ Randevu sistemi toggle çalışmıyor - aktif/deaktif yapılamıyor

## Debug Logları Eklendi

### WorkingHoursEditor.tsx
```typescript
const handleSave = async () => {
  setLoading(true);
  setSaved(false);
  try {
    const normalizedHours: WorkingHours = {};
    DAYS.forEach(day => {
      const dayHours = hours[day.key] || { open: '09:00', close: '21:30', isOpen: true };
      normalizedHours[day.key] = {
        open: dayHours.open || '09:00',
        close: dayHours.close || '21:30',
        isOpen: dayHours.isOpen !== undefined ? dayHours.isOpen : true,
      };
    });
    
    console.log('Saving working hours:', normalizedHours); // ✅ LOG
    await onSave(normalizedHours);
    console.log('Working hours saved successfully'); // ✅ LOG
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  } catch (error) {
    console.error('Error saving working hours:', error); // ✅ LOG
    alert('Hata: Çalışma saatleri kaydedilemedi. Konsolu kontrol edin.'); // ✅ ALERT
  }
  setLoading(false);
};
```

### OwnerDashboard.tsx - handleSaveWorkingHours
```typescript
const handleSaveWorkingHours = async (hours: any) => {
  if (!salon) return;
  try {
    console.log('handleSaveWorkingHours called with:', hours); // ✅ LOG
    await salonsService.update(salon.id, { workingHours: hours });
    console.log('Working hours updated in Firestore, reloading data...'); // ✅ LOG
    await loadData();
    console.log('Data reloaded successfully'); // ✅ LOG
  } catch (error) {
    console.error('Error in handleSaveWorkingHours:', error); // ✅ LOG
    alert('Hata: Çalışma saatleri kaydedilemedi. Konsolu kontrol edin.'); // ✅ ALERT
  }
};
```

### OwnerDashboard.tsx - Booking Toggle
```typescript
<button
  onClick={async () => {
    try {
      const newStatus = !salon.isAcceptingBookings;
      console.log('Toggling booking status to:', newStatus); // ✅ LOG
      await salonsService.update(salon.id, { isAcceptingBookings: newStatus });
      console.log('Booking status updated, reloading data...'); // ✅ LOG
      await loadData();
      console.log('Data reloaded successfully'); // ✅ LOG
    } catch (error) {
      console.error('Error toggling booking status:', error); // ✅ LOG
      alert('Hata: Randevu sistemi durumu değiştirilemedi. Konsolu kontrol edin.'); // ✅ ALERT
    }
  }}
>
```

## Test Adımları

### 1. Çalışma Saatlerini Test Et
1. Dashboard → Ayarlar → Çalışma Saatleri
2. Hızlı Ayar'dan saat seç (örn: 10:00 - 22:00)
3. "Tümüne Uygula" butonuna tıkla
4. "Değişiklikleri Kaydet" butonuna tıkla
5. **Browser Console'u aç (F12)** ve şu logları kontrol et:
   - `Saving working hours: {...}`
   - `handleSaveWorkingHours called with: {...}`
   - `Working hours updated in Firestore, reloading data...`
   - `Data reloaded successfully`
6. Eğer hata varsa console'da göreceksin
7. Eğer alert çıkarsa, hatanın detayı console'da

### 2. Randevu Sistemini Test Et
1. Dashboard → Ayarlar → Randevu Sistemi
2. Toggle butonuna tıkla (yeşil → gri veya gri → yeşil)
3. **Browser Console'u aç (F12)** ve şu logları kontrol et:
   - `Toggling booking status to: true/false`
   - `Booking status updated, reloading data...`
   - `Data reloaded successfully`
4. Eğer hata varsa console'da göreceksin
5. Eğer alert çıkarsa, hatanın detayı console'da

## Olası Sorunlar ve Çözümler

### Sorun 1: Firestore Permission Denied
**Belirti**: Console'da "permission-denied" hatası
**Çözüm**: Firestore rules kontrol edildi, salon owner'lar update yapabilir

### Sorun 2: salon.id undefined
**Belirti**: Console'da "Cannot read property 'id' of undefined"
**Çözüm**: `if (!salon) return;` kontrolü var

### Sorun 3: loadData() çalışmıyor
**Belirti**: Kaydetme başarılı ama UI güncellenmiyor
**Çözüm**: `await loadData()` çağrısı eklendi

### Sorun 4: State güncellenmiyor
**Belirti**: Firestore'da kayıt var ama UI'da görünmüyor
**Çözüm**: `setSalon(salonData)` ile state güncelleniyor

## Firestore Rules Kontrolü

```javascript
// Salon owners can write their own salon
allow write: if request.auth != null && 
                (resource == null || resource.data.ownerId == request.auth.uid);
```

✅ Rules doğru - salon owner'lar kendi salonlarını güncelleyebilir

## Deployment

**Production URL**: https://app-ruby-ten-20.vercel.app

**Debug Version**: ✅ Deployed with console logs

## Sonraki Adımlar

1. **Canlı sitede test et**
2. **Browser console'u aç (F12)**
3. **Çalışma saatlerini değiştir ve kaydet**
4. **Console loglarını kontrol et**
5. **Hata varsa screenshot al ve paylaş**

## Beklenen Console Çıktısı (Başarılı)

```
Saving working hours: {
  monday: { open: "10:00", close: "22:00", isOpen: true },
  tuesday: { open: "10:00", close: "22:00", isOpen: true },
  ...
}
handleSaveWorkingHours called with: { monday: {...}, ... }
Working hours updated in Firestore, reloading data...
Data reloaded successfully
```

## Beklenen Console Çıktısı (Hatalı)

```
Saving working hours: {...}
handleSaveWorkingHours called with: {...}
Error in handleSaveWorkingHours: FirebaseError: Missing or insufficient permissions
```

## Not

Eğer console'da hiçbir log görünmüyorsa:
- Butonlar çalışmıyor olabilir
- Event handler bağlanmamış olabilir
- JavaScript hatası var olabilir

Eğer loglar görünüyor ama hata varsa:
- Firestore permission sorunu
- Network sorunu
- Authentication sorunu

Lütfen test et ve console çıktısını paylaş! 🔍
