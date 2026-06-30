# 🔧 Rezervasyon Sistemi Kapsamlı Düzeltme Planı

## 🚨 Kritik Sorunlar ve Çözümler

### 1. ❌ Slot Çakışması Kontrolü
**Sorun:** 21:30'da rezervasyon var ama yine 21:30'a alınabiliyor

**Çözüm:**
- ModernTimePicker'a businessId prop ekle
- selectedDate geldiğinde o gün için reservations çek
- Dolu saatleri disabled yap
- Availability service'i slot bazlı çağır

**Dosyalar:**
- `src/components/booking/ModernTimePicker.tsx`
- `src/services/availabilityService.ts`
- `src/components/booking/wizards/SlotBookingWizard.tsx`

---

### 2. ❌ Randevu Detaylarında Masa Bilgisi
**Sorun:** Restoran panelinde rezervasyon detaylarında masa bilgisi yok

**Çözüm:**
- WaiterPanel'e masa bilgisi göster (tableName, capacity)
- Reservation card'a restoran için özel section ekle
- tableId ile table bilgisini çek

**Dosyalar:**
- `src/components/restaurant/WaiterPanel.tsx`
- Reservation detail components

---

### 3. ❌ Çalışma Saatleri Uyumsuzluğu
**Sorun:** Catering 05:30 gibi saatler gösteriyor

**Sebep:** Gecelik categoriler için 00:00-05:00 slotları oluşturuluyor

**Çözüm:**
- Category bazlı kontrol ekle
- Restoran/kafe: 07:00-24:00 arası
- Diğer işletmeler: workingHours'a göre

**Dosyalar:**
- `src/components/booking/ModernTimePicker.tsx`
- `src/services/availabilityService.ts`

---

### 4. ❌ Masa Rezervasyon Fiyatı
**Sorun:** Her masaya ayrı fiyat girmek zor

**Çözüm:**
- Restoran ayarlarına "Rezervasyon Ücreti" alanı ekle
- Masalar otomatik bu fiyatı alsın (veya 0₺)
- TableManagement'ta ortak fiyat seçeneği

**Dosyalar:**
- `src/components/restaurant/TableManagement.tsx`
- `src/services/restaurantService.ts`

---

## 📝 Uygulama Sırası

1. ✅ Slot çakışması kontrolü (En kritik)
2. ✅ Randevu detaylarında masa bilgisi
3. ✅ Çalışma saatleri düzeltmesi
4. ✅ Masa fiyat sistemi

---

## 🔍 Test Senaryoları

### Slot Çakışması:
- [ ] 21:30'da rezervasyon oluştur
- [ ] Aynı gün 21:30'a yeni rezervasyon dene
- [ ] 21:30 disabled olmalı

### Masa Bilgisi:
- [ ] Masa 5'e rezervasyon yap
- [ ] Garson panelinde "Masa 5 - 4 kişilik" görmeli

### Çalışma Saatleri:
- [ ] Restoran 09:00-21:30 ise
- [ ] Sadece bu saatler görünmeli
- [ ] 05:30 gibi saatler olmamalı

### Masa Fiyatı:
- [ ] Rezervasyon ücreti 50₺ ayarla
- [ ] Tüm masalar 50₺ olmalı
- [ ] 0₺ için ücretsiz seçeneği

