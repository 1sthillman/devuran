# İşlevsellik Test Listesi

## Test Edilmesi Gerekenler

### 1. Hizmet Görüntüleme (SlotBookingWizard)
- [ ] Salon sayfasına git
- [ ] "Randevu Al" butonuna tıkla
- [ ] Hizmetler listesi görünüyor mu?
- [ ] **Sorun**: `salon.services` array'i boş olabilir
- [ ] **Çözüm**: Salon'a hizmet eklenmiş mi kontrol et

### 2. Randevu İptali (Appointments)
- [ ] Randevularım sayfasına git
- [ ] Aktif bir randevu var mı?
- [ ] "İptal Et" butonuna tıkla
- [ ] İptal dialog'u açılıyor mu?
- [ ] İptal nedeni gir ve onayla
- [ ] **Kod**: `appointmentsService.cancel()` ve `reservationService.cancelReservation()`

### 3. Randevu Oluşturma
- [ ] Tüm adımları tamamla
- [ ] "Randevu Oluştur" butonuna tıkla
- [ ] **Sorun**: `submitReservation()` hata verebilir
- [ ] Hata mesajı görünüyor mu?

## Olası Sorunlar

### Hizmetler Görünmüyor
**Neden**: 
- Salon'da hiç hizmet eklenmemiş olabilir
- `salon.services` array'i undefined olabilir
- Firebase'den hizmetler yüklenmemiş olabilir

**Çözüm**:
1. OwnerDashboard'dan salon'a hizmet ekle
2. `salon.services` kontrolü ekle
3. Boş array için fallback göster

### İptal Edilemiyor
**Neden**:
- `appointmentsService.cancel()` hata veriyor olabilir
- Firebase permissions sorunu olabilir
- Randevu ID'si yanlış olabilir

**Çözüm**:
1. Console'da hata mesajlarını kontrol et
2. Firebase rules'ı kontrol et
3. Error handling ekle

### Randevu Alınamıyor
**Neden**:
- `submitReservation()` eksik veri ile çağrılıyor olabilir
- Firebase'e yazma izni yok olabilir
- Validation hataları olabilir

**Çözüm**:
1. Tüm required field'ları kontrol et
2. Console'da hata mesajlarını oku
3. Better error messages ekle

## Acil Düzeltmeler

### 1. Salon Services Kontrolü
```typescript
// SlotBookingWizard.tsx içinde
if (!salon || !salon.services || salon.services.length === 0) {
  return (
    <div className="text-center py-8">
      <p>Bu salon henüz hizmet eklememiş.</p>
    </div>
  );
}
```

### 2. Cancel Error Handling
```typescript
// Appointments.tsx içinde
try {
  await appointmentsService.cancel(id, reason, 'customer');
  addToast('İptal edildi', 'success');
} catch (error) {
  console.error('Cancel error:', error);
  addToast(error.message, 'error');
}
```

### 3. Submit Error Handling
```typescript
// bookingStore.ts içinde submitReservation
try {
  const result = await reservationService.create(...);
  return result.id;
} catch (error) {
  console.error('Submit error:', error);
  set({ error: error.message });
  throw error;
}
```

## Test Adımları

1. **Hizmet Ekleme Testi**:
   - OwnerDashboard'a git
   - Salon seç
   - "Hizmet Ekle" butonuna tıkla
   - Hizmet bilgilerini gir
   - Kaydet
   - Randevu sayfasına git ve hizmetlerin göründüğünü kontrol et

2. **İptal Testi**:
   - Önce bir randevu oluştur
   - Randevularım sayfasına git
   - İptal Et'e tıkla
   - İptal nedenini gir
   - Onayla
   - Randevunun iptal edildiğini kontrol et

3. **Randevu Oluşturma Testi**:
   - Salon seç
   - Hizmet seç
   - Personel seç
   - Tarih/saat seç
   - İletişim bilgilerini gir
   - Randevu Oluştur'a tıkla
   - Success sayfasına yönlendirildiğini kontrol et
