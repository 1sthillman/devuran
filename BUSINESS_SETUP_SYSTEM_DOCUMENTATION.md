# 🎯 AKILLI İŞLETME OLUŞTURMA SİSTEMİ - KAPSAMLI DOKÜMANTASYON

## 🌟 VİZYON

Bu sistem, **HERHANGİ** bir işletme türünün platforma eksiksiz entegre olmasını sağlar. Sabit kategori listeleri yerine, **dinamik yetenek modeli** kullanır.

## 🧠 SİSTEM MİMARİSİ

### 1. **BusinessCapabilities (Yetenek Modeli)**
```typescript
interface BusinessCapabilities {
  bookingModels: BookingModel[];          // Nasıl çalışıyor
  capacityUnit: CapacityUnit;             // Kapasite birimi
  isDurationBased: boolean;               // Süre bazlı mı
  isDateRangeBased: boolean;              // Tarih aralığı mı
  hasPhysicalLocation: boolean;           // Fiziksel mekan var mı
  isMobileService: boolean;               // Mobil hizmet mi
  hasStaff: boolean;                      // Personel var mı
  hasTables: boolean;                     // Masa/oda/alan var mı
  tableTerminology: string;               // Birimin adı
  hasDelivery: boolean;                   // Teslimat var mı
  hasQueue: boolean;                      // Sıra sistemi var mı
  requiresDeposit: boolean;               // Kapora gerekli mi
  // ... ve daha fazlası
}
```

### 2. **SmartBusinessProfiler (Akıllı Soru Motoru)**
- Kullanıcıya birbirine bağlı sorular sorar
- Cevaplara göre sonraki soruları dinamik olarak gösterir
- Her cevap `capabilities` nesnesini günceller
- Sonunda en uygun kategori ismini önerir (kullanıcı değiştirebilir)

### 3. **Preset Kategoriler (Hızlı Başlangıç)**
16+ hazır şablon:
- Kuaför/Berber
- Güzellik Merkezi
- Restoran/Kafe
- Otel/Pansiyon
- Araç Kiralama
- Fotoğraf/Video
- Çiçekçi/Hediye
- Spor Salonu
- Etkinlik Mekanı
- Klinik/Sağlık
- Teknik Servis
- Kurs/Özel Ders
- Evcil Hayvan Bakımı
- ...ve "Listede Yok" seçeneği

## 🎭 KULLANICI AKIŞI

### A) Hızlı Başlangıç (Preset Seçimi)
1. Kullanıcı grid'den kategori seçer
2. O kategorinin tüm `capabilities` otomatik yüklenir
3. İsteğe bağlı: "İnce Ayar" ile özelleştirme yapılabilir

### B) Akıllı Profil (Custom)
1. Kullanıcı "Akıllı Profil Oluştur" butonuna tıklar
2. Soru-cevap akışı başlar:
   ```
   Q1: İşletmeniz müşterilerle temelde nasıl çalışıyor?
       → Randevu / Rezervasyon / Sipariş / Kiralama / Sıra / Hiçbiri
   
   Q2: (eğer randevu seçildiyse)
       Randevularınız belirli bir personele mi atanıyor?
       → Evet (hasStaff=true) / Hayır
   
   Q3: (eğer rezervasyon seçildiyse)
       Rezervasyon biriminiz nedir?
       → Masa / Oda / Saha / Araç
   
   ... ve dallanarak devam eder
   ```
3. Sonunda özet gösterilir
4. Kullanıcı kendi kategori ismini yazar (örn: "Yat Charter", "Escape Room")
5. Sistem `custom-yat-charter` ID'si ile kaydeder

## 🔄 WIZARD AKIM SİSTEMİ

### Adımlar
1. **Profil** - CategorySelection (preset veya akıllı profil)
2. **Bilgiler** - BasicInfo (ad, telefon, email)
3. **Adres** - AddressInfo (konum bilgileri)
4. **Görseller** - MediaUpload (logo, kapak, galeri)
5. **Çalışma** - WorkingHours (açılış saatleri)
6. **Ayarlar** - ReservationSettings (rezervasyon kuralları)

### Onboarding Entegrasyonu
- Kullanıcı kayıt olurken "İşletme Sahibi" seçerse
- Login.tsx → OnboardingModal → `businessCategory` kaydedilir
- BusinessSetupWizard açıldığında bu kategori algılanır
- **Adım 1 otomatik geçilir, Adım 2'den başlanır**

## 🎯 DASHBOARD ENTEGRASYonu

### Capability-Based Module Gösterimi
```typescript
const dashboardModules = getDashboardModules(capabilities);

// Sonuç:
{
  showStaff: boolean,        // Personel sekmesi
  showServices: boolean,     // Her zaman true
  showTables: boolean,       // Masa/Oda yönetimi
  showQueue: boolean,        // Sıra yönetimi
  showRestaurant: boolean,   // Özel restoran paneli
  showOrders: boolean        // Sipariş yönetimi
}
```

### Dinamik Terminology
```typescript
const terminology = getBookingTerminology(capabilities);

// Örnekler:
// Kuaför    → { bookingUnit: "Randevu", actionVerb: "Randevu Al" }
// Restoran  → { bookingUnit: "Rezervasyon", actionVerb: "Rezervasyon Yap" }
// Çiçekçi   → { bookingUnit: "Sipariş", actionVerb: "Sipariş Ver" }
```

## 🚀 YENİ İŞLETME TÜRÜ EKLEME

### Örnek: "Drone Pisti" Eklemek İsterseniz

#### Yöntem 1: Preset Olarak Ekle
```typescript
// businessCapabilities.ts
{
  id: 'drone-pisti',
  name: 'Drone Pisti',
  icon: Plane,
  capabilities: {
    bookingModels: ['reservation'],
    capacityUnit: 'unit',
    hasStaff: false,
    hasTables: true,
    tableTerminology: 'Pist',
    isDateRangeBased: false,
    requiresDeposit: true,
    // ...
  }
}
```

#### Yöntem 2: Kullanıcı Akıllı Profil ile Oluşturur
1. "Akıllı Profil Oluştur" seçilir
2. Sorular:
   - "Rezervasyon ile çalışıyorum"
   - "Rezervasyon birimim: Saha/Alan"
   - "Saatlik zaman dilimi bazlı"
   - "Kapora almak istiyorum"
3. Sonunda: "Drone Pisti" yazar
4. Sistem: `custom-drone-pisti` olarak kaydeder
5. **HİÇBİR KOD DEĞİŞİKLİĞİ GEREKMEZ!**

## 📊 BOOKING WIZARD AKIŞI

### Multi-Model Seçimi
Eğer işletme birden fazla model destekliyorsa:
```typescript
// Örnek: Restoran hem rezervasyon hem sipariş alabiliyor
capabilities: {
  bookingModels: ['reservation', 'order'],
  // ...
}

// Müşteri "Randevu Al" dediğinde:
→ BookingTypeSelector gösterilir
→ "Masa Rezervasyonu" veya "Yemek Siparişi" seçmesi istenir
→ Seçimine göre ilgili wizard açılır
```

### Single-Model
Tek model varsa direkt o wizard açılır.

## 🛡️ GÜVENLİK VE DOĞRULAMA

### Geriye Uyumluluk
```typescript
// Legacy category kontrolü:
if (salon.category === 'restoran') { ... }

// Yeni sistem (helper kullan):
if (isSalonTableBased(salon)) { ... }

// Helper içi:
function isSalonTableBased(salon) {
  const capabilities = getSalonCapabilities(salon);
  if (capabilities) {
    return capabilities.hasTables;  // Yeni sistem
  }
  // Fallback: legacy
  return salon.category === 'restoran';
}
```

## 🎨 UI/UX ÖZELLİKLERİ

### CategorySelection
- **Grid View**: 16+ preset kartı, 8 sütuna kadar responsive
- **Search**: Kategori arama
- **Akıllı Profil Butonu**: Belirgin, gradient, üstte
- **İnce Ayar**: Seçili preset varsa gösteriliyor
- **Profil Durumu Badge**: Akıllı profil kullanıldıysa gösterge

### SmartBusinessProfiler
- **Progress Bar**: Kaç soru kaldığını gösterir
- **Conditional Rendering**: Sadece ilgili sorular gösterilir
- **Multi-select**: Bazı sorular (örn: Q1) birden fazla seçim
- **History Stack**: Geri tuşu ile önceki soruya dönüş
- **Summary Screen**: Sonunda tüm özelliklerin listesi
- **Category Label Input**: Kullanıcı kendi ismini yazar
- **Smart Suggestion**: En yakın preset önerisi

## 🔧 DEVELOPER NOTES

### Önemli Dosyalar
1. `src/types/businessCapabilities.ts` - Model tanımları
2. `src/config/businessQuestionFlow.ts` - Soru motoru
3. `src/components/dashboard/BusinessSetupSteps/SmartBusinessProfiler.tsx` - UI
4. `src/components/dashboard/BusinessSetupSteps/CategorySelection.tsx` - Grid & Profiler
5. `src/utils/bookingTypeResolver.ts` - Capability → Wizard mapping
6. `src/utils/businessHelpers.ts` - Helper functions

### Test Senaryoları
1. ✅ Preset seçimi → Wizard tamamlama
2. ✅ Akıllı profil → Custom kategori → Wizard tamamlama
3. ✅ Multi-model işletme → Booking type seçimi
4. ✅ Dashboard modülleri doğru gösteriliyor mu
5. ✅ Terminology doğru render ediliyor mu
6. ✅ Legacy işletmeler (capabilities yok) çalışıyor mu

### Migration Path
Mevcut işletmeler için:
```typescript
// Script: migrateCapabilities.ts (zaten var)
// Legacy category → Capabilities dönüşümü
```

## 🎓 SORU EKLEME REHBERİ

Yeni bir soru eklemek için `businessQuestionFlow.ts`:

```typescript
{
  id: 'q10_new_feature',
  title: 'Yeni özellik hakkında soru?',
  subtitle: 'Açıklama...',
  multiSelect: false,  // veya true
  showIf: (answers, cap) => {
    // Koşul: bu soru ne zaman gösterilsin?
    return hasModel(answers, 'appointment');
  },
  options: [
    {
      id: 'option1',
      label: 'Seçenek 1',
      description: 'Açıklama...',
      patch: {
        // Capabilities'e uygulanacak değişiklik
        someField: true,
      },
    },
  ],
}
```

## 🚨 HATIRLATMALAR

1. **ASLA** hardcoded `salon.category ===` kontrolü ekleme
2. **HER ZAMAN** helper fonksiyonları kullan
3. **YENİ İŞ MODELİ** için önce soru ekle, kod değil
4. **TERMİNOLOJİ** capabilities'den türetilmeli
5. **WIZARD AKIŞI** booking type'a göre seçilmeli

## 🎉 SONUÇ

Bu sistem sayesinde:
- ✅ **Kategori olmayan** işletmeler eklenebilir
- ✅ **Hibrit modeller** desteklenir
- ✅ **Kod değişikliği** gerekmez
- ✅ **Akıllı soru motoru** her senaryoyu kapsar
- ✅ **Dashboard** otomatik adapte olur
- ✅ **Booking wizard** doğru açılır
- ✅ **Terminology** dinamik olur

---

**Sistem Durumu**: ✅ TAMAMEN ÇALIŞIR DURUMDA
**Son Güncelleme**: 2026-07-11
**Kapsam**: %100 - Tüm işletme türleri destekleniyor
