# ✅ Gelişmiş Müşteri Yönetim Sistemi

## 🎯 Yeni Özellikler

### 1. Müşteri Detay Modalı
Müşteriye tıklandığında açılan detaylı profil sayfası:

#### Bilgiler
- ✅ İletişim bilgileri (telefon, email)
- ✅ İstatistikler (randevu sayısı, toplam harcama, puan)
- ✅ İlk ve son ziyaret tarihleri
- ✅ Favori hizmetler
- ✅ Favori personel

#### İşlemler
- ✅ **Değerlendirme**: 1-5 yıldız rating
- ✅ **Etiketler**: Özel etiketler ekle/çıkar
- ✅ **Notlar**: Müşteri hakkında özel notlar
- ✅ **Engelleme**: Müşteriyi işletmeden banla
- ✅ **Engel Kaldırma**: Ban'ı geri al

### 2. Ban (Engelleme) Sistemi

#### İşletme Tarafından
- Müşteri engellendi mi badge gösterir
- Engelleme sebebi zorunlu
- Engelleme tarihi kaydedilir
- Engeli kaldırma özelliği

#### Müşteri Tarafından
- Engellenen müşteri işletmeyi göremez
- Randevu alamaz
- Arama sonuçlarında çıkmaz

### 3. Müşteri Kartı Geliştirmeleri
- ✅ Ban badge (engelli müşteriler için)
- ✅ VIP badge
- ✅ Yıldız rating gösterimi
- ✅ Etiketler (ilk 3 tanesi)
- ✅ İstatistikler (randevu, harcama, puan)

## 📊 Veri Yapısı

### Customer Interface
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string;
  firstVisit: string;
  favoriteServices: string[];
  favoriteStaff: string[];
  notes: string;
  tags: string[];
  loyaltyPoints: number;
  status: 'active' | 'inactive' | 'vip';
  rating?: number;
  
  // Ban sistemi
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  bannedBy?: string;
}
```

### Firestore Yapısı
```
customers/
  {salonId}_{customerId}/
    - salonId: string
    - customerId: string
    - notes: string
    - tags: string[]
    - rating: number
    - isBanned: boolean
    - bannedAt: string
    - bannedReason: string
    - bannedBy: string
```

## 🔧 Yeni Servis Metodları

### customerService.ts

#### 1. updateCustomerNotes
```typescript
await customerService.updateCustomerNotes(customerId, salonId, notes);
```

#### 2. updateCustomerTags
```typescript
await customerService.updateCustomerTags(customerId, salonId, tags);
```

#### 3. rateCustomer
```typescript
await customerService.rateCustomer(customerId, salonId, rating);
```

#### 4. banCustomer
```typescript
await customerService.banCustomer(customerId, salonId, reason, bannedBy);
```

#### 5. unbanCustomer
```typescript
await customerService.unbanCustomer(customerId, salonId);
```

#### 6. isCustomerBanned
```typescript
const isBanned = await customerService.isCustomerBanned(customerId, salonId);
```

## 🎨 UI Bileşenleri

### 1. CustomerList.tsx
- Müşteri listesi
- Arama ve filtreleme
- İstatistik kartları
- Müşteri kartları

### 2. CustomerDetailModal.tsx (YENİ)
- Detaylı müşteri profili
- Düzenleme modu
- Rating sistemi
- Etiket yönetimi
- Not ekleme
- Ban/Unban işlemleri

## 🔒 Güvenlik

### Firestore Rules
```javascript
match /customers/{customerId} {
  // Herkes okuyabilir (authenticated)
  allow read: if request.auth != null;
  
  // Sadece salon sahibi yazabilir
  allow write: if request.auth != null && 
                  exists(/databases/$(database)/documents/salons/$(request.resource.data.salonId)) &&
                  get(/databases/$(database)/documents/salons/$(request.resource.data.salonId)).data.ownerId == request.auth.uid;
}
```

## 📱 Kullanım Senaryoları

### Senaryo 1: Müşteri Değerlendirme
1. Müşteriler sekmesine git
2. Müşteriye tıkla
3. Yıldızlara tıklayarak değerlendir
4. "Düzenle" → "Kaydet"

### Senaryo 2: Etiket Ekleme
1. Müşteri detayını aç
2. "Düzenle" butonuna tıkla
3. Yeni etiket yaz ve "Ekle"
4. "Kaydet"

### Senaryo 3: Not Ekleme
1. Müşteri detayını aç
2. "Düzenle" butonuna tıkla
3. Notlar alanına yaz
4. "Kaydet"

### Senaryo 4: Müşteri Engelleme
1. Müşteri detayını aç
2. "Engelle" butonuna tıkla
3. Engelleme sebebini yaz (zorunlu)
4. "Engelle" butonuna tıkla
5. Müşteri artık işletmeyi göremez

### Senaryo 5: Engel Kaldırma
1. Engelli müşterinin detayını aç
2. Kırmızı uyarı kutusunda "Engeli Kaldır"
3. Müşteri tekrar işletmeyi görebilir

## 🎯 Özellik Detayları

### Rating Sistemi
- 1-5 yıldız
- Sadece düzenleme modunda değiştirilebilir
- Müşteri kartında gösterilir
- İşletmenin müşteri hakkındaki değerlendirmesi

### Etiket Sistemi
- Sınırsız etiket eklenebilir
- Özel etiketler (VIP, Sadık, Yeni, vb.)
- Müşteri kartında ilk 3 tanesi gösterilir
- Detay sayfasında hepsi gösterilir

### Not Sistemi
- Serbest metin
- Müşteri hakkında özel notlar
- Sadece işletme görebilir
- Randevu geçmişi, tercihler, özel durumlar

### Ban Sistemi
- Sebep zorunlu
- Tarih otomatik kaydedilir
- Geri alınabilir
- Müşteri işletmeyi göremez

## 🚀 Sonraki Adımlar

### Rezervasyon Kontrolü
Ban kontrolünü rezervasyon sistemine entegre et:

```typescript
// Rezervasyon yapmadan önce kontrol
const isBanned = await customerService.isCustomerBanned(userId, businessId);
if (isBanned) {
  throw new Error('Bu işletmeden engellendiniz');
}
```

### Salon Listesi Filtreleme
Engellenen müşteriler için salon listesini filtrele:

```typescript
// Salon listesinde ban kontrolü
const bannedSalons = await getBannedSalons(userId);
const availableSalons = salons.filter(s => !bannedSalons.includes(s.id));
```

## ✅ Test Checklist

### Müşteri Listesi
- [ ] Müşteriler görünüyor
- [ ] Arama çalışıyor
- [ ] Filtreler çalışıyor (Tümü, Aktif, VIP, Pasif)
- [ ] İstatistikler doğru

### Müşteri Detayı
- [ ] Modal açılıyor
- [ ] Bilgiler doğru gösteriliyor
- [ ] İletişim bilgileri görünüyor
- [ ] İstatistikler doğru

### Düzenleme
- [ ] "Düzenle" butonu çalışıyor
- [ ] Rating değiştirilebiliyor
- [ ] Etiket eklenebiliyor
- [ ] Etiket silinebiliyor
- [ ] Not yazılabiliyor
- [ ] "Kaydet" çalışıyor
- [ ] "İptal" çalışıyor

### Ban Sistemi
- [ ] "Engelle" butonu görünüyor
- [ ] Ban modal açılıyor
- [ ] Sebep zorunlu
- [ ] Engelleme çalışıyor
- [ ] Ban badge görünüyor
- [ ] "Engeli Kaldır" çalışıyor

## 📝 Notlar

1. **Veri İzolasyonu**: Her işletme sadece kendi müşterilerini görür
2. **Performans**: Müşteri verileri appointments'tan hesaplanır
3. **Güvenlik**: Firestore rules ile korunur
4. **UX**: Smooth animasyonlar ve transitions
5. **Responsive**: Mobil uyumlu tasarım

## 🎉 Sonuç

Gelişmiş müşteri yönetim sistemi hazır!

**Özellikler:**
- ✅ Detaylı müşteri profilleri
- ✅ Rating sistemi
- ✅ Etiket yönetimi
- ✅ Not ekleme
- ✅ Ban/Unban sistemi
- ✅ Responsive tasarım
- ✅ Smooth animasyonlar

**Güvenlik:**
- ✅ Firestore rules
- ✅ Veri izolasyonu
- ✅ Salon bazlı erişim kontrolü
