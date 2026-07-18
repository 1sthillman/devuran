# 🎯 DİNAMİK WIZARD ENTEGRASYONu - TAMAMLAMA KILAVUZU

## ✅ TAMAMLANAN ADIMLAR

### 1. Tip Tanımları ✅
- **Dosya:** `src/types/wizardSchema.ts`
- **Durum:** OLUŞTURULDU
- **İçerik:**
  - 15+ alan tipi tanımı
  - Koşullu mantık tipleri
  - Validasyon yardımcıları
  - Şema oluşturucular

### 2. Firestore Servisi ✅
- **Dosya:** `src/services/wizardSchemaService.ts`
- **Durum:** OLUŞTURULDU
- **İçerik:**
  - CRUD işlemleri
  - Şema listleme
  - Aktif/pasif toggle
  - Response kaydetme

### 3. Component Klasörü ✅
- **Klasör:** `src/components/wizard/`
- **Durum:** OLUŞTURULDU

---

## 📝 KALAN ADIMLAR (Sırayla)

### Adım 1: Wizard Component'lerini Ekle

**DynamicWizardRunner.tsx ve WizardBuilder.tsx dosyalarını ekle:**

Bu dosyaları C:/RANDEVU klasöründen kopyalayıp `src/components/wizard/` altına taşı:

```bash
# PowerShell
Copy-Item "C:\RANDEVU\DynamicWizardRunner.tsx" "src\components\wizard\"
Copy-Item "C:\RANDEVU\WizardBuilder.tsx" "src\components\wizard\"
```

**Veya VS Code'da:**
1. `DynamicWizardRunner.tsx` dosyasını aç
2. Tümünü kopyala (Ctrl+A, Ctrl+C)
3. `src/components/wizard/DynamicWizardRunner.tsx` oluştur
4. Yapıştır (Ctrl+V)
5. WizardBuilder.tsx için aynısını tekrarla

---

### Adım 2: OwnerDashboard'a Wizard Builder Ekle

**Dosya:** `src/pages/OwnerDashboard.tsx`

#### 2.1 Import Ekle
```typescript
// Dosyanın en üstüne ekle
import { WizardBuilder } from '@/components/wizard/WizardBuilder';
import { DynamicWizardRunner } from '@/components/wizard/DynamicWizardRunner';
import { wizardSchemaService } from '@/services/wizardSchemaService';
import type { WizardSchema } from '@/types/wizardSchema';
import { Layers } from 'lucide-react';
```

#### 2.2 State Ekle
```typescript
// Component içinde, diğer state'lerle birlikte:
const [showWizardBuilder, setShowWizardBuilder] = useState<'setup_extra' | 'booking' | null>(null);
const [extraSetupSchema, setExtraSetupSchema] = useState<WizardSchema | null>(null);
const [showExtraSetup, setShowExtraSetup] = useState(false);

// expandedSettings state'ine ekle:
const [expandedSettings, setExpandedSettings] = useState<Record<string, boolean>>({
  // ...mevcut alanlar
  customWizards: false, // ✅ EKLE
});
```

#### 2.3 Extra Schema'yı Yükle
```typescript
// useEffect ile salon yüklendiğinde
useEffect(() => {
  if (salon?.id) {
    wizardSchemaService.listByKind(salon.id, 'setup_extra').then((schemas) => {
      setExtraSetupSchema(schemas.find((s) => s.isActive) || null);
    });
  }
}, [salon?.id]);
```

#### 2.4 Settings Sekmesine Kart Ekle

**Konum:** Settings tab'ındaki kartların arasına (örn. "Çalışma Saatleri"nden sonra)

```tsx
{/* Özel Formlar ve Adımlar */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl"
>
  <button
    onClick={() =>
      setExpandedSettings((p) => ({ ...p, customWizards: !p.customWizards }))
    }
    className="w-full p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/[0.08] flex items-center justify-center">
        <Layers size={20} className="text-violet-400" />
      </div>
      <div className="text-left">
        <h3 className="font-heading font-semibold text-base text-[var(--chrome-white)]">
          Özel Formlar ve Adımlar
        </h3>
        <p className="text-xs text-[var(--muted-lead)] mt-0.5">
          Profil sihirbazınıza veya rezervasyon akışına kendi sorularınızı ekleyin
        </p>
      </div>
    </div>
    {expandedSettings.customWizards ? (
      <ChevronUp size={20} className="text-[var(--muted-lead)]" />
    ) : (
      <ChevronDown size={20} className="text-[var(--muted-lead)]" />
    )}
  </button>

  <AnimatePresence>
    {expandedSettings.customWizards && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 border-t border-white/[0.08] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowWizardBuilder('booking')}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/40 text-left transition-all group"
          >
            <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1">
              Rezervasyon Sorularım
            </p>
            <p className="text-xs text-[var(--muted-lead)]">
              Müşteri randevu alırken sorulacak özel sorular
            </p>
          </button>

          <button
            onClick={() => setShowWizardBuilder('setup_extra')}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/40 text-left transition-all group"
          >
            <p className="font-heading font-semibold text-sm text-[var(--chrome-white)] mb-1">
              Profil Sihirbazı Ek Adımları
            </p>
            <p className="text-xs text-[var(--muted-lead)]">
              "İşletmeyi Düzenle" sihirbazına eklenecek ekstra sorular
            </p>
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

#### 2.5 Modal Render Ekle

**Konum:** Component'in return'ünün en sonunda, diğer modallarla birlikte

```tsx
{/* Wizard Builder Modal */}
{showWizardBuilder && salon && (
  <WizardBuilder
    salonId={salon.id}
    kind={showWizardBuilder}
    onClose={() => setShowWizardBuilder(null)}
  />
)}

{/* Extra Setup Wizard */}
{showExtraSetup && extraSetupSchema && (
  <DynamicWizardRunner
    schema={extraSetupSchema}
    onComplete={async (answers) => {
      await salonsService.update(salon.id, { 
        extraProfileAnswers: answers 
      });
      setShowExtraSetup(false);
      await loadData();
      toast.success('Ek bilgiler kaydedildi');
    }}
    onClose={() => setShowExtraSetup(false)}
  />
)}
```

#### 2.6 BusinessSetupWizard'a Bağla

**Konum:** BusinessSetupWizard'ın `onSave` callback'i içinde

```typescript
onSave={async (salonData) => {
  if (salon) {
    // Edit mode
    await salonsService.update(salon.id, salonData);
    await loadData();
  } else {
    // Create mode
    const newSalon = await salonsService.create({
      ...salonData,
      stats: {
        averageRating: 0,
        reviewCount: 0,
        totalAppointments: 0,
      },
      isPremium: false,
      isActive: true,
      isAcceptingBookings: true,
    });
    
    if (user) {
      await authService.updateUserProfile(user.uid, { salonId: newSalon.id });
    }
    
    // ✅ EKLE: Ek adımlar varsa göster
    if (extraSetupSchema) {
      setShowExtraSetup(true);
      return; // Dashboard'a gitme, önce ek adımları tamamlasın
    }
    
    window.location.href = '/dashboard?tab=overview';
    return;
  }
  setShowSalonSetup(false);
}}
```

---

### Adım 3: Firestore Rules Ekle

**Konum:** Firebase Console → Firestore → Rules

```javascript
// Mevcut rules'un içine ekle

// Wizard Schemas - Sadece salon owner'ı yönetebilir
match /salons/{salonId}/wizardSchemas/{schemaId} {
  allow create, update: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(salonId)).data.ownerId == request.auth.uid;
  
  // Herkes okuyabilir (müşteriler görebilmeli)
  allow read: if true;
  
  allow delete: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(salonId)).data.ownerId == request.auth.uid;
}

// Wizard Responses - Müşteri cevapları
match /wizardResponses/{responseId} {
  // Herkes yazabilir (müşteri cevap gönderebilir)
  allow create: if request.auth != null;
  
  // Sadece işletme sahibi okuyabilir
  allow read: if request.auth != null 
    && get(/databases/$(database)/documents/salons/$(resource.data.businessId)).data.ownerId == request.auth.uid;
}
```

---

### Adım 4: Rezervasyon Akışına Entegre Et (Opsiyonel)

**Not:** Bu adım müşteri rezervasyon sayfası hazır olduğunda yapılacak

**Dosya:** `src/pages/SalonDetail.tsx` veya rezervasyon componenti

```typescript
// Import ekle
import { wizardSchemaService, wizardResponseService } from '@/services/wizardSchemaService';
import { DynamicWizardRunner } from '@/components/wizard/DynamicWizardRunner';
import type { WizardSchema } from '@/types/wizardSchema';

// State ekle
const [bookingSchema, setBookingSchema] = useState<WizardSchema | null>(null);
const [showBookingWizard, setShowBookingWizard] = useState(false);

// Schema'yı yükle
useEffect(() => {
  if (salonId) {
    wizardSchemaService.listByKind(salonId, 'booking').then((schemas) => {
      setBookingSchema(schemas.find((s) => s.isActive) || null);
    });
  }
}, [salonId]);

// Rezervasyon butonunda
const handleBooking = () => {
  if (bookingSchema) {
    setShowBookingWizard(true);
  } else {
    // Standart rezervasyon formu
    createReservation();
  }
};

// Modal render
{showBookingWizard && bookingSchema && (
  <DynamicWizardRunner
    schema={bookingSchema}
    onComplete={async (answers) => {
      // Rezervasyon oluştur
      await reservationService.create({
        ...baseReservationData,
        customAnswers: answers
      });
      
      // Response kaydet
      await wizardResponseService.submit({
        schemaId: bookingSchema.id,
        businessId: salonId,
        kind: 'booking',
        customerId: user?.uid,
        answers,
        submittedAt: Date.now(),
      });
      
      setShowBookingWizard(false);
      toast.success('Rezervasyon oluşturuldu');
    }}
    onClose={() => setShowBookingWizard(false)}
  />
)}
```

---

## 🧪 TEST ADIMLARI

### 1. Wizard Builder Testi
1. ✅ Dashboard → Settings → "Özel Formlar" kartını aç
2. ✅ "Rezervasyon Sorularım" butonuna tıkla
3. ✅ WizardBuilder açılmalı
4. ✅ Adım ekle, alan ekle, alan tipi seç
5. ✅ Önizleme çalışmalı
6. ✅ Kaydet başarılı olmalı

### 2. Extra Setup Testi
1. ✅ "Profil Ek Adımları" ile wizard oluştur
2. ✅ İşletme Düzenle → Tamamla
3. ✅ Extra wizard açılmalı
4. ✅ Cevapları doldur → Kaydet
5. ✅ Dashboard'a dönmeli

### 3. Koşullu Mantık Testi
1. ✅ Toggle alan ekle: "Masa rezervasyonu mu?"
2. ✅ Number alan ekle: "Kaç kişi?" (Sadece toggle açıksa göster)
3. ✅ Önizle → Toggle kapat → Alan gizlenmeli
4. ✅ Toggle aç → Alan görünmeli

### 4. Validasyon Testi
1. ✅ Zorunlu alanları boş bırak
2. ✅ İleri butonuna bas
3. ✅ Hata mesajı görmeli
4. ✅ Doldur → İleri gitmeli

---

## 📊 BEKLENEN SONUÇLAR

### Owner Dashboard
```
✅ Settings'de yeni kart var
✅ 2 buton: Rezervasyon Sorularım / Profil Ek Adımları
✅ Wizard Builder açılıyor
✅ Wizard kaydediliyor
✅ Extra setup wizard çalışıyor
```

### Wizard Builder
```
✅ Responsive (mobil + desktop)
✅ Adım ekleme/silme/sıralama
✅ 15+ alan tipi
✅ Alan düzenleme
✅ Koşullu görünürlük
✅ Önizleme modu
✅ Kaydetme
```

### Dynamic Wizard Runner
```
✅ Wizard adımları doğru render
✅ Alan tipleri çalışıyor
✅ Validasyon çalışıyor
✅ Koşullu alanlar gizleniyor/görünüyor
✅ Progress bar çalışıyor
✅ Submit başarılı
```

---

## 🚨 OLASI SORUNLAR & ÇÖZÜMLER

### Sorun 1: Import Hatası
```
Cannot find module '@/components/wizard/WizardBuilder'
```
**Çözüm:** Component dosyalarının doğru yere kopyalandığından emin ol

### Sorun 2: Firestore Permission Denied
```
Missing or insufficient permissions
```
**Çözüm:** Firestore rules'u ekle (Adım 3)

### Sorun 3: Schema Yüklenmiyor
```
wizardSchemaService.listByKind returns []
```
**Çözüm:** 
- Firestore'da koleksiyon var mı kontrol et
- Console'da hata var mı bak
- Network tab'dan request'leri incele

### Sorun 4: Modal Açılmıyor
```
showWizardBuilder true ama modal yok
```
**Çözüm:** 
- z-index çakışması olabilir (99999 olmalı)
- AnimatePresence doğru sarmalanmış mı kontrol et

---

## ✅ TAMAMLANDIĞINDA

**Sistem şunları yapabilir olacak:**

1. ✅ Owner wizard oluşturabilir
2. ✅ 15+ farklı alan tipi
3. ✅ Koşullu mantık (X işaretliyse Y'yi göster)
4. ✅ İşletme profil wizard'ına ek adımlar
5. ✅ Müşteri rezervasyon formları
6. ✅ Cevapları kaydetme
7. ✅ Önizleme modu
8. ✅ Responsive design

**Bu özellik platformu rakiplerinden ayıracak!**

---

## 📞 DESTEK

Entegrasyon sırasında sorun yaşanırsa:
1. Console'da hata mesajlarını kontrol et
2. Network tab'dan API request'leri izle
3. Firestore rules'u doğrula
4. Component import path'lerini kontrol et

**Başarılar! 🎉**
