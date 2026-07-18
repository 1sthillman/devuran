# 🎯 DİNAMİK WIZARD SİSTEMİ - ENTEGRASYON PLANI

## 📋 GENEL BAKIŞ

Bu sistem işletmelere **kendi wizard'larını oluşturma** gücü veriyor:

1. **Setup Extra** - İşletme profil wizard'ına ek adımlar
2. **Booking Wizard** - Müşterilere özel rezervasyon formu

**Temel Prensipler:**
- ✅ Mevcut sistemi bozmadan eklenebilir
- ✅ Tamamen opsiyonel
- ✅ Her işletme kendi akışını tasarlayabilir
- ✅ Koşullu mantık desteği (X işaretliyse Y'yi göster)
- ✅ 15+ alan tipi (text, number, phone, email, select, multiselect, toggle, date, time, rating, address, image, info, divider)

---

## 🏗️ MİMARİ YAPISI

### Dosya Organizasyonu
```
src/
├── types/
│   └── wizardSchema.ts              # ✅ EKLE - Şema tipleri
├── services/
│   └── wizardSchemaService.ts       # ✅ EKLE - Firestore CRUD
└── components/
    └── wizard/
        ├── WizardBuilder.tsx        # ✅ EKLE - Owner editörü
        └── DynamicWizardRunner.tsx  # ✅ EKLE - Wizard runner
```

### Firestore Koleksiyonları
```
salons/{salonId}/wizardSchemas/{schemaId}  → WizardSchema
wizardResponses/{responseId}               → WizardResponse
```

---

## 🎨 ENTEGRASYON NOKTALARI

### 1. OwnerDashboard - Settings Sekmesi

**Yeni Kart: "Özel Formlar ve Adımlar"**

```
┌─────────────────────────────────────────┐
│ 🔷 Özel Formlar ve Adımlar              │
│ Profil sihirbazınıza veya rezervasyon  │
│ akışına kendi sorularınızı ekleyin     │
├─────────────────────────────────────────┤
│ [Rezervasyon Sorularım]  [Profil Ek]    │
│  Müşteri randevu          İşletme       │
│  alırken sorulacak        profil ek     │
│  özel sorular             adımları      │
└─────────────────────────────────────────┘
```

**State Eklemeleri:**
```typescript
const [showWizardBuilder, setShowWizardBuilder] = useState<'setup_extra' | 'booking' | null>(null);
const [expandedSettings, setExpandedSettings] = useState({
  ...existing,
  customWizards: false,
});
```

---

### 2. BusinessSetupWizard - Ek Adım Entegrasyonu

**Akış:**
```
5 Adım (Mevcut) → [Tamamla] → Ek Adımlar Var mı? 
                              ├─ Evet → DynamicWizardRunner aç
                              └─ Hayır → Dashboard'a git
```

**Kod:**
```typescript
// OwnerDashboard.tsx
const [extraSetupSchema, setExtraSetupSchema] = useState<WizardSchema | null>(null);
const [showExtraSetup, setShowExtraSetup] = useState(false);

useEffect(() => {
  if (salon?.id) {
    wizardSchemaService.listByKind(salon.id, 'setup_extra').then((schemas) => {
      setExtraSetupSchema(schemas.find((s) => s.isActive) || null);
    });
  }
}, [salon?.id]);

// BusinessSetupWizard onSave sonrası
onSave={async (salonData) => {
  await salonsService.update(salon.id, salonData);
  await loadData();
  setShowSalonSetup(false);
  
  // ✅ Ek adımlar varsa aç
  if (extraSetupSchema) {
    setShowExtraSetup(true);
  }
}}

// Ek adım runner'ı
{showExtraSetup && extraSetupSchema && (
  <DynamicWizardRunner
    schema={extraSetupSchema}
    onComplete={async (answers) => {
      await salonsService.update(salon.id, { 
        extraProfileAnswers: answers 
      });
      setShowExtraSetup(false);
      await loadData();
    }}
    onClose={() => setShowExtraSetup(false)}
  />
)}
```

---

### 3. Rezervasyon Akışı - Müşteri Formu

**Akış:**
```
Hizmet Seç → Tarih/Saat Seç → [Rezervasyon Yap]
                              ↓
                    Özel Form Var mı?
                    ├─ Evet → DynamicWizardRunner
                    └─ Hayır → Standart form
```

**Entegrasyon Noktası:**
```typescript
// Müşteri booking sayfasında
const [bookingSchema, setBookingSchema] = useState<WizardSchema | null>(null);
const [showBookingWizard, setShowBookingWizard] = useState(false);

// Salon yüklendiğinde
useEffect(() => {
  if (salonId) {
    wizardSchemaService.listByKind(salonId, 'booking').then((schemas) => {
      setBookingSchema(schemas.find((s) => s.isActive) || null);
    });
  }
}, [salonId]);

// "Rezervasyon Yap" butonunda
const handleReservation = () => {
  if (bookingSchema) {
    setShowBookingWizard(true);
  } else {
    // Standart rezervasyon akışı
    createReservation();
  }
};

{showBookingWizard && bookingSchema && (
  <DynamicWizardRunner
    schema={bookingSchema}
    onComplete={async (answers) => {
      await reservationService.create({
        ...baseReservationData,
        customAnswers: answers
      });
      
      // Response kaydet
      await wizardResponseService.submit({
        schemaId: bookingSchema.id,
        businessId: salonId,
        kind: 'booking',
        answers,
        submittedAt: Date.now(),
      });
      
      setShowBookingWizard(false);
    }}
    onClose={() => setShowBookingWizard(false)}
  />
)}
```

---

## 🎨 WIZARD BUILDER ÖZELLİKLERİ

### Alan Tipleri (15+ Tip)
```typescript
✅ text        - Kısa metin
✅ textarea    - Uzun metin
✅ number      - Sayı (min/max)
✅ phone       - Telefon numarası
✅ email       - E-posta
✅ select      - Tek seçim (radyo)
✅ multiselect - Çoklu seçim (checkbox)
✅ toggle      - Açık/Kapalı
✅ date        - Tarih seçici
✅ time        - Saat seçici
✅ rating      - Yıldız puanlama (1-5)
✅ address_short - Adres alanı
✅ image       - Görsel yükleme
✅ info        - Bilgi kutusu (soru değil)
✅ divider     - Ayırıcı çizgi
```

### Alan Özellikleri
```typescript
✅ label        - Soru metni
✅ helpText     - Yardım açıklaması
✅ placeholder  - Placeholder
✅ required     - Zorunlu mu?
✅ options      - Select/multiselect seçenekleri
✅ min/max      - Number sınırları
✅ visibleIf    - Koşullu görünürlük
```

### Koşullu Mantık
```typescript
// Örnek: "Masa rezervasyonu mu?" toggle'ı açıksa
// "Kaç kişi?" alanını göster

field: {
  label: "Kaç kişi geleceksiniz?",
  type: "number",
  visibleIf: [
    {
      fieldId: "table_reservation_toggle_id",
      operator: "truthy"
    }
  ]
}
```

---

## 📊 KULLANIM SENARYOLARI

### Senaryo 1: Düğün Organizasyon Şirketi
```
Rezervasyon Formu:
1. Düğün tarihiniz? (date)
2. Beklenen davetli sayısı? (number)
3. Mekan tercihiniz? (select: Açık hava / Kapalı salon / Bahçe)
4. Ek hizmetler? (multiselect: DJ, Fotoğrafçı, Video çekimi, Pasta)
5. Özel istekleriniz? (textarea)
```

### Senaryo 2: Restoran
```
Rezervasyon Formu:
1. Masa tipi? (select: Pencere kenarı / Bahçe / Salon içi)
2. Özel gün mü? (toggle)
3. [Eğer özel gün] → Kutlama türü? (select: Doğum günü / Yıldönümü / Evlilik teklifi)
4. Alerjiniz var mı? (toggle)
5. [Eğer alerji var] → Detay belirtin (textarea)
```

### Senaryo 3: Kuaför
```
Profil Ek Adımları:
1. Çalışma ekibiniz kaç kişi? (number)
2. Hangi ürünleri kullanıyorsunuz? (textarea)
3. Sertifikalarınız? (image - çoklu)
4. İndirim kampanyası var mı? (toggle)
5. [Eğer kampanya var] → Kampanya detayları (textarea)
```

---

## 🔒 GÜVENLİK & VALIDASYON

### Firestore Rules
```javascript
match /salons/{salonId}/wizardSchemas/{schemaId} {
  // Sadece salon owner'ı oluşturabilir/düzenleyebilir
  allow create, update: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(salonId)).data.ownerId == request.auth.uid;
  
  // Herkes okuyabilir (müşteriler görmeli)
  allow read: if true;
  
  // Sadece owner silebilir
  allow delete: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(salonId)).data.ownerId == request.auth.uid;
}

match /wizardResponses/{responseId} {
  // Herkes yazabilir (müşteri cevapları)
  allow create: if request.auth != null;
  
  // Sadece işletme sahibi kendi cevaplarını okuyabilir
  allow read: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(resource.data.businessId)).data.ownerId == request.auth.uid;
}
```

### Validasyon Katmanları
```typescript
// 1. Frontend validasyon (WizardSchema)
validateStepAnswers(step, answers)

// 2. Alan bazında validasyon
- required alanlar
- min/max sınırları
- email format kontrolü
- telefon format kontrolü

// 3. Koşullu görünürlük
isFieldVisible(field, answers)
```

---

## 🎯 AŞAMALI ENTEGRASYON PLANI

### Faz 1: Temel Yapı (1-2 gün)
- [x] Dosya yapısını oluştur
- [ ] Types dosyasını ekle (`wizardSchema.ts`)
- [ ] Service dosyasını ekle (`wizardSchemaService.ts`)
- [ ] Firestore rules ekle

### Faz 2: UI Bileşenleri (2-3 gün)
- [ ] `WizardBuilder.tsx` ekle
- [ ] `DynamicWizardRunner.tsx` ekle
- [ ] Tüm alan tiplerine renderer yaz
- [ ] Responsive tasarımı test et

### Faz 3: OwnerDashboard Entegrasyonu (1 gün)
- [ ] Settings'e "Özel Formlar" kartı ekle
- [ ] WizardBuilder'ı bağla
- [ ] State management düzenle

### Faz 4: BusinessSetupWizard Entegrasyonu (1 gün)
- [ ] Ek adım mantığını ekle
- [ ] DynamicWizardRunner'ı bağla
- [ ] Cevapları salon'a kaydet

### Faz 5: Rezervasyon Akışı Entegrasyonu (2 gün)
- [ ] Müşteri booking sayfasını bul
- [ ] DynamicWizardRunner'ı ekle
- [ ] Response kaydetme mantığı
- [ ] Müşteri cevaplarını dashboard'da göster

### Faz 6: Test & İyileştirme (1-2 gün)
- [ ] Tüm alan tiplerini test et
- [ ] Koşullu mantığı test et
- [ ] Mobil responsive testi
- [ ] Edge case'leri test et
- [ ] Performans optimizasyonu

---

## 📝 KOD ÖRNEKLERİ

### WizardBuilder Kullanımı
```tsx
<WizardBuilder
  salonId={salon.id}
  kind="booking" // veya "setup_extra"
  onClose={() => setShowWizardBuilder(null)}
/>
```

### DynamicWizardRunner Kullanımı
```tsx
<DynamicWizardRunner
  schema={schema}
  previewMode={false}
  initialAnswers={{}}
  onComplete={async (answers) => {
    await handleAnswers(answers);
  }}
  onClose={() => setShowRunner(false)}
/>
```

### Şema Oluşturma
```typescript
const schema = createEmptySchema(salonId, 'booking');
schema.name = "Düğün Rezervasyon Formu";
schema.steps = [
  {
    id: "step1",
    title: "Temel Bilgiler",
    subtitle: "Düğününüz hakkında bilgi verin",
    fields: [
      {
        id: "date",
        type: "date",
        label: "Düğün tarihi nedir?",
        required: true
      },
      {
        id: "guest_count",
        type: "number",
        label: "Kaç davetli bekliyorsunuz?",
        required: true,
        min: 50,
        max: 500
      }
    ]
  }
];
```

---

## 🎨 TASARIM TUTARLILIĞI

### Renk Paleti (Mevcut ile Uyumlu)
```css
--void                 /* Arka plan */
--chrome-white         /* Başlıklar */
--muted-lead           /* Yardımcı metinler */
--ash                  /* Placeholder */
```

### Gradient'ler
```css
/* WizardBuilder için */
from-purple-500 to-pink-500

/* DynamicWizardRunner için */
from-purple-600 to-pink-600  /* İleri butonu */
from-emerald-600 to-teal-600  /* Tamamla butonu */
```

### Border Radius
```css
rounded-3xl  /* Kartlar */
rounded-2xl  /* Input'lar */
rounded-xl   /* Butonlar */
rounded-full /* Toggle'lar */
```

---

## 🚀 BAŞARI KRİTERLERİ

### Fonksiyonel
- ✅ Owner wizard oluşturabilmeli
- ✅ Tüm alan tipleri çalışmalı
- ✅ Koşullu mantık doğru çalışmalı
- ✅ Önizleme modu çalışmalı
- ✅ Kayıt/yükleme başarılı olmalı
- ✅ Müşteri wizard'ı doldurabilmeli
- ✅ Cevaplar kaydedilmeli

### Kullanıcı Deneyimi
- ✅ Mobil uyumlu
- ✅ Hızlı ve responsive
- ✅ Sezgisel interface
- ✅ Net hata mesajları
- ✅ Mevcut sistemle görsel uyum

### Teknik
- ✅ Type-safe
- ✅ No memory leaks
- ✅ Performanslı render
- ✅ Clean code
- ✅ Maintainable

---

## 🎯 SONUÇ

**Bu sistem işletmelere ENGİNEERİNG GÜCÜ veriyor:**

- ✅ Her işletme kendi akışını tasarlayabilir
- ✅ Esnek ve güçlü
- ✅ Kolay kullanım
- ✅ Mevcut sistemi bozmaz
- ✅ Tamamen opsiyonel
- ✅ Scalable

**Özellikle yararlı olduğu işletmeler:**
- Düğün organizasyon
- Catering firmaları
- Butik oteller
- Özel etkinlik mekanları
- Premium restoranlar
- Özel hizmet veren kuaförler

**Bu, platformu rakiplerinden ayıran bir özellik!**
