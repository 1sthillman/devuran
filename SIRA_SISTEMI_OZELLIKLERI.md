# Sıra (Waitlist/Queue) Sistemi

## 🎯 Genel Bakış

Müşteriler müsait saat bulamadığında sıraya eklenebilir. İşletme sahipleri sıradaki müşterileri görüp uygun zamanda randevuya atayabilir.

---

## ✨ Müşteri Tarafı Özellikleri

### 1. Sıraya Eklenme
**Ne Zaman Görünür:**
- Seçilen tarih/personel için müsait saat olmadığında
- En az 1 hizmet seçilmişse
- Otomatik olarak "Sıraya Ekle" butonu görünür

**Buton Konumu:**
- "Bu tarihte müsait saat yok" mesajının altında
- Alternatif personel önerilerinin üstünde
- Turuncu/sarı gradient buton

**Sıraya Eklenirken:**
1. Seçili hizmetler gösterilir
2. Tercih edilen tarih/saat (opsiyonel) kaydedilir
3. Müşteri bilgileri (ad, telefon, email) alınır
4. Toplam tutar ve süre gösterilir
5. Notlar eklenebilir

**Modal Özellikleri:**
- Mobil uyumlu (alt taraftan açılır)
- Desktop'ta ortalanmış
- Animasyonlu açılma/kapanma
- Tüm bilgilerin özeti
- "Sıra Sistemi Nedir?" açıklaması

---

## 🏢 İşletme Tarafı Özellikleri

### 2. Modern Sıra Yönetimi (ModernQueueManager)

**Görünüm:**
- Grid layout (mobilde 1 kolon, desktop'ta 2 kolon)
- Her müşteri için kart görünümü
- Sıra numarası badge'i (sağ üst köşe)
- Animasyonlu giriş efektleri

**Müşteri Kartında:**
- 📱 Ad ve telefon
- 🎨 Seçili hizmetler (renkli badge'ler)
- 📅 Tercih edilen tarih/saat (varsa)
- ⏱️ Toplam süre ve fiyat
- 💬 Müşteri notları (varsa)
- 🎯 Sıra pozisyonu

**Aksiyon Butonları:**
1. **Randevuya Ata** (Yeşil) - Ana aksiyon
2. **Sıradan Çıkar** (Kırmızı) - İptal

### 3. Randevuya Atama Modalı

**Adım 1: Personel Seçimi**
- Aktif personeller grid'de gösterilir
- Fotoğraf ve unvan bilgisi
- Seçili personel vurgulanır

**Adım 2: Tarih Seçimi**
- Modern date picker
- Minimum bugünün tarihi
- Kolay seçim

**Adım 3: Saat Seçimi**
- Seçilen personel ve tarihe göre müsait saatler
- 3 kolonlu grid layout
- Müsait saatler otomatik yüklenir
- Seçili saat vurgulanır
- "Müsait saat yok" uyarısı

**Atama:**
- Tüm bilgiler doldurulunca aktif
- Loading state
- Başarı/hata mesajları
- Otomatik sıra listesi güncelleme

---

## 🎨 Tasarım Özellikleri

### Renkler
- **Sıra Butonu:** Amber/Orange/Yellow gradient
- **Atama Butonu:** Emerald/Teal/Cyan gradient
- **Sıra Kartları:** Purple/Pink gradient
- **Pozisyon Badge:** Purple/Pink gradient

### Animasyonlar
- Modal açılma: Alt taraftan yukarı (mobil)
- Kart girişi: Fade + slide up
- Buton hover: Shadow + scale
- Loading: Spin animation

### Responsive
- **Mobil:** 
  - Modal tam ekran (alt taraftan)
  - Tek kolon liste
  - Touch-friendly butonlar
- **Desktop:**
  - Modal ortalanmış
  - 2 kolon grid
  - Hover efektleri

---

## 🔧 Teknik Detaylar

### Yeni Componentler
1. **QueueJoinButton.tsx**
   - Müşteri tarafı sıraya ekleme
   - Modal yönetimi
   - Form validasyonu

2. **ModernQueueManager.tsx**
   - İşletme tarafı sıra yönetimi
   - Randevuya atama modalı
   - Personel ve slot seçimi

### Servisler
- `appointmentsService.addToQueue()` - Sıraya ekleme
- `appointmentsService.getQueue()` - Sıra listesi
- `appointmentsService.assignQueueToSlot()` - Randevuya atama
- `appointmentsService.removeFromQueue()` - Sıradan çıkarma

### Veri Yapısı (QueueEntry)
```typescript
{
  id: string;
  salonId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  services: Service[];
  staffId?: string;
  preferredDate?: string;
  preferredTime?: string;
  queuePosition: number;
  totalPrice: number;
  totalDuration: number;
  notes: string;
  createdAt: Date;
}
```

---

## 📱 Kullanım Senaryoları

### Senaryo 1: Müşteri Sıraya Eklenir
1. Müşteri hizmet seçer
2. Personel seçer
3. Tarih seçer
4. Müsait saat yok
5. "Sıraya Ekle" butonuna tıklar
6. Bilgilerini girer
7. Sıraya eklenir
8. Bildirim alır

### Senaryo 2: İşletme Randevuya Atar
1. İşletme sıra listesini görür
2. Müşteri kartına tıklar
3. "Randevuya Ata" butonuna tıklar
4. Personel seçer
5. Tarih seçer
6. Müsait saat seçer
7. Atar
8. Müşteri bildirim alır

### Senaryo 3: Alternatif Personel Bulunur
1. Müşteri sıraya eklenmek üzere
2. Sistem alternatif personel önerir
3. Müşteri alternatif personeli seçer
4. Müsait saatler yüklenir
5. Direkt randevu oluşturur

---

## ✅ Avantajlar

**Müşteri İçin:**
- ✅ Müsait saat olmasa bile rezervasyon yapabilir
- ✅ Tercih edilen zaman belirtebilir
- ✅ İşletme aradığında hazır
- ✅ Randevu kaçırma riski azalır

**İşletme İçin:**
- ✅ Potansiyel müşteri kaybı önlenir
- ✅ İptal/no-show durumlarında hızlıca doldurulur
- ✅ Müşteri talebini görebilir
- ✅ Planlama yapabilir
- ✅ Gelir kaybı azalır

---

## 🚀 Gelecek İyileştirmeler

1. **Otomatik Atama:** İptal olunca sıradaki ilk müşteriye otomatik SMS
2. **Öncelik Sistemi:** VIP müşterilere öncelik
3. **Bildirimler:** SMS/Email bildirimleri
4. **İstatistikler:** Sıra analizi ve raporlar
5. **Akıllı Öneri:** En uygun tarih/saat önerisi
6. **Grup Sırası:** Birden fazla kişi için sıra

---

## 📊 Metrikler

**Takip Edilmesi Gerekenler:**
- Sıraya eklenen müşteri sayısı
- Randevuya atanan müşteri sayısı
- Ortalama bekleme süresi
- Sıradan çıkan müşteri oranı
- Dönüşüm oranı (sıra → randevu)

---

## 🎯 Sonuç

Sıra sistemi, müsait saat olmadığında müşteri kaybını önleyen ve işletmelere esneklik sağlayan güçlü bir özelliktir. Modern, mobil uyumlu ve kullanıcı dostu tasarımı ile hem müşteriler hem de işletmeler için değer yaratır.
