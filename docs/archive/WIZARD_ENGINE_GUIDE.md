# 🧙 Dynamic Wizard Engine - Kullanım Kılavuzu

## 📋 Özet

Yeni **Schema-Driven Wizard Engine** sistemi başarıyla projenize entegre edildi! Bu sistem, **mevcut rezervasyon sisteminizi bozmadan** paralel olarak çalışacak şekilde tasarlandı.

## ✅ Neler Eklendi?

### 1. **Type Definitions**
- `src/types/wizard.ts` - Tüm wizard type'ları
- `src/types/verticalConfig.ts` - Firestore config yapısı

### 2. **Services**
- `src/services/verticalConfigService.ts` - Config yönetimi ve cache

### 3. **Step Primitives** (Yeniden Kullanılabilir)
- `src/components/wizard/primitives/ServiceSelectionPrimitive.tsx`
- `src/components/wizard/primitives/StaffSelectionPrimitive.tsx`
- `src/components/wizard/primitives/CapacityPrimitive.tsx`

### 4. **Wizard Engine**
- `src/components/wizard/WizardEngine.tsx` - Ana orkestra motoru

### 5. **Demo Config**
- `src/config/verticalConfigs/hairdresser.ts` - Kuaför config örneği

### 6. **Test Sayfası**
- `src/pages/WizardTestPage.tsx` - Güvenli test ortamı
- Route: `/wizard-test/:salonId`

---

## 🧪 Test Etme

### Adım 1: Mevcut bir salon ID'si alın
```
Örnek: http://localhost:5173/salon/abc123
```

### Adım 2: Yeni wizard test sayfasını açın
```
http://localhost:5173/wizard-test/abc123
```

### Adım 3: Wizard akışını deneyin
- ✅ Hizmet seçimi çalışıyor
- ✅ Personel seçimi çalışıyor
- ✅ Kapasite seçimi çalışıyor
- 🚧 DateTime, Payment, Review primitive'leri TODO

---

## 🔥 Firestore Setup (Sonraki Adım)

Wizard engine tamamen config-driven çalışır. Config'leri Firestore'a eklemek için:

### 1. Firestore Collection Oluştur
```
Collection: verticalConfigs
```

### 2. Örnek Config Document Ekle

**Document ID:** `hairdresser_v1`

```json
{
  "id": "hairdresser_v1",
  "businessType": "hairdresser",
  "name": "Kuaför Rezervasyon Sihirbazı",
  "description": "Kuaför ve berber işletmeleri için optimize edilmiş rezervasyon akışı",
  "version": 1,
  "steps": [
    {
      "id": "service_selection",
      "type": "ServiceSelection",
      "title": "Hangi hizmetleri almak istersiniz?",
      "description": "Birden fazla hizmet seçebilirsiniz",
      "isOptional": false,
      "order": 1,
      "config": {
        "allowMultiple": true,
        "showPricing": true,
        "showDuration": true,
        "groupByCategory": true,
        "categoryFilter": []
      }
    },
    {
      "id": "staff_selection",
      "type": "StaffSelection",
      "title": "Tercih ettiğiniz uzman var mı?",
      "description": "Farketmez seçeneği ile ilk müsait uzmanla randevu alabilirsiniz",
      "isOptional": true,
      "order": 2,
      "config": {
        "isRequired": false,
        "filterByService": true,
        "showAvailability": true,
        "allowAnyStaff": true
      }
    }
  ],
  "pricingRules": [],
  "availabilityRules": [],
  "settings": {
    "autoConfirm": true,
    "requireDeposit": false,
    "allowCancellation": true,
    "cancellationHours": 2
  },
  "metadata": {
    "createdAt": "2026-07-10T00:00:00.000Z",
    "updatedAt": "2026-07-10T00:00:00.000Z",
    "isActive": true
  }
}
```

---

## 🚀 Production'a Geçiş (Gelecekte)

Yeni wizard sistemi test edilip onaylandıktan sonra:

### Seçenek 1: Kademeli Geçiş (Önerilen)
```typescript
// src/pages/Booking.tsx içinde

if (salon.category === 'kuafor' && USE_NEW_WIZARD) {
  return <WizardEngine config={config} salon={salon} />;
}

// Eski wizard'ı koru
return <BookingWizardRouter />;
```

### Seçenek 2: Feature Flag
```typescript
const shouldUseNewWizard = useFeatureFlag('new_wizard_engine');

if (shouldUseNewWizard) {
  return <WizardEngine ... />;
}
```

---

## 📦 Kalan TODO'lar

### Step Primitives
- [ ] `DateTimeSlotPrimitive.tsx` - Tarih/saat seçimi
- [ ] `DateRangePrimitive.tsx` - Check-in/checkout
- [ ] `FullDayBlockPrimitive.tsx` - Tüm gün rezervasyon
- [ ] `PackageSelectionPrimitive.tsx` - Paket seçimi
- [ ] `AddOnSelectionPrimitive.tsx` - Ek hizmetler
- [ ] `CustomFormPrimitive.tsx` - Dinamik form alanları
- [ ] `ContractPrimitive.tsx` - Sözleşme imzalama
- [ ] `PaymentPrimitive.tsx` - PayTr entegrasyonu
- [ ] `ReviewConfirmPrimitive.tsx` - Özet ve onay

### Vertical Configs
- [ ] `wedding_hall.ts` - Düğün salonu config
- [ ] `hotel.ts` - Otel config
- [ ] `restaurant.ts` - Restoran config
- [ ] `catering.ts` - Catering config
- [ ] `video_production.ts` - Video prodüksiyon config
- [ ] (8 tane daha...)

### Backend
- [ ] Firestore Security Rules için `verticalConfigs` koleksiyonu
- [ ] Config validation Cloud Function
- [ ] Reservation creation için wizard data parser

---

## 🎯 Avantajlar

### Mevcut Sistem Korundu ✅
- Hiçbir mevcut wizard dosyası değiştirilmedi
- `BookingWizardRouter.tsx` hala çalışıyor
- Tüm reservation'lar normal devam ediyor

### Genişletilebilir Mimari ✅
- Yeni sektör eklemek = Yeni config dosyası
- Step primitive'ler hepsi ortak
- Business logic config'de, UI'da değil

### Test Güvenliği ✅
- Ayrı test route (`/wizard-test/:salonId`)
- Dev mode debug panel
- Production etkilenmiyor

---

## 🔄 Sonraki Adımlar

1. **Kalan primitive'leri tamamla** (DateTime en kritik)
2. **Firestore'a config'leri ekle**
3. **2-3 sektörde test et** (Kuaför, Düğün Salonu, Otel)
4. **Production'da A/B test**
5. **Tüm sektörleri migrate et**

---

## 📞 Sorular?

Bu sistem `wizardenginnering.md` belgesindeki **Faz 1** adımlarını kapsar. Herhangi bir sorunuz varsa:

- Step primitive nasıl eklenir?
- Yeni config nasıl oluşturulur?
- Mevcut wizard nasıl migrate edilir?

Sormaktan çekinmeyin! 🚀
