# Sıra (Queue) Sistemi İmplementasyonu

## 🎯 Genel Bakış

Müsait saat bulunamadığında müşterilerin sıraya girebildiği ve işletmenin bu müşterileri randevuya atayabildiği kapsamlı bir sıra sistemi.

---

## ✨ Özellikler

### Müşteri Tarafı

#### 1. Sıraya Eklenme
- **Tetikleyici**: Seçilen tarih/personel için müsait saat olmadığında
- **Konum**: Tüm rezervasyon wizard'larında (Randevu, Konaklama, vb.)
- **Görünüm**: Amber/turuncu gradient buton "Sıraya Ekle"

#### 2. Sıraya Ekle Modal
**Özellikler:**
- ✅ Mobil uyumlu (alt taraftan açılır)
- ✅ Desktop uyumlu (merkez modal)
- ✅ Seçili hizmetler listesi
- ✅ Tercih edilen tarih/saat (opsiyonel)
- ✅ Toplam süre ve fiyat
- ✅ İletişim bilgileri özeti
- ✅ Bilgilendirici açıklama

**Bilgilendirme:**
```
"Müsait saat olmadığında sıraya eklenebilirsiniz. 
İşletme uygun bir zaman bulduğunda sizi arayarak 
randevu oluşturacaktır."
```

#### 3. Sıra Durumu
- Müşteri sıraya eklendikten sonra `/appointments` sayfasına yönlendiriliyor
- Sıra pozisyonu gösteriliyor
- İşletme tarafından arandığında randevuya dönüşüyor

---

### İşletme Tarafı

#### 1. Modern Sıra Yönetimi Paneli
**Konum**: Owner Dashboard > Sıra Yönetimi

**Görünüm:**
- Grid layout (1 kolon mobil, 2 kolon desktop)
- Her kart için:
  - Sıra numarası (badge)
  - Müşteri adı ve telefon
  - Seçili hizmetler (badge'ler)
  - Tercih edilen tarih/saat (varsa)
  - Toplam süre ve fiyat
  - Müşteri notları
  - Aksiyon butonları

#### 2. Randevuya Atama Modal
**Özellikler:**
- ✅ Personel seçimi (grid layout)
- ✅ Tarih seçimi (date picker)
- ✅ Otomatik müsait saat yükleme
- ✅ Saat seçimi (grid layout)
- ✅ Gerçek zamanlı müsaitlik kontrolü
- ✅ Mobil uyumlu tasarım

**Akış:**
1. İşletme "Randevuya Ata" butonuna tıklar
2. Modal açılır
3. Personel seçer
4. Tarih seçer
5. Sistem o personelin o tarihteki müsait saatlerini gösterir
6. İşletme saat seçer
7. "Randevuya Ata" butonuna tıklar
8. Sıra kaydı silinir, randevu oluşturulur

#### 3. Diğer Aksiyonlar
- **Sıradan Çıkar**: X butonu ile hızlı çıkarma
- **Müşteriyi Değerlendir**: Yıldız sistemi (gelecek özellik)
- **Müşteriyi Engelle**: Ban sistemi (gelecek özellik)

---

## 🏗️ Teknik Mimari

### Yeni Componentler

#### 1. QueueJoinButton.tsx
**Amaç**: Müşterilerin sıraya eklenmesi için buton ve modal

**Props:**
```typescript
interface QueueJoinButtonProps {
  salon: Salon;
  selectedServices: Service[];
  selectedStaffId?: string | null;
  preferredDate?: string;
  preferredTime?: string;
  totalPrice: number;
  totalDuration: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNotes?: string;
  onSuccess?: () => void;
}
```

**Özellikler:**
- Framer Motion animasyonları
- Responsive tasarım
- Form validasyonu
- Loading states

#### 2. ModernQueueManager.tsx
**Amaç**: İşletme için modern sıra yönetim paneli

**Props:**
```typescript
interface ModernQueueManagerProps {
  salonId: string;
  staffId?: string;
  onRefresh?: () => void;
}
```

**Özellikler:**
- Grid layout
- Gerçek zamanlı veri
- Modal yönetimi
- Animasyonlar

#### 3. AssignToSlotModal (ModernQueueManager içinde)
**Amaç**: Sıradaki müşteriyi randevuya atama

**Özellikler:**
- Personel seçimi
- Tarih seçimi
- Otomatik slot yükleme
- Saat seçimi

---

### Güncellenmiş Servisler

#### firebaseService.ts

**Güncellenen Metodlar:**

1. **addToQueue()**
```typescript
// staffId artık opsiyonel
// customerEmail eklendi
// Sıra pozisyonu salon bazında hesaplanıyor
```

2. **assignQueueToSlot()**
```typescript
// staffId parametresi eklendi
// Atama sırasında personel değiştirilebilir
```

---

## 📱 Kullanım Senaryoları

### Senaryo 1: Randevu Rezervasyonu
1. Müşteri hizmet seçer
2. Personel seçer
3. Tarih seçer
4. **Müsait saat yok** → "Sıraya Ekle" butonu görünür
5. Müşteri sıraya eklenir
6. İşletme panelden görür
7. İşletme müsait zaman bulur
8. "Randevuya Ata" ile randevu oluşturur
9. Müşteri bilgilendirilir

### Senaryo 2: Konaklama Rezervasyonu
1. Müşteri giriş-çıkış tarihleri seçer
2. **Tüm odalar dolu** → "Sıraya Ekle" butonu görünür
3. Müşteri tercih ettiği oda ile sıraya eklenir
4. İşletme iptal olduğunda veya yeni oda eklendiğinde
5. Sıradaki müşteriyi arayıp rezervasyon yapar

---

## 🎨 Tasarım Detayları

### Renk Paleti
- **Sıra Butonu**: Amber/Orange/Yellow gradient
- **Randevuya Ata**: Emerald/Teal/Cyan gradient
- **Sıradan Çıkar**: Red tones
- **Sıra Pozisyonu**: Purple/Pink gradient

### Animasyonlar
- Modal: Bottom slide-up (mobil), fade-in (desktop)
- Kartlar: Staggered fade-in
- Butonlar: Scale on press
- Loading: Spin animation

### Responsive Breakpoints
- **Mobil**: < 640px (1 kolon, bottom modal)
- **Tablet**: 640px - 1024px (1 kolon)
- **Desktop**: > 1024px (2 kolon, center modal)

---

## 🔧 Konfigürasyon

### İşletme Ayarları
```typescript
salon.bookingSettings = {
  allowQueue: true, // Sıra sistemini aktif et
  autoConfirmQueue: false, // Otomatik randevuya çevirme (gelecek)
  // ... diğer ayarlar
}
```

### Sıra Sistemi Kontrolü
```typescript
// QueueJoinButton otomatik kontrol eder:
if (!salon.bookingSettings?.allowQueue) {
  return null; // Buton gösterilmez
}
```

---

## 📊 Veri Yapısı

### QueueEntry
```typescript
interface QueueEntry {
  id: string;
  salonId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: Service[];
  staffId?: string; // Opsiyonel
  preferredDate?: string;
  preferredTime?: string;
  queuePosition: number;
  totalPrice: number;
  totalDuration: number;
  notes: string;
  notified: boolean;
  createdAt: string;
}
```

---

## ✅ Test Checklist

### Müşteri Tarafı
- [ ] Müsait saat olmadığında buton görünüyor mu?
- [ ] Modal açılıyor mu?
- [ ] Bilgiler doğru gösteriliyor mu?
- [ ] Sıraya ekleme çalışıyor mu?
- [ ] Başarı mesajı gösteriliyor mu?
- [ ] Appointments sayfasına yönlendiriliyor mu?

### İşletme Tarafı
- [ ] Sıra listesi yükleniyor mu?
- [ ] Kartlar doğru görünüyor mu?
- [ ] Randevuya atama modali açılıyor mu?
- [ ] Personel seçimi çalışıyor mu?
- [ ] Tarih seçimi çalışıyor mu?
- [ ] Müsait saatler yükleniyor mu?
- [ ] Saat seçimi çalışıyor mu?
- [ ] Randevuya atama başarılı mı?
- [ ] Sıra kaydı siliniyor mu?

### Mobil Uyumluluk
- [ ] Modal alt taraftan açılıyor mu?
- [ ] Butonlar dokunulabilir mi?
- [ ] Scroll çalışıyor mu?
- [ ] Grid layout responsive mi?

---

## 🚀 Gelecek İyileştirmeler

1. **Otomatik Bildirim**
   - SMS/Email ile müşteri bilgilendirme
   - Push notification

2. **Akıllı Sıralama**
   - Öncelik sistemi (VIP müşteriler)
   - Bekleme süresi tahmini

3. **Otomatik Atama**
   - İptal olduğunda otomatik randevuya çevirme
   - Müşteri onayı ile

4. **İstatistikler**
   - Ortalama bekleme süresi
   - Sıradan randevuya dönüşüm oranı
   - En yoğun saatler

---

## 📝 Notlar

- Sıra sistemi tüm rezervasyon tiplerinde çalışır (Slot, Nightly, Project, vb.)
- İşletme ayarlarından aktif/pasif edilebilir
- Mobil öncelikli tasarım
- Performans optimize edilmiş (lazy loading, memoization)
- Accessibility uyumlu (ARIA labels, keyboard navigation)

---

## 🎉 Sonuç

Kapsamlı, kullanıcı dostu ve mobil uyumlu bir sıra sistemi başarıyla implemente edildi!
