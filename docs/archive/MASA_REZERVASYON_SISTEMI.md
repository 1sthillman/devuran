# 🍽️ MASA REZERVASYON SİSTEMİ

## Genel Bakış

Restoran işletmeleri için kapsamlı masa rezervasyon sistemi. Masalar otomatik olarak "hizmet" olarak ekleniyor ve müşteriler randevu alma ekranından masa rezervasyonu yapabiliyor.

## ✨ Özellikler

### 1. Otomatik Hizmet Oluşturma
- ✅ **Masa Eklendiğinde**: Otomatik olarak hizmet oluşturulur
- ✅ **Masa Güncellendiğinde**: İlgili hizmet güncellenir
- ✅ **Masa Silindiğinde**: İlgili hizmet de silinir
- ✅ **tableId İlişkilendirmesi**: Her hizmet hangi masaya ait bellidir

### 2. Migration Sistemi (Mevcut Masalar İçin)
Mevcut masaları hizmete dönüştürmek için:

**Yöntem 1: UI Butonu**
1. Restoran Dashboard → Masalar sekmesi
2. "Rezervasyon Sistemini Aktifleştir" butonuna tıkla
3. Tüm masalar otomatik olarak hizmet olarak eklenir

**Yöntem 2: Tarayıcı Konsolu**
```javascript
// Tek bir restoran için
migrateTableToServices('RESTAURANT_ID')

// Tüm restoranlar için
migrateAllRestaurantTables()
```

### 3. Hizmet Yapısı

Her masa için oluşturulan hizmet:

```typescript
{
  id: "unique-id",
  salonId: "restaurant-id",
  tableId: "table-id", // 🔗 Masa ile ilişki
  name: "Masa 1",
  description: "4 kişilik masa rezervasyonu",
  category: "restaurant",
  duration: 120, // 2 saat
  price: 0, // Ücretsiz (isteğe göre değiştirilebilir)
  gender: "all",
  staffIds: [],
  isActive: true,
  pricingRules: {
    basePrice: 0,
    minGuests: 1,
    maxGuests: 4 // Masa kapasitesi
  }
}
```

## 📋 Kullanım Senaryoları

### Senaryo 1: Yeni Restoran Kurulumu
1. İşletme sahibi restoran kurar
2. Masalar ekler (örn: Masa 1, Masa 2, ...)
3. Her masa otomatik olarak hizmet olarak da eklenir ✅
4. Müşteriler randevu alabilir 🎉

### Senaryo 2: Mevcut Restoran
1. İşletme zaten masalar eklemiş
2. "Rezervasyon Sistemini Aktifleştir" butonuna tıklar
3. Mevcut tüm masalar hizmete dönüştürülür ✅
4. Müşteriler randevu alabilir 🎉

### Senaryo 3: Masa Güncelleme
1. İşletme sahibi masa kapasitesini değiştirir (4 → 6 kişi)
2. İlgili hizmet otomatik güncellenir ✅
3. pricingRules.maxGuests = 6 olur

### Senaryo 4: Masa Silme
1. İşletme sahibi masayı siler
2. İlgili hizmet de otomatik silinir ✅
3. Artık o masa için rezervasyon alınamaz

## 🔄 Akış Diagramı

```
┌─────────────────────┐
│  Masa Oluşturuldu   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ createTable()       │
│ - QR kod oluştur    │
│ - Masayı kaydet     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Otomatik Service    │
│ Oluştur:            │
│ - name: "Masa X"    │
│ - tableId: masa_id  │
│ - category: rest.   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Salon.services[]    │
│ array'ine ekle      │
└─────────────────────┘
```

## 💻 Teknik Detaylar

### Service Interface Güncellemesi
```typescript
export interface Service {
  // ... mevcut alanlar
  tableId?: string; // 🆕 Masa rezervasyonu için
}
```

### RestaurantService Güncellemeleri

**createTable()**
- Masa oluşturur
- Otomatik service ekler
- tableId ile ilişkilendirir

**updateTable()**
- Masa bilgilerini günceller
- İlgili service'i günceller (isim, kapasite)

**deleteTable()**
- Masayı siler
- İlgili service'i siler

### Migration Script

`src/scripts/migrateTableToServices.ts`

```typescript
// Tek restoran için
migrateTableToServices(restaurantId: string)

// Tüm restoranlar için
migrateAllRestaurantTables()
```

## 🎯 Müşteri Deneyimi

### Randevu Alma Akışı

1. **İşletme Seçimi**: Müşteri restoranı seçer
2. **Hizmet Seçimi**: Masalar "Masa 1", "Masa 2" olarak görünür
3. **Tarih/Saat Seçimi**: Uygun slot seçer
4. **Kişi Sayısı**: Masa kapasitesine göre seçim
5. **Onay**: Rezervasyon tamamlanır

### Rezervasyon Bilgileri

```typescript
{
  type: "slot",
  salonId: "restaurant-id",
  services: [{
    id: "service-id",
    name: "Masa 1",
    price: 0,
    duration: 120
  }],
  date: "2024-06-30",
  time: "19:00",
  guests: 4
}
```

## 🔧 Konfigürasyon

### Masa Rezervasyon Süresi
Varsayılan: 2 saat (120 dakika)

Değiştirmek için:
```typescript
duration: 180, // 3 saat
```

### Rezervasyon Ücreti
Varsayılan: Ücretsiz (0 TL)

Ücretli yapmak için:
```typescript
price: 50, // 50 TL
pricingRules: {
  basePrice: 50,
  perPerson: 10, // Kişi başı ek ücret
  // ...
}
```

## 📊 Raporlama

### Rezervasyon İstatistikleri

- ✅ Toplam rezervasyon sayısı
- ✅ Masa doluluk oranı
- ✅ Popüler saatler
- ✅ Ortalama kişi sayısı

## 🚀 Gelecek Geliştirmeler

- [ ] Masa birleştirme (grup rezervasyonları için)
- [ ] Özel alan rezervasyonu (bahçe, VIP, vb.)
- [ ] Otomatik masa ataması (en uygun masa)
- [ ] Rezervasyon değişikliği/iptali
- [ ] SMS/Email hatırlatıcıları
- [ ] Özel gün indirimleri
- [ ] Kapora sistemi (büyük gruplar için)

## 🐛 Sorun Giderme

### "Henüz Hizmet Eklenmemiş" Hatası

**Çözüm:**
1. Restoran Dashboard → Masalar
2. "Rezervasyon Sistemini Aktifleştir" butonuna tıklayın
3. Bekleyin, masalar hizmete dönüştürülecek

### Masa Silindi Ama Hizmet Kaldı

**Çözüm:**
```javascript
// Konsol
const restaurantId = 'YOUR_RESTAURANT_ID';
migrateTableToServices(restaurantId);
```

### Masa Kapasitesi Güncellenmiyor

**Kontrol:**
1. updateTable() fonksiyonunda `capacity` parametresi gönderiliyor mu?
2. Service güncelleme hatası var mı console'da?

## 📞 Destek

Sorun yaşarsanız:
- GitHub Issues
- Email: support@restoqr.com

---

**Son Güncelleme**: 29 Haziran 2024
**Versiyon**: 1.0.0
**Yazar**: Kiro AI Assistant
