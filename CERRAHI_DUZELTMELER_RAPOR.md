# 🏥 CERRAHİ DÜZELTMELER RAPORU
## Profesyonel Mühendislik Standartlarında İşletme Wizard Sistemi Revizyonu

**Tarih:** 20 Temmuz 2026  
**Kapsam:** İşletme oluşturma wizard'ı, booking type resolver, capabilities model, dashboard modülleri  
**Kritiklik:** P0 - Production blocking issues

---

## 📋 YÖNETİCİ ÖZETİ

Sistemde **5 kritik mimari sorun** ve **çok sayıda teknik borç** tespit edildi:

### Kritik Sorunlar (P0)
1. ✅ **ÇÖZÜLDÜ** - `consultation` booking model eksikti → Düğün/etkinlik organizasyonları yanlış wizard'a düşüyor
2. ❌ **ÇÖZÜLECEK** - BusinessSetupWizard salonId'yi user profile'a yazmıyor → Dashboard "işletme yok" hatası
3. ❌ **ÇÖZÜLECEK** - İki paralel işletme setup sistemi (8 adımlı + 5 adımlı) → Kafa karışıklığı
4. ❌ **ÇÖZÜLECEK** - Terk edilmiş wizard dosyaları (WizardEngine, WizardBuilder vb.)
5. ❌ **ÇÖZÜLECEK** - businessPresets.ts'de shallow copy mutation riski

### Etki Analizi
- **Müşteri Deneyimi:** 🔴 Kritik - Yanlış wizard'a yönlendirme, kayıp rezervasyonlar
- **İşletme Sahibi:** 🔴 Kritik - Dashboard açılmıyor, işletme görünmüyor
- **Kod Kalitesi:** 🟡 Orta - Teknik borç birikimi, karmaşık maintenance
- **Ölçeklenebilirlik:** 🟡 Orta - Yeni kategori eklemek riskli

---

## 🔍 DETAYLI BULGULAR

### BULGU #1: User Profile'da SalonId Eksik ✅ ÇÖZÜLDÜ
**Dosya:** `src/components/business/BusinessSetupWizard.tsx` (satır 263-279)  
**Durum:** ✅ Kod zaten doğru, ama BusinessSetup.tsx'te kullanılmayan sistem var

**Problem:**
```typescript
// ❌ YANLIŞ YER - BusinessSetup.tsx (kullanılmayan kod)
const salonId = await salonsService.create(salonData);
// salonId user profile'a yazılmıyor! ❌
```

**Çözüm:**
```typescript
// ✅ DOĞRU - BusinessSetupWizard.tsx içinde zaten var
const salonId = await salonsService.create(salonData);
const { authService } = await import('@/services/authService');
await authService.updateUserProfile(user.uid, { salonId }); // ✅ Yazılıyor
```

**Aksiyon:** BusinessSetup.tsx'in kullanımını kaldırıp tüm akışı BusinessSetupWizard.tsx'e yönlendir.

---

### BULGU #2: Consultation Booking Model Eksikti ✅ ÇÖZÜLDÜ
**Dosya:** `src/types/businessCapabilities.ts`, `src/utils/bookingTypeResolver.ts`  
**Durum:** ✅ Zaten düzeltilmiş

**Ne Yapıldı:**
- `BookingModel` tipine `'consultation'` eklendi
- 5 yeni preset eklendi (düğün, nişan, evlilik teklifi, doğum günü, kurumsal)
- `bookingTypeResolver.ts`'de consultation → project mapping eklendi

**Sonuç:** Düğün/etkinlik organizasyonları artık doğru wizard'a yönleniyor.

---

### BULGU #3: İki Paralel Setup Sistemi
**Sorun:** Repo'da iki farklı işletme oluşturma wizard'ı var:

#### Sistem A: BusinessSetup.tsx + useBusinessSetup (8 adım)
- Soru-cevap tabanlı
- `businessSetupQuestions.ts` konfigürasyonu
- `businessSetupEngine.ts` ile capabilities türetme
- **SORUN:** `salonId` user profile'a yazılmıyor ❌

#### Sistem B: BusinessSetupWizard.tsx (5 adım - dashboard'tan erişilebilen)
- Form tabanlı
- CategorySelection, BasicInfo, AddressInfo, MediaUpload, WorkingHours
- **DOĞRU:** `salonId` user profile'a yazılıyor ✅

**Karar Gerekli:** Hangi sistem production'da kullanılacak?

---

### BULGU #4: Terk Edilmiş Wizard Dosyaları
**Konum:** Repo kökünde (src/ dışında)

```
/WizardBuilder.tsx (26KB) ❌
/DynamicWizardRunner.tsx (16KB) ❌
/wizardSchemaService.ts ❌
/wizardSchema.ts ❌
```

**Sorun:** 
- Hiçbir yerden import edilmiyor
- src/ içindeki dosyalarla isim çakışması (karışıklık riski)
- Yeni geliştirici yanlış dosyayı düzenleyebilir

**Önerilen Aksiyon:** SİL

---

### BULGU #5: Shallow Copy Mutation Riski
**Dosya:** `src/config/businessPresets.ts`  
**Satır:** `getPresetCapabilities()` fonksiyonu

**Problem:**
```typescript
// ❌ ÖNCE - Shallow copy
export function getPresetCapabilities(presetId: string): BusinessCapabilities | null {
  const preset = BUSINESS_PRESETS[presetId];
  if (!preset) return null;
  return { ...preset }; // bookingModels array'i aynı referans!
}
```

**Sonuç:** `bookingModels` array'ine `.push()` yapılırsa orijinal preset bozulur.

**Çözüm:**
```typescript
// ✅ SONRA - Deep clone
export function getPresetCapabilities(presetId: string): BusinessCapabilities | null {
  const preset = BUSINESS_PRESETS[presetId];
  if (!preset) return null;
  return structuredClone(preset); // Tam izolasyon
}
```

**Durum:** ✅ Kod zaten düzeltilmiş (satır 334)

---

### BULGU #6: WizardEngine Yarım Kalmış
**Dosya:** `src/components/wizard/WizardEngine.tsx`  
**Durum:** Sadece test sayfasında kullanılıyor, production'a bağlı değil

**Özellikler:**
- 11 adım tipi tanımlı (ServiceSelection, StaffSelection, DateTimeSlot vb.)
- Sadece 3 adım implement edilmiş
- 8 adım "TODO" placeholder

**Karar Gerekli:** Tamamlanacak mı, silinecek mi?

---

## 🎯 ÖNCELİKLİ AKSİYON PLANI

### Sprint 1: Kritik Düzeltmeler (P0)
**Süre:** 2-3 gün

1. **BusinessSetup.tsx Temizliği**
   - [ ] Bu dosyayı kullanıma kapat
   - [ ] Tüm flow'u BusinessSetupWizard.tsx'e yönlendir
   - [ ] Route kontrolü: `/business-setup` → BusinessSetupWizard render etmeli
   - [ ] Test: Yeni işletme oluştur → salonId user profile'da olmalı

2. **Terk Edilmiş Dosyaları Temizle**
   - [ ] Kök dizindeki wizard dosyalarını sil
   - [ ] `WizardTestPage.tsx`'i sil (sadece test amaçlı)
   - [ ] Import kontrolü: Silinen dosyalara referans var mı?

3. **Doğrulama Testleri**
   - [ ] Her kategori preset'i için booking type mapping test et
   - [ ] Dashboard açılış akışını tüm kategoriler için test et
   - [ ] SalonId'nin user profile'a yazıldığını doğrula

### Sprint 2: Kod Kalitesi (P1)
**Süre:** 3-4 gün

4. **Tek Sistem Kararı**
   - [ ] Hangi wizard sistemi kalacak? (8 adımlık mı, 5 adımlık mı?)
   - [ ] Diğer sistemi deprecate et
   - [ ] Migration planı hazırla (varsa mevcut işletmeler için)

5. **WizardEngine Kararı**
   - [ ] Option A: Tamamla (8 adımı implement et)
   - [ ] Option B: Sil (şu anki wizard'lar yeterli)
   - [ ] Tercih: **Option B** (YAGNI prensibi - şimdilik gerek yok)

6. **Type Safety İyileştirmeleri**
   - [ ] BookingType ve BookingModel arasında net mapping
   - [ ] Capabilities validation'ı güçlendir
   - [ ] Dashboard module visibility logic'i centralize et

### Sprint 3: Dokümantasyon & Test (P2)
**Süre:** 2 gün

7. **Kapsamlı Dokümantasyon**
   - [ ] Her booking model için wizard mapping dokümanı
   - [ ] Yeni kategori ekleme kılavuzu
   - [ ] Capabilities model şeması

8. **Test Coverage**
   - [ ] Unit testler: bookingTypeResolver
   - [ ] Unit testler: businessSetupEngine
   - [ ] Integration testler: Wizard flow end-to-end
   - [ ] Visual regression testler (her kategori wizard'ı)

---

## 🏗️ MİMARİ ÖNERİLER

### 1. Tek Kaynak Prensibi (Single Source of Truth)
**Şu an:** 2 farklı preset sistemi (`BUSINESS_PRESETS` ve `CATEGORY_PRESETS`)  
**Hedef:** Birleştir → `businessCapabilities.ts` tek kaynak olmalı

### 2. Kategori Bağımsızlığı
**Şu an:** Bazı yerlerde hala `category` string'i kullanılıyor  
**Hedef:** Sadece `capabilities` nesnesine bak, kategori adı UI için etiket olsun

### 3. Wizard Seçim Mantığı
**Şu an:** `determineBookingType()` fonksiyonu karmaşık  
**Hedef:** Basitleştir - her booking model direkt wizard'a map edilmeli

```typescript
// ✅ ÖNERİLEN YAPı
const BOOKING_MODEL_TO_WIZARD = {
  appointment: SlotBookingWizard,
  reservation: (caps) => caps.isDateRangeBased ? NightlyBookingWizard : SlotBookingWizard,
  order: OrderBookingWizard,
  rental: DailyRentalWizard,
  consultation: ProjectBookingWizard,
  'walk-in-queue': QueueManagementPage
};
```

### 4. Dashboard Modül Sistemi
**Şu an:** `getDashboardModules()` inline logic  
**Hedef:** Dekoratif pattern ile modül sistemi

```typescript
// ✅ ÖNERİLEN YAPı
interface DashboardModule {
  key: string;
  component: React.FC;
  isVisible: (caps: BusinessCapabilities) => boolean;
}

const DASHBOARD_MODULES: DashboardModule[] = [
  { key: 'staff', component: StaffModule, isVisible: (c) => c.hasStaff },
  { key: 'tables', component: TablesModule, isVisible: (c) => c.hasTables },
  // ...
];
```

---

## 📊 BAŞARI METRİKLERİ

### Kod Kalitesi
- [ ] TypeScript strict mode: 0 hata
- [ ] ESLint: 0 warning
- [ ] Test coverage: >80% (kritik modüller)
- [ ] Bundle size: <5% artış

### Kullanıcı Deneyimi
- [ ] İşletme oluşturma süresi: <2 dakika
- [ ] Dashboard yüklenme: <1 saniye
- [ ] Wizard hatası: 0% (production'da)
- [ ] Yanlış wizard yönlendirmesi: 0%

### Geliştirici Deneyimi
- [ ] Yeni kategori ekleme: <30 dakika
- [ ] Wizard düzenleme: Tek dosya
- [ ] Dokümantasyon coverage: %100

---

## 🚨 RİSK ANALİZİ

### Yüksek Risk
- **Mevcut İşletmelerin Migrasyonu:** Capabilities eklenmemiş işletmeler var
- **Çözüm:** `LegacyBusinessMigration` bileşeni zaten mevcut ✅

### Orta Risk
- **Wizard Flow Değişiklikleri:** Kullanıcı alışkanlıklarını bozabilir
- **Çözüm:** A/B test + aşamalı rollout

### Düşük Risk
- **Performans Regresyonu:** Deep clone overhead
- **Çözüm:** Benchmark testleri ekle

---

## ✅ SONUÇ & ÖNERİLER

### Acil Yapılması Gerekenler
1. BusinessSetup.tsx akışını kapat
2. Terk edilmiş wizard dosyalarını sil
3. Her kategori için wizard mapping test et

### Orta Vadeli İyileştirmeler
1. Tek bir preset sistemi kullan
2. WizardEngine'i sil (YAGNI)
3. Dashboard modül sistemini refactor et

### Uzun Vadeli Vizyon
1. No-code wizard builder (işletme sahibi kendi wizard'ını oluşturabilsin)
2. AI-powered kategori önerisi
3. Multi-tenant wizard sharing

---

## 📝 EKLER

### A. Dosya Yapısı Önerisi
```
src/
├── components/
│   ├── business/
│   │   ├── BusinessSetupWizard.tsx ✅ (TEK WIZARD BURASI)
│   │   └── BusinessSetupSteps/ ✅
│   ├── booking/
│   │   ├── BookingWizardRouter.tsx ✅
│   │   └── wizards/
│   │       ├── SlotBookingWizard.tsx ✅
│   │       ├── NightlyBookingWizard.tsx ✅
│   │       ├── DailyRentalWizard.tsx ✅
│   │       ├── ProjectBookingWizard.tsx ✅
│   │       └── OrderBookingWizard.tsx ✅
│   └── wizard/ ❌ (SİL - WizardEngine kullanılmıyor)
├── types/
│   ├── businessCapabilities.ts ✅ (TEK PRESET KAYNAĞ)
│   └── businessSetup.ts ❌ (KULLANILMIYORSA SİL)
├── utils/
│   ├── bookingTypeResolver.ts ✅
│   └── businessSetupEngine.ts ❌ (KULLANILMIYORSA SİL)
└── pages/
    └── BusinessSetup.tsx ❌ (REDIRECT YAPIP KAPAT)
```

### B. Test Checklist
- [ ] Unit: determineBookingType() - tüm booking modeller
- [ ] Unit: getDashboardModules() - tüm capabilities kombinasyonları
- [ ] Integration: BusinessSetupWizard → SalonId yazma
- [ ] Integration: BookingWizardRouter → Doğru wizard seçme
- [ ] E2E: Yeni işletme oluştur → Rezervasyon al
- [ ] E2E: Her kategori için wizard akışı

---

**Hazırlayan:** AI Code Review System  
**Gözden Geçiren:** Beklemede  
**Onaylayan:** Beklemede  

**Sonraki Güncelleme:** Sprint 1 tamamlandığında
