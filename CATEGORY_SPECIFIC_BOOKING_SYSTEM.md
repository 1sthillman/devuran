# Kategori Bazlı Randevu ve İşletme Yönetim Sistemi

## Mevcut Sorunlar

### 1. Terminoloji Sorunu
- **Sorun**: Kayıt sürecinde "Salon Oluştur" yazıyor
- **Etki**: Sadece berber/kuaför kategorilerine uygun
- **Çözüm**: "İşletme Oluştur" olarak değiştirilmeli

### 2. Mock Veri Problemi
- **Sorun**: Bungalov, otel, düğün organizasyonu gibi kategorilerde mock veriler kullanılıyor
- **Etki**: Gerçek randevu alınamıyor, sistem çalışmıyor
- **Çözüm**: Her kategori için gerçek veri yapısı oluşturulmalı

### 3. Hizmet Uyumsuzluğu
- **Sorun**: Tüm kategoriler "saç kesimi, fön, tırnak" gibi hizmetler görüyor
- **Etki**: Bungalov işletmesi saç kesimi hizmeti sunuyor (mantıksız)
- **Çözüm**: Her kategori kendi hizmet tiplerini görmeli

### 4. Randevu Sistemi Uyumsuzluğu
- **Sorun**: Sadece berber/kuaför için slot bazlı randevu sistemi var
- **Etki**: Diğer kategoriler için uygun randevu alma arayüzü yok
- **Çözüm**: Her kategori için özel randevu arayüzü tasarlanmalı

## Kategori Bazlı Randevu Tipleri

### Slot Bazlı (Saatlik Randevu)
**Kategoriler**: Kuaför, Berber, Güzellik, Tırnak, Fotoğraf
**Mevcut Durum**: ✅ Çalışıyor
**Özellikler**:
- Tarih + saat seçimi
- Personel seçimi
- Hizmet seçimi (çoklu)
- Süre hesaplama
- Sıra sistemi desteği


### Geceleme Bazlı (Check-in/Check-out)
**Kategoriler**: Bungalov, Otel, Villa, Kamp Alanı
**Mevcut Durum**: ❌ Mock veri, çalışmıyor
**Özellikler**:
- Giriş/çıkış tarihi seçimi
- Gece sayısı hesaplama
- Oda/ünite tipi seçimi
- Misafir sayısı (yetişkin/çocuk)
- Ek hizmetler (kahvaltı, spa, transfer)
- Özel istekler

### Proje Bazlı (Uzun Vadeli Planlama)
**Kategoriler**: Düğün Org., Nişan Org., Evlilik Teklifi, Doğum Günü, Kurumsal Etkinlik
**Mevcut Durum**: ❌ Mock veri, çalışmıyor
**Özellikler**:
- Etkinlik tarihi
- Misafir sayısı
- Paket seçimi (Ekonomik, Standart, Premium, Lüks)
- Ek hizmetler (fotoğraf, video, müzik, çiçek)
- Aşamalı süreç (görüşme, sözleşme, planlama, final)
- Ödeme planı (kapora, kalan ödeme)

### Kiralama Bazlı (Tam/Yarım Gün)
**Kategoriler**: Düğün Salonu, Etkinlik Alanı
**Mevcut Durum**: ❌ Mock veri, çalışmıyor
**Özellikler**:
- Tarih + saat aralığı
- Kapasite (kişi sayısı)
- Paket seçimi (Sadece mekan, Mekan+Catering, Full)
- Ek hizmetler (dekorasyon, ses sistemi, ışık)
- Hazırlık/toplama süresi
- Ödeme planı

### Sipariş Bazlı (Teslimat)
**Kategoriler**: Catering, Pasta & Tatlı, Kahve & İkram
**Mevcut Durum**: ❌ Mock veri, çalışmıyor
**Özellikler**:
- Teslimat tarihi + saati
- Teslimat adresi
- Etkinlik tipi
- Kişi sayısı
- Menü seçimi
- Ek ürünler
- Tadım randevusu (opsiyonel)

### Seans Bazlı (Çekim/Prodüksiyon)
**Kategoriler**: Video Prodüksiyon, Drone Çekim
**Mevcut Durum**: ❌ Mock veri, çalışmıyor
**Özellikler**:
- Tarih + saat
- Süre (saat)
- Çekim tipi (düğün, bebek, aile, ürün, dış mekan)
- Lokasyon (stüdyo, dış mekan, müşteri lokasyonu)
- Paket seçimi
- Ek hizmetler (ek saat, albüm, video klip)
- Yedek tarih (dış mekan için)


## Kategori Bazlı Hizmet Yapısı

### Güzellik & Bakım Kategorileri
**Kuaför**:
- Saç Kesimi (Kadın/Erkek/Çocuk)
- Saç Boyama (Röfle, Balyaj, Ombre, Tam Boya)
- Saç Bakımı (Keratin, Botox, Protein)
- Fön & Maşa
- Saç Uzatma
- Perma & Düzleştirme

**Berber**:
- Saç Kesimi
- Sakal Kesimi & Şekillendirme
- Ustura Tıraş
- Cilt Bakımı
- Kaş Düzenleme
- Bıyık Kesimi

**Güzellik Merkezi**:
- Cilt Bakımı (Klasik, Medikal, Anti-aging)
- Epilasyon (İpek, Ağda, Lazer)
- Masaj (İsveç, Aromaterapi, Taş, Refleksoloji)
- Makyaj (Günlük, Gece, Gelin)
- Kirpik (Lifting, Perma, Takma)
- Kaş (Laminasyon, Microblading)

**Tırnak Salonu**:
- Manikür (Klasik, Spa, Parafin)
- Pedikür (Klasik, Spa, Medikal)
- Protez Tırnak (Jel, Akrilik)
- Nail Art & Tasarım
- Kalıcı Oje
- Tırnak Tamiri


### Konaklama Kategorileri
**Bungalov**:
- Standart Bungalov (2 kişilik)
- Aile Bungalov (4 kişilik)
- Lüks Bungalov (jakuzi, şömine)
- Grup Bungalov (6-8 kişilik)
- Ek Hizmetler: Kahvaltı, Akşam Yemeği, Mangal, Bisiklet

**Otel**:
- Standart Oda (tek/çift kişilik)
- Superior Oda
- Deluxe Oda
- Junior Suite
- Suite
- Ek Hizmetler: Kahvaltı, Yarım Pansiyon, Tam Pansiyon, Her Şey Dahil, Spa, Havuz

**Villa**:
- Ekonomik Villa (2-4 kişi)
- Standart Villa (4-6 kişi)
- Lüks Villa (6-8 kişi, özel havuz)
- Ultra Lüks Villa (8-12 kişi, özel havuz, jakuzi, sauna)
- Ek Hizmetler: Temizlik, Aşçı, Havuz Bakımı, Transfer

**Kamp Alanı**:
- Çadır Alanı (kişi başı)
- Karavan Alanı (elektrik, su)
- Bungalow Çadır (hazır kurulu)
- Ek Hizmetler: Duş, WC, Elektrik, Mangal, Kamp Malzemesi Kiralama

### Etkinlik & Organizasyon Kategorileri
**Düğün Organizasyonu**:
- Ekonomik Paket (Temel organizasyon, 100-150 kişi)
- Standart Paket (Orta düzey, 150-250 kişi)
- Premium Paket (Lüks detaylar, 250-400 kişi)
- VIP Paket (Her şey dahil, 400+ kişi)
- Ek Hizmetler: Fotoğraf, Video, Müzik (DJ/Canlı), Çiçek, Davetiye, Nikah Şekeri

**Nişan Organizasyonu**:
- Mini Paket (50-75 kişi, ev/bahçe)
- Standart Paket (75-150 kişi, salon)
- Premium Paket (150-250 kişi, lüks mekan)
- Ek Hizmetler: Fotoğraf, Video, Müzik, Çiçek, İkram

**Evlilik Teklifi**:
- Romantik Paket (Restoran/Sahil)
- Sürpriz Paket (Özel mekan, dekorasyon)
- Lüks Paket (Helikopter, tekne, özel lokasyon)
- Ek Hizmetler: Fotoğraf, Video, Müzik, Çiçek, Işık Gösterisi

**Doğum Günü**:
- Çocuk Partisi (Animasyon, oyun, pasta)
- Yetişkin Partisi (Mekan, ikram, müzik)
- Sürpriz Parti (Organizasyon, dekorasyon)
- Ek Hizmetler: Animatör, Palyaço, Müzik, Pasta, Balon Süsleme

**Kurumsal Etkinlik**:
- Toplantı Organizasyonu
- Konferans & Seminer
- Lansman & Tanıtım
- Team Building
- Yılbaşı & Özel Günler
- Ek Hizmetler: Ses Sistemi, Projeksiyon, Catering, Fotoğraf, Video


### Mekan Kategorileri
**Düğün Salonu**:
- Sadece Mekan (Boş salon kiralama)
- Mekan + Catering (Yemek dahil)
- Full Paket (Dekorasyon, müzik, servis dahil)
- Kapasite: 100-1000 kişi
- Ek Hizmetler: Dekorasyon, Ses Sistemi, Işık Show, Vale, Güvenlik

**Etkinlik Alanı**:
- Toplantı Salonu (10-50 kişi)
- Konferans Salonu (50-200 kişi)
- Açık Alan (Bahçe, teras)
- Çok Amaçlı Salon
- Ek Hizmetler: Ses Sistemi, Projeksiyon, Catering, Dekorasyon

### Fotoğraf & Video Kategorileri
**Fotoğraf**:
- Düğün Çekimi (Gün boyu, albüm)
- Nişan/Söz Çekimi
- Bebek & Hamile Çekimi
- Aile Çekimi
- Bireysel Portre
- Ürün Çekimi (E-ticaret)
- Dış Mekan Çekimi
- Stüdyo Çekimi
- Paketler: Temel (2 saat, 50 fotoğraf), Standart (4 saat, 100 fotoğraf), Premium (8 saat, 200 fotoğraf, albüm)

**Video Prodüksiyon**:
- Düğün Videosu (Klip, belgesel)
- Tanıtım Filmi (Kurumsal)
- Reklam Çekimi
- Etkinlik Videosu
- Müzik Klibi
- Paketler: Temel (4 saat çekim, 5 dk klip), Standart (8 saat, 10 dk klip + belgesel), Premium (Full gün, 15 dk klip + belgesel + drone)

**Drone Çekim**:
- Düğün Drone Çekimi
- Gayrimenkul Çekimi
- Etkinlik Havadan Çekim
- Doğa & Manzara
- Tanıtım Filmi
- Paketler: Temel (30 dk, 10 fotoğraf + 2 dk video), Standart (1 saat, 20 fotoğraf + 5 dk video), Premium (2 saat, 40 fotoğraf + 10 dk video)

### Yemek & İkram Kategorileri
**Catering**:
- Açık Büfe (Soğuk/Sıcak)
- Oturmalı Yemek (Servis)
- Kokteyl İkramı
- Kahvaltı Organizasyonu
- Paketler: Kişi başı fiyatlandırma (Ekonomik: 150 TL, Standart: 250 TL, Premium: 400 TL, Lüks: 600+ TL)
- Ek Hizmetler: Servis Elemanı, Masa Düzeni, Dekorasyon

**Pasta & Tatlı**:
- Düğün Pastası (Kat sayısı, tasarım)
- Doğum Günü Pastası
- Özel Gün Pastası
- Cupcake & Mini Tatlılar
- Tatlı Masası (Candy Bar)
- Fiyatlandırma: Kilo/kişi bazlı

**Kahve & İkram**:
- Mobil Kahve Arabası
- Barista Hizmeti
- Özel Kahve İkramı
- Çay & Kahve Servisi
- Paketler: Saatlik (50 kişi: 1500 TL, 100 kişi: 2500 TL, 200 kişi: 4000 TL)


## Randevu Alma Arayüzü Tasarımları

### 1. Slot Bazlı Randevu (Kuaför, Berber, Güzellik, Tırnak)
**Mevcut Durum**: ✅ Çalışıyor, modern tasarım
**Akış**:
1. Hizmet seçimi (çoklu seçim, toplam süre gösterimi)
2. Personel seçimi (fotoğraf, uzmanlık, müsaitlik)
3. Tarih seçimi (takvim görünümü)
4. Saat seçimi (müsait slotlar)
5. İletişim bilgileri
6. Onay & Ödeme

**Tasarım Özellikleri**:
- Glassmorphism kartlar
- Gradient vurgular
- Smooth animasyonlar
- Mobil uyumlu
- Gerçek zamanlı müsaitlik kontrolü

### 2. Geceleme Bazlı Randevu (Bungalov, Otel, Villa, Kamp Alanı)
**Mevcut Durum**: ❌ Yok, oluşturulmalı
**Akış**:
1. Giriş/Çıkış tarihi seçimi (date range picker)
2. Misafir sayısı (yetişkin/çocuk)
3. Oda/Ünite tipi seçimi (fotoğraflar, özellikler, kapasite)
4. Ek hizmetler (checkbox: kahvaltı, spa, transfer)
5. Özel istekler (textarea)
6. İletişim bilgileri
7. Onay & Kapora ödemesi

**Tasarım Özellikleri**:
- Büyük tarih seçici (check-in/check-out)
- Oda kartları (fotoğraf galerisi, özellikler, fiyat)
- Gece sayısı ve toplam fiyat hesaplama (real-time)
- Müsaitlik takvimi (dolu/boş günler)
- Ek hizmetler toggle'ları
- Fiyat özeti sidebar (sticky)

**UI Bileşenleri**:
```typescript
<DateRangePicker 
  checkIn={checkIn}
  checkOut={checkOut}
  onChange={handleDateChange}
  unavailableDates={unavailableDates}
/>

<GuestSelector
  adults={adults}
  children={children}
  onChange={handleGuestChange}
/>

<RoomCard
  room={room}
  nights={nights}
  onSelect={handleRoomSelect}
  images={room.images}
  features={room.features}
  capacity={room.capacity}
/>

<ExtrasSelector
  extras={availableExtras}
  selected={selectedExtras}
  onChange={handleExtrasChange}
/>

<PriceSummary
  roomPrice={roomPrice}
  nights={nights}
  extras={selectedExtras}
  total={totalPrice}
/>
```


### 3. Proje Bazlı Randevu (Düğün Org., Etkinlikler)
**Mevcut Durum**: ❌ Yok, oluşturulmalı
**Akış**:
1. Etkinlik tipi seçimi (Düğün, Nişan, Doğum Günü)
2. Etkinlik tarihi
3. Misafir sayısı (slider: 50-1000)
4. Paket seçimi (Ekonomik, Standart, Premium, Lüks)
5. Ek hizmetler (fotoğraf, video, müzik, çiçek)
6. Ön görüşme tarihi seçimi
7. İletişim bilgileri
8. Onay & Kapora

**Tasarım Özellikleri**:
- Wizard/Step görünümü (progress bar)
- Paket karşılaştırma tablosu
- Ek hizmetler marketplace görünümü
- Fiyat hesaplayıcı (interaktif)
- Görüşme takvimi entegrasyonu

**UI Bileşenleri**:
```typescript
<EventTypeSelector
  types={['Düğün', 'Nişan', 'Doğum Günü', 'Kurumsal']}
  selected={eventType}
  onChange={handleEventTypeChange}
/>

<GuestCountSlider
  min={50}
  max={1000}
  step={10}
  value={guestCount}
  onChange={handleGuestCountChange}
/>

<PackageComparison
  packages={packages}
  selected={selectedPackage}
  onSelect={handlePackageSelect}
/>

<ExtrasMarketplace
  categories={['Fotoğraf', 'Video', 'Müzik', 'Çiçek', 'Davetiye']}
  items={extras}
  selected={selectedExtras}
  onChange={handleExtrasChange}
/>

<ConsultationScheduler
  availableSlots={consultationSlots}
  selected={consultationDate}
  onChange={handleConsultationChange}
/>
```

### 4. Kiralama Bazlı Randevu (Düğün Salonu, Etkinlik Alanı)
**Mevcut Durum**: ❌ Yok, oluşturulmalı
**Akış**:
1. Tarih seçimi
2. Saat aralığı (başlangıç-bitiş)
3. Kapasite (kişi sayısı)
4. Paket seçimi (Sadece Mekan, Mekan+Catering, Full)
5. Ek hizmetler (dekorasyon, ses, ışık)
6. İletişim bilgileri
7. Onay & Kapora

**Tasarım Özellikleri**:
- Takvim + saat seçici (combined)
- Kapasite göstergesi (max capacity warning)
- Paket kartları (özellik listesi)
- Ek hizmetler grid
- Hazırlık/toplama süresi bilgisi


### 5. Sipariş Bazlı Randevu (Catering, Pasta, Kahve)
**Mevcut Durum**: ❌ Yok, oluşturulmalı
**Akış**:
1. Etkinlik tipi
2. Teslimat tarihi + saati
3. Teslimat adresi (harita entegrasyonu)
4. Kişi sayısı
5. Menü/Ürün seçimi
6. Ek ürünler
7. Tadım randevusu (opsiyonel)
8. İletişim bilgileri
9. Onay & Kapora

**Tasarım Özellikleri**:
- Menü katalog görünümü
- Kişi başı fiyat hesaplayıcı
- Adres seçici (harita + autocomplete)
- Tadım randevusu takvimi
- Teslimat zamanı uyarıları

### 6. Seans Bazlı Randevu (Fotoğraf, Video, Drone)
**Mevcut Durum**: ❌ Yok, oluşturulmalı
**Akış**:
1. Çekim tipi (Düğün, Bebek, Aile, Ürün)
2. Tarih seçimi
3. Saat + süre
4. Lokasyon (Stüdyo, Dış Mekan, Müşteri Lokasyonu)
5. Paket seçimi
6. Ek hizmetler
7. Yedek tarih (dış mekan için)
8. İletişim bilgileri
9. Onay & Kapora

**Tasarım Özellikleri**:
- Çekim tipi kartları (örnek fotoğraflar)
- Lokasyon seçici (harita)
- Süre seçici (slider)
- Paket karşılaştırma
- Hava durumu entegrasyonu (dış mekan için)
- Portfolio galerisi


## İşletme Paneli Kategori Bazlı Özelleştirme

### Genel Terminoloji Değişiklikleri
```typescript
// Eski (Sadece berber/kuaför için)
"Salon Oluştur" → "İşletme Oluştur"
"Salon Adı" → "İşletme Adı"
"Salon Bilgileri" → "İşletme Bilgileri"
"Salonunuz" → "İşletmeniz"

// Kategori bazlı dinamik etiketler
labels: {
  business: string;  // "Kuaför Salonu", "Bungalov Tesisi", "Organizasyon Firması"
  staff: string;     // "Kuaför", "Tesis Görevlisi", "Organizatör"
  service: string;   // "Hizmet", "Konaklama", "Paket"
  appointment: string; // "Randevu", "Rezervasyon", "Görüşme"
  duration: string;  // "dakika", "gece", "saat"
}
```

### Kategori Bazlı Panel Bölümleri

#### 1. Güzellik & Bakım (Kuaför, Berber, Güzellik, Tırnak)
**Panel Bölümleri**:
- ✅ Hizmetler (Kategori bazlı, süre, fiyat)
- ✅ Personel (Fotoğraf, uzmanlık, çalışma saatleri)
- ✅ Randevular (Takvim, liste, detay)
- ✅ Sıra Sistemi (Aktif sıra, geçmiş)
- ✅ Çalışma Saatleri (Haftalık program)
- ✅ Müşteriler (CRM, geçmiş randevular)
- ✅ Yorumlar & Puanlar
- ✅ Galeri
- ✅ Ödeme Ayarları

#### 2. Konaklama (Bungalov, Otel, Villa, Kamp Alanı)
**Panel Bölümleri**:
- ❌ Oda/Ünite Yönetimi (Tip, kapasite, özellikler, fotoğraflar)
- ❌ Rezervasyonlar (Check-in/out, misafir bilgileri)
- ❌ Müsaitlik Takvimi (Dolu/boş günler)
- ❌ Fiyatlandırma (Sezon, özel günler, dinamik fiyat)
- ❌ Ek Hizmetler (Kahvaltı, spa, transfer)
- ❌ Misafir Yönetimi (Check-in/out işlemleri)
- ❌ Temizlik & Bakım Takibi
- ❌ Yorumlar & Puanlar
- ❌ Galeri
- ❌ Ödeme Ayarları

**Özel Özellikler**:
- Oda durumu (Temiz, Kirli, Bakımda, Dolu, Boş)
- Otomatik fiyat hesaplama (gece sayısı × fiyat + ekstralar)
- Check-in/out bildirimleri
- Temizlik programı


#### 3. Etkinlik & Organizasyon (Düğün, Nişan, Doğum Günü, Kurumsal)
**Panel Bölümleri**:
- ❌ Paket Yönetimi (Ekonomik, Standart, Premium, Lüks)
- ❌ Proje Yönetimi (Aşamalar, görevler, timeline)
- ❌ Müşteri Görüşmeleri (Takvim, notlar)
- ❌ Ek Hizmet Sağlayıcıları (Fotoğrafçı, müzisyen, çiçekçi)
- ❌ Sözleşme Yönetimi (Şablonlar, imzalar)
- ❌ Ödeme Planı (Kapora, taksitler, kalan)
- ❌ Etkinlik Takvimi
- ❌ Müşteri Yönetimi (CRM, geçmiş etkinlikler)
- ❌ Yorumlar & Puanlar
- ❌ Portfolio/Galeri

**Özel Özellikler**:
- Milestone tracking (Görüşme → Sözleşme → Planlama → Final)
- Görev yönetimi (To-do list)
- Tedarikçi yönetimi
- Ödeme takibi (kapora, taksit, kalan)
- Sözleşme şablonları

#### 4. Mekan (Düğün Salonu, Etkinlik Alanı)
**Panel Bölümleri**:
- ❌ Mekan Yönetimi (Kapasite, özellikler, fotoğraflar)
- ❌ Rezervasyon Takvimi (Tarih, saat, durum)
- ❌ Paket Yönetimi (Sadece mekan, Mekan+Catering, Full)
- ❌ Ek Hizmetler (Dekorasyon, ses, ışık)
- ❌ Hazırlık/Toplama Süreleri
- ❌ Müşteri Yönetimi
- ❌ Ödeme Takibi
- ❌ Yorumlar & Puanlar
- ❌ Galeri

**Özel Özellikler**:
- Saat bazlı rezervasyon (14:00-23:00)
- Hazırlık süresi (setup time)
- Toplama süresi (cleanup time)
- Kapasite uyarıları

#### 5. Fotoğraf & Video (Fotoğraf, Video, Drone)
**Panel Bölümleri**:
- ❌ Paket Yönetimi (Temel, Standart, Premium)
- ❌ Seans Takvimi (Tarih, saat, lokasyon)
- ❌ Çekim Tipi Yönetimi (Düğün, bebek, aile, ürün)
- ❌ Lokasyon Yönetimi (Stüdyo, dış mekan)
- ❌ Teslimat Takibi (Dijital, fiziksel)
- ❌ Müşteri Yönetimi
- ❌ Portfolio/Galeri
- ❌ Yorumlar & Puanlar
- ❌ Ödeme Takibi

**Özel Özellikler**:
- Hava durumu entegrasyonu (dış mekan için)
- Yedek tarih yönetimi
- Teslimat durumu (işleniyor, hazır, teslim edildi)
- Online galeri linki

#### 6. Yemek & İkram (Catering, Pasta, Kahve)
**Panel Bölümleri**:
- ❌ Menü Yönetimi (Açık büfe, oturmalı, kokteyl)
- ❌ Ürün Kataloğu (Pasta, tatlı, içecek)
- ❌ Sipariş Yönetimi (Tarih, adres, durum)
- ❌ Teslimat Takvimi
- ❌ Tadım Randevuları
- ❌ Kişi Başı Fiyatlandırma
- ❌ Müşteri Yönetimi
- ❌ Ödeme Takibi
- ❌ Yorumlar & Puanlar
- ❌ Ürün Galerisi

**Özel Özellikler**:
- Kişi sayısı bazlı fiyat hesaplama
- Teslimat adresi harita entegrasyonu
- Tadım randevusu takvimi
- Menü özelleştirme


## Uygulama Planı

### Faz 1: Terminoloji Düzeltmeleri (Acil)
**Süre**: 1 gün
**Dosyalar**:
- `src/components/dashboard/SalonSetupForm.tsx`
- `src/config/categories.ts`
- Tüm dashboard bileşenleri

**Değişiklikler**:
```typescript
// Her yerde "salon" yerine kategori bazlı etiket kullan
const { labels } = getCategoryById(category);
// labels.business → "Kuaför Salonu", "Bungalov Tesisi", "Organizasyon Firması"
```

### Faz 2: Hizmet Sistemi Düzeltmesi (Acil)
**Süre**: 2 gün
**Sorun**: Tüm kategoriler saç kesimi, fön görüyor
**Çözüm**: Kategori bazlı hizmet şablonları

**Yeni Dosya**: `src/config/serviceTemplates.ts`
```typescript
export const SERVICE_TEMPLATES: Record<CategoryId, ServiceTemplate[]> = {
  'kuafor': [
    { name: 'Saç Kesimi (Kadın)', duration: 45, price: 300 },
    { name: 'Saç Boyama', duration: 120, price: 800 },
    // ...
  ],
  'bungalov': [
    { name: 'Standart Bungalov (2 kişi)', duration: 1440, price: 1500 },
    { name: 'Aile Bungalov (4 kişi)', duration: 1440, price: 2500 },
    // ...
  ],
  'dugun-organizasyon': [
    { name: 'Ekonomik Paket (100-150 kişi)', duration: 480, price: 50000 },
    { name: 'Standart Paket (150-250 kişi)', duration: 480, price: 100000 },
    // ...
  ],
  // ... diğer kategoriler
};
```

**Değişiklik**: `ServiceForm.tsx`
- Kategori seçildiğinde ilgili şablonları göster
- "Şablondan Ekle" butonu
- Manuel ekleme de mümkün

### Faz 3: Randevu Arayüzleri (Kritik)
**Süre**: 1 hafta
**Öncelik Sırası**:

1. **Geceleme Bazlı** (Bungalov, Otel, Villa, Kamp)
   - Yeni dosya: `src/pages/BookingAccommodation.tsx`
   - Bileşenler: DateRangePicker, RoomSelector, GuestSelector, ExtrasSelector
   - Store: `src/store/accommodationBookingStore.ts`

2. **Proje Bazlı** (Düğün Org., Etkinlikler)
   - Yeni dosya: `src/pages/BookingProject.tsx`
   - Bileşenler: EventTypeSelector, PackageComparison, ExtrasMarketplace
   - Store: `src/store/projectBookingStore.ts`

3. **Kiralama Bazlı** (Düğün Salonu, Etkinlik Alanı)
   - Yeni dosya: `src/pages/BookingRental.tsx`
   - Bileşenler: TimeRangeSelector, CapacitySelector, PackageSelector
   - Store: `src/store/rentalBookingStore.ts`

4. **Sipariş Bazlı** (Catering, Pasta, Kahve)
   - Yeni dosya: `src/pages/BookingOrder.tsx`
   - Bileşenler: MenuSelector, AddressSelector, TastingScheduler
   - Store: `src/store/orderBookingStore.ts`

5. **Seans Bazlı** (Fotoğraf, Video, Drone)
   - Yeni dosya: `src/pages/BookingSession.tsx`
   - Bileşenler: SessionTypeSelector, LocationSelector, PackageSelector
   - Store: `src/store/sessionBookingStore.ts`


### Faz 4: İşletme Paneli Özelleştirme (Önemli)
**Süre**: 1 hafta
**Yaklaşım**: Kategori bazlı dinamik panel

**Yeni Dosya**: `src/pages/OwnerDashboard.tsx` (Refactor)
```typescript
const getDashboardSections = (category: CategoryId) => {
  const baseSection = ['overview', 'customers', 'reviews', 'gallery', 'settings'];
  
  switch (CATEGORY_RESERVATION_TYPE[category]) {
    case 'slot':
      return [...baseSection, 'services', 'staff', 'appointments', 'queue', 'working-hours'];
    
    case 'booking':
      return [...baseSection, 'rooms', 'reservations', 'availability', 'pricing', 'extras', 'checkin'];
    
    case 'project':
      return [...baseSection, 'packages', 'projects', 'consultations', 'providers', 'contracts', 'payments'];
    
    case 'rental':
      return [...baseSection, 'venues', 'reservations', 'packages', 'extras', 'calendar'];
    
    case 'order':
      return [...baseSection, 'menu', 'products', 'orders', 'delivery', 'tasting'];
    
    case 'session':
      return [...baseSection, 'packages', 'sessions', 'locations', 'delivery', 'portfolio'];
  }
};
```

**Yeni Bileşenler**:
- `RoomManager.tsx` (Konaklama)
- `PackageManager.tsx` (Proje, Kiralama, Seans)
- `ProjectManager.tsx` (Etkinlik)
- `VenueManager.tsx` (Mekan)
- `MenuManager.tsx` (Yemek)
- `SessionManager.tsx` (Fotoğraf/Video)

### Faz 5: Veritabanı Şeması Güncelleme (Kritik)
**Süre**: 2 gün
**Sorun**: Mevcut şema sadece slot bazlı randevular için

**Yeni Collections**:
```typescript
// Firestore Collections
- salons (mevcut, "businesses" olarak rename edilmeli)
- services (mevcut, kategori bazlı)
- staff (mevcut, sadece slot bazlı kategoriler için)
- appointments (mevcut, sadece slot bazlı)

// Yeni Collections
- rooms (Konaklama kategorileri için)
- accommodation_bookings (Check-in/out rezervasyonlar)
- projects (Etkinlik organizasyonları)
- project_milestones (Proje aşamaları)
- venues (Mekan bilgileri)
- rental_bookings (Mekan kiralamaları)
- orders (Sipariş bazlı rezervasyonlar)
- sessions (Çekim seansları)
- packages (Tüm kategoriler için paketler)
- extras (Ek hizmetler)
```

**Firestore Service Güncellemeleri**:
- `src/services/firebaseService.ts` → Modüler yapıya geçiş
- `src/services/accommodationService.ts` (Yeni)
- `src/services/projectService.ts` (Yeni)
- `src/services/rentalService.ts` (Yeni)
- `src/services/orderService.ts` (Yeni)
- `src/services/sessionService.ts` (Yeni)


## Tasarım Sistemi

### Renk Paleti (Kategori Bazlı)
```typescript
const categoryColors = {
  // Güzellik & Bakım
  'kuafor': 'from-purple-500 to-pink-500',
  'berber': 'from-blue-500 to-cyan-500',
  'guzellik': 'from-pink-500 to-rose-500',
  'tirnak': 'from-rose-500 to-pink-500',
  
  // Etkinlik & Organizasyon
  'dugun-organizasyon': 'from-red-500 to-pink-500',
  'nisan-organizasyon': 'from-blue-500 to-indigo-500',
  'evlilik-teklifi': 'from-pink-500 to-red-500',
  'dogum-gunu': 'from-yellow-500 to-orange-500',
  'kurumsal-etkinlik': 'from-slate-500 to-gray-500',
  
  // Mekan & Salon
  'dugun-salonu': 'from-amber-500 to-orange-500',
  'etkinlik-alani': 'from-orange-500 to-red-500',
  
  // Konaklama
  'bungalov': 'from-green-500 to-emerald-500',
  'otel': 'from-teal-500 to-cyan-500',
  'villa': 'from-cyan-500 to-blue-500',
  'kamp-alani': 'from-lime-500 to-green-500',
  
  // Fotoğraf & Video
  'fotograf': 'from-indigo-500 to-purple-500',
  'video-produksiyon': 'from-purple-500 to-pink-500',
  'drone-cekim': 'from-sky-500 to-blue-500',
  
  // Yemek & İkram
  'catering': 'from-red-500 to-orange-500',
  'pasta-tatli': 'from-pink-500 to-rose-500',
  'kahve-ikram': 'from-amber-500 to-yellow-500',
};
```

### Bileşen Stili
**Mevcut Tasarım Dili**: ✅ Korunacak
- Glassmorphism (backdrop-blur-xl)
- Gradient vurgular
- Obsidian kartlar
- Liquid chrome efektler
- Smooth animasyonlar (Framer Motion)

**Yeni Bileşenler İçin**:
- Aynı tasarım dilini kullan
- Kategori renklerini entegre et
- Mobil öncelikli tasarım
- Erişilebilirlik standartları

### Responsive Tasarım
```typescript
// Mobil (< 768px)
- Tek sütun layout
- Büyük dokunma alanları (min 44px)
- Bottom navigation (mevcut)
- Swipeable kartlar

// Tablet (768px - 1024px)
- İki sütun layout
- Sidebar navigation
- Modal yerine drawer

// Desktop (> 1024px)
- Üç sütun layout
- Sidebar + main + detail
- Hover efektleri
- Keyboard shortcuts
```


## Teknik Mimari

### Routing Yapısı
```typescript
// Mevcut
/salon/:id → SalonDetail (Tüm kategoriler için)
/booking/:id → BookingSlot (Sadece slot bazlı)

// Yeni
/business/:id → BusinessDetail (Kategori bazlı dinamik)
/booking/:id → BookingRouter (Kategori tipine göre yönlendir)
  → /booking/:id/slot (Kuaför, Berber, Güzellik, Tırnak)
  → /booking/:id/accommodation (Bungalov, Otel, Villa, Kamp)
  → /booking/:id/project (Düğün Org., Etkinlikler)
  → /booking/:id/rental (Düğün Salonu, Etkinlik Alanı)
  → /booking/:id/order (Catering, Pasta, Kahve)
  → /booking/:id/session (Fotoğraf, Video, Drone)
```

### State Management
```typescript
// Mevcut
- bookingStore (Slot bazlı)

// Yeni
- accommodationBookingStore
- projectBookingStore
- rentalBookingStore
- orderBookingStore
- sessionBookingStore

// Ortak interface
interface BaseBookingStore {
  businessId: string;
  business: Business;
  step: number;
  totalSteps: number;
  isValid: boolean;
  init: (businessId: string, business: Business) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  submit: () => Promise<void>;
}
```

### Veri Modelleri
```typescript
// Temel interface (Mevcut)
interface Business {
  id: string;
  name: string;
  category: CategoryId;
  // ... diğer alanlar
}

// Kategori bazlı genişletmeler
interface AccommodationBusiness extends Business {
  rooms: Room[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
}

interface ProjectBusiness extends Business {
  packages: Package[];
  providers: Provider[];
  consultationDuration: number;
}

interface RentalBusiness extends Business {
  venues: Venue[];
  capacity: { min: number; max: number };
  setupTime: number;
  cleanupTime: number;
}

// ... diğer kategoriler
```


## Öncelikli Aksiyonlar

### 1. Acil Düzeltmeler (1-2 Gün)
- [ ] "Salon Oluştur" → "İşletme Oluştur" (Tüm dosyalarda)
- [ ] Kategori bazlı etiketleri kullan (labels.business, labels.staff, vb.)
- [ ] Hizmet şablonları sistemi (Her kategori kendi hizmetlerini görsün)
- [ ] Mock veri temizliği (Gerçek veri yapısına geçiş)

### 2. Kritik Geliştirmeler (1 Hafta)
- [ ] Geceleme bazlı randevu arayüzü (Bungalov, Otel, Villa, Kamp)
- [ ] Proje bazlı randevu arayüzü (Düğün Org., Etkinlikler)
- [ ] Kiralama bazlı randevu arayüzü (Düğün Salonu, Etkinlik Alanı)
- [ ] Sipariş bazlı randevu arayüzü (Catering, Pasta, Kahve)
- [ ] Seans bazlı randevu arayüzü (Fotoğraf, Video, Drone)

### 3. İşletme Paneli (1 Hafta)
- [ ] Kategori bazlı dinamik panel yapısı
- [ ] Konaklama yönetimi bileşenleri
- [ ] Proje yönetimi bileşenleri
- [ ] Mekan yönetimi bileşenleri
- [ ] Sipariş yönetimi bileşenleri
- [ ] Seans yönetimi bileşenleri

### 4. Veritabanı & Backend (2-3 Gün)
- [ ] Yeni Firestore collections
- [ ] Kategori bazlı servisler
- [ ] Veri migrasyonu (Mevcut veriler)
- [ ] API endpoint'leri

### 5. Test & Optimizasyon (3-4 Gün)
- [ ] Her kategori için test senaryoları
- [ ] Mobil responsive testler
- [ ] Performance optimizasyonu
- [ ] Erişilebilirlik testleri

## Başarı Kriterleri

### Fonksiyonel
- ✅ Her kategori kendi hizmetlerini görebilmeli
- ✅ Her kategori için uygun randevu arayüzü çalışmalı
- ✅ Bungalov işletmesi gerçek rezervasyon alabilmeli
- ✅ Mock veri olmamalı
- ✅ Terminoloji tutarlı olmalı ("İşletme" kullanımı)

### Teknik
- ✅ Kod tekrarı minimum olmalı (DRY principle)
- ✅ Tip güvenliği (TypeScript)
- ✅ Performance (Lazy loading, code splitting)
- ✅ Erişilebilirlik (WCAG 2.1 AA)

### Kullanıcı Deneyimi
- ✅ Sezgisel arayüz
- ✅ Hızlı yükleme (<3 saniye)
- ✅ Mobil uyumlu
- ✅ Hata yönetimi (Anlaşılır mesajlar)
- ✅ Yükleme durumları (Skeleton, spinner)

## Notlar

### Mevcut Sistemde Korunacaklar
- ✅ Slot bazlı randevu sistemi (Kuaför, Berber, Güzellik, Tırnak)
- ✅ Sıra sistemi
- ✅ Tasarım dili (Glassmorphism, gradients)
- ✅ Mobil bottom navigation
- ✅ Yorum & puanlama sistemi
- ✅ Galeri sistemi
- ✅ Harita entegrasyonu

### Yeni Eklenecekler
- ✅ Kategori bazlı randevu arayüzleri
- ✅ Kategori bazlı işletme panelleri
- ✅ Hizmet şablonları
- ✅ Dinamik fiyatlandırma
- ✅ Ödeme planı yönetimi
- ✅ Sözleşme yönetimi
- ✅ Proje/milestone takibi

### Teknik Borç
- Firestore → Firebase Data Connect geçişi (Gelecekte)
- GraphQL API (Gelecekte)
- Real-time bildirimler (Gelecekte)
- Ödeme entegrasyonu (Gelecekte)

---

**Son Güncelleme**: 2026-05-21
**Durum**: Planlama Aşaması
**Öncelik**: Yüksek
