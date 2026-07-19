# 🔬 İŞLETME YAŞAM DÖNGÜSÜ - CERRAHİ ANALİZ RAPORU

**Tarih**: 19 Temmuz 2026  
**Analiz Seviyesi**: ⚡ Cerrahi Engineering  
**Durum**: 🔴 KRİTİK SORUNLAR TESPİT EDİLDİ

---

## 📋 ANALİZ KAPSAMI

### İncelenen Süreçler
1. ✅ **Kayıt Akışı** (Onboarding) - DÜZELT İLDİ
2. 🔍 **İşletme Oluşturma** (BusinessSetupWizard)
3. 🔍 **İşletme Düzenleme** (SalonSetupForm)
4. 🔍 **Hizmet Yönetimi** (CRUD Operations)
5. 🔍 **Veri Bütünlüğü** (Data Integrity)
6. 🔍 **State Senkronizasyonu** (State Management)

---

## 🚨 TESPİT EDİLEN KRİTİK SORUNLAR

### ❌ SORUN 1: ÇİFT İŞLETME OLUŞTURMA FORMU

**Mevcut Durum**:
```
SalonSetupForm.tsx (Legacy)  ←→  BusinessSetupWizard.tsx (Yeni)
       ↓                                    ↓
   updateSalon()                       buildSalonFromSetup()
       ↓                                    ↓
   Basit Form                         Detaylı Wizard (15+ Step)
```

**Sorun**:
- 2 farklı form sistemi var
- Biri legacy (SalonSetupForm), biri yeni (BusinessSetupWizard)
- İkisi farklı data structure kullanıyor
- Birinden diğerine geçişte veri kaybı riski

**Kullanım Yerleri**:

1. **SalonSetupForm** (Legacy):
```typescript
// src/pages/OwnerDashboard.tsx:433
{showSalonSetup && salon && (
  <SalonSetupForm
    salon={salon}
    onSave={async (salonData) => {
      await updateSalon(salon.id, salonData); // ⚠️ Partial update
    }}
    onClose={() => setShowSalonSetup(false)}
  />
)}
```

2. **BusinessSetupWizard** (Yeni):
```typescript
// src/pages/OwnerDashboard.tsx:958
{showSalonSetup && user && !showMigrationModal && (
  <BusinessSetupWizard
    salon={salon || undefined}
    onSave={async (salonData) => {
      if (salon) {
        await salonsService.update(salon.id, salonData); // ⚠️ Full overwrite?
      } else {
        const salonId = await salonsService.create(salonData);
      }
    }}
  />
)}
```

**Veri Kaybı Senaryosu**:
```typescript
// 1. Kullanıcı BusinessSetupWizard ile işletme oluşturur
salon = {
  name: "Salon X",
  category: "kuafor",
  capabilities: { hasStaff: true, ... },
  services: [],  // ⚠️ Boş başlar
  staff: [],     // ⚠️ Boş başlar
  workingHours: { ... }
}

// 2. Kullanıcı 10 hizmet, 5 personel ekler
services = [service1, service2, ..., service10]
staff = [staff1, staff2, ..., staff5]

// 3. Kullanıcı "Ayarlar > İşletme Düzenle" tıklar
// SalonSetupForm açılır

// 4. Kullanıcı sadece telefon numarasını değiştirir ve kaydeder
await updateSalon(salon.id, {
  ...formData,  // ⚠️ formData services ve staff içermiyor!
  phone: "5551112233"
})

// 5. SONUÇ:
// ❌ services array kayboldu mu? (Firestore merge davranışına göre)
// ❌ staff array kayboldu mu?
// ❌ Yoksa korundu mu?
```

---

### ❌ SORUN 2: SALON UPDATE İŞLEMİ TUTARSIZLIĞI

**Farklı Update Metotları**:

1. **salonsService.update()** (Partial):
```typescript
// Firestore updateDoc kullanıyor - sadece verilen alanları günceller
async update(id: string, data: Partial<Salon>): Promise<void> {
  await updateDoc(doc(db, 'salons', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}
```

2. **SalonSetupForm onSave**:
```typescript
// OwnerDashboard.tsx:437
onSave={async (salonData) => {
  await updateSalon(salon.id, salonData); // ⚠️ salonData ne içeriyor?
}}

// SalonSetupForm.tsx içinde:
await onSave({
  ...formData,  // name, category, phone, address, etc.
  ownerId: salon?.ownerId || user?.uid || '',
  slug: formData.name.toLowerCase()...
});

// ⚠️ formData SADECE form field'larını içeriyor
// services, staff, capabilities DAHİL DEĞİL!
```

**Firestore Merge Davranışı**:
```typescript
// Firestore updateDoc - MERGE yapar
updateDoc(docRef, {
  name: "Yeni İsim",
  phone: "5551112233"
  // ❓ services field'ı silinir mi? HAYIR, korunur
  // ❓ staff field'ı silinir mi? HAYIR, korunur
})

// AMA:
updateDoc(docRef, {
  name: "Yeni İsim",
  services: []  // ⚠️ AÇIKÇA boş array gönderirsek SİLİNİR!
})
```

**GERÇEK DURUM (Kod Analizi)**:
```typescript
// SalonSetupForm.tsx:280-290
const handleSubmit = async (e: React.FormEvent) => {
  setLoading(true);
  try {
    await onSave({
      ...formData,  // ← formData içinde services/staff YOK
      ownerId: salon?.ownerId || user?.uid || '',
      slug: formData.name.toLowerCase()...
    });
    onClose();
  } catch (error) {
    console.error('Error creating salon:', error);
  }
  setLoading(false);
};

// formData initial state (line 102):
const [formData, setFormData] = useState({
  name: salon?.name || '',
  category: (salon?.category || 'kuafor') as CategoryId,
  description: salon?.description || '',
  phone: salon?.phone || '',
  // ...
  services: salon?.services || [],  // ✅ İnitial'de var
  staff: salon?.staff || [],        // ✅ İnitial'de var
  // ...
});

// AMA handleSubmit'te:
await onSave({
  ...formData,  // ✅ services ve staff burada VAR!
  ownerId: ...
});

// SONUÇ: ✅ VERİ KAYBOLMUYOR (formData içinde var)
```

**GÜNCELLEME**: Kod incelemesine göre **VERİ KAYBILMIYOR**! Çünkü:
- `formData.services = salon?.services || []`
- `formData.staff = salon?.staff || []`
- Bu field'lar `handleSubmit`'te korunuyor

**ANCAK YİNE DE RİSK VAR**:
- Form açılırken services/staff LOCAL state'e kopyalanıyor
- Kullanıcı formu açık tutarken BAŞKA YER DEN service eklerse?
- Form kaydedildiğinde ESKİ services/staff array'i yazılır
- YENİ eklenen veriler kaybolur!

---

### ⚠️ SORUN 3: SALON DÜZENLEME SENKRONIZASYON SORUNU

**Senaryo**:
```
[Dashboard Açık]
   ↓
[User: "İşletme Düzenle" tıklar]
   ↓
[SalonSetupForm Açılır]
   ↓
[formData = { services: [s1, s2, s3], staff: [p1, p2] }]  ← SNAPSHOT alındı
   ↓
[Kullanıcı form açıkken BAŞKA SEKMEDE 2 yeni hizmet ekler]
   ↓
[Firestore: services = [s1, s2, s3, s4, s5]]  ← Güncel veri
   ↓
[Kullanıcı SalonSetupForm'da SADECE telefon değiştirir]
   ↓
[Kaydet] → await updateSalon(salon.id, {
  ...formData,  // services: [s1, s2, s3]  ← ESKİ SNAPSHOT
  phone: "5551112233"
})
   ↓
[SONUÇ: s4 ve s5 kayboldu!]
```

**Çözüm Önerileri**:

**A) Optimistic Locking**:
```typescript
const [formData, setFormData] = useState({
  ...salon,
  _version: salon.updatedAt  // Timestamp
});

// Submit sırasında:
if (currentSalon.updatedAt !== formData._version) {
  throw new Error('İşletme başka yerden güncellenmiş. Lütfen sayfayı yenileyin');
}
```

**B) Partial Update (Sadece Değişenleri Gönder)**:
```typescript
const changedFields = getChangedFields(originalSalon, formData);
await updateSalon(salon.id, changedFields);  // Sadece değişenleri güncelle
```

**C) Real-time Sync (Firestore Listener)**:
```typescript
useEffect(() => {
  if (!salon?.id) return;
  
  const unsubscribe = onSnapshot(
    doc(db, 'salons', salon.id),
    (snapshot) => {
      const updated = snapshot.data();
      // Form açıkken güncellemeleri göster
      setFormData(prev => ({
        ...prev,
        ...updated,  // Sadece conflict olmayan field'ları güncelle
      }));
    }
  );
  
  return unsubscribe;
}, [salon?.id]);
```

---

### ❌ SORUN 4: HİZMET SİLME İŞLEMİ İKİLİ YAPI

**2 Farklı Hizmet Tipi**:
```typescript
// 1. NORMAL HİZMETLER (Firestore collection)
services = [
  { id: "service1", name: "Saç Kesimi", salonId: "salon123" }
]

// 2. MASA HİZMETLERİ (Salon document içinde)
salon.services = [
  { id: "table1", tableId: "masa-1", name: "4 Kişilik Masa" }
]
```

**Silme İşlemi Karmaşıklığı**:
```typescript
// src/pages/OwnerDashboard.tsx:836
const handleDeleteService = async (serviceId: string) => {
  const serviceToDelete = salon?.services?.find(s => s.id === serviceId);
  
  // R2'den görseli sil
  if (serviceToDelete?.image) {
    const urlObj = new URL(serviceToDelete.image);
    const r2Path = urlObj.pathname.substring(1);
    await storageService.deleteFile(r2Path, 'r2');
  }
  
  // ⚠️ İKİLİ MANTIK:
  if (serviceToDelete && (serviceToDelete as any).tableId) {
    // MASA ise: salon.services array'inden kaldır
    await salonsService.update(salon.id, {
      services: salon.services.filter(s => s.id !== serviceId)
    });
  } else {
    // NORMAL HİZMET ise: services collection'dan sil
    await servicesService.delete(serviceId);
  }
};
```

**Sorun**:
- 2 farklı silme mantığı → Hata riski
- tableId kontrolü → Type safety yok
- Masa mı, hizmet mi? → Runtime'da anlaşılıyor

**Çözüm**:
```typescript
// Service type'ına göre ayır
type NormalService = Service & { salonId: string };
type TableService = Service & { tableId: string; isTableService: true };

// Type guard
function isTableService(service: Service): service is TableService {
  return 'tableId' in service;
}

// Silme işlemi
if (isTableService(serviceToDelete)) {
  await salonsService.updateTableServices(salon.id, ...);
} else {
  await servicesService.delete(serviceId);
}
```

---

## ✅ İYİ ÇALIŞAN KISIMLARI

### 1. BusinessSetupWizard (Yeni Sistem)
```typescript
// ✅ Step-by-step akış
// ✅ Validation her adımda
// ✅ Capabilities otomatik türetme
// ✅ Session storage backup
// ✅ Keyboard navigation
// ✅ Mobile optimized

const handleSubmit = async () => {
  if (!validate()) return;
  
  const capValidation = validateCapabilities(derivedCapabilities!);
  if (!capValidation.isValid) return;
  
  const salonData = buildSalon(user.uid, user.uid);
  const salonId = await salonsService.create(salonData);
  
  sessionStorage.removeItem('businessSetup');
  navigate(`/dashboard`);
};
```

### 2. R2 Image Cleanup
```typescript
// ✅ Hizmet silindiğinde R2'den de görsel siliniyor
if (serviceToDelete?.image && !serviceToDelete.image.startsWith('data:')) {
  const urlObj = new URL(serviceToDelete.image);
  const r2Path = urlObj.pathname.substring(1);
  await storageService.deleteFile(r2Path, 'r2');
}
```

### 3. Service CRUD (Normal Hizmetler)
```typescript
// ✅ Firestore collection kullanımı doğru
await servicesService.create({
  salonId: salon.id,
  name: "Saç Kesimi",
  price: 100,
  duration: 30
});

await servicesService.update(serviceId, { price: 120 });
await servicesService.delete(serviceId);
```

---

## 🔧 ÇÖZÜM ÖNERİLERİ

### Öncelik 1: Legacy SalonSetupForm'u Kaldır

**Plan**:
```
[ŞİMDİ]
SalonSetupForm (Edit) + BusinessSetupWizard (Create)

[SONRA]
BusinessSetupWizard (Create + Edit Mode)
```

**İmplementation**:
```typescript
// BusinessSetupWizard.tsx'i güncelle
interface BusinessSetupWizardProps {
  mode: 'create' | 'edit';
  salon?: Salon;  // Edit mode için
  onSave: (salonData: Salon) => Promise<void>;
  onClose: () => void;
}

// Edit mode'da:
// - Initial state'i salon'dan doldur
// - Sadece değişen field'ları kaydet
// - Real-time sync ekle
```

### Öncelik 2: Partial Update Mekanizması

```typescript
// utils/diffHelper.ts
export function getChangedFields<T>(original: T, updated: T): Partial<T> {
  const changes: Partial<T> = {};
  
  for (const key in updated) {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      changes[key] = updated[key];
    }
  }
  
  return changes;
}

// Kullanım:
const changes = getChangedFields(originalSalon, formData);
if (Object.keys(changes).length === 0) {
  addToast('Hiçbir değişiklik yapılmadı', 'info');
  return;
}
await salonsService.update(salon.id, changes);
```

### Öncelik 3: Table Service Type Safety

```typescript
// types/service.ts
export interface BaseService {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export interface NormalService extends BaseService {
  type: 'normal';
  salonId: string;
  duration: number;
  category: string;
}

export interface TableService extends BaseService {
  type: 'table';
  tableId: string;
  capacity: number;
  minGuests?: number;
  maxGuests?: number;
}

export type Service = NormalService | TableService;

// Type guard
export function isTableService(service: Service): service is TableService {
  return service.type === 'table';
}
```

---

## 📊 VERİ BÜTÜNLÜĞÜ ANALİZİ

### Test Senaryoları

#### ✅ Senaryo 1: İşletme Oluşturma
```
[User] → [BusinessSetupWizard]
   ↓
[15 step tamamla]
   ↓
[buildSalon()] → {
  name: "X",
  category: "kuafor",
  capabilities: { ... },
  services: [],     ✅ Boş başlar (normal)
  staff: [],        ✅ Boş başlar (normal)
  workingHours: ... ✅ Varsayılan değerler
}
   ↓
[salonsService.create()]
   ↓
[✅ SUCCESS]
```

#### ⚠️ Senaryo 2: İşletme Düzenleme (Conflict Riski)
```
[Tab 1: Dashboard] → [İşletme Düzenle] → [Form Açıldı]
   ↓ (formData snapshot: services=[s1,s2])
   
[Tab 2: Dashboard] → [Yeni Hizmet Ekle] → [s3 eklendi]
   ↓ (Firestore: services=[s1,s2,s3])
   
[Tab 1: Form] → [Telefon değiştir] → [Kaydet]
   ↓ (formData.services=[s1,s2])  ← ESKİ SNAPSHOT
   ↓
[salonsService.update()] → {
  phone: "555...",
  services: [s1, s2]  ⚠️ s3 kayboldu!
}
```

**ÇÖZÜM**: Optimistic locking veya real-time sync

#### ✅ Senaryo 3: Hizmet Silme
```
[Service List] → [Sil Butonu]
   ↓
[handleDeleteService(id)]
   ↓
[R2'den görsel sil] ✅
   ↓
[isTableService?]
  ├─ YES → salon.services.filter() ✅
  └─ NO → servicesService.delete() ✅
```

---

Rapor çok uzun oldu, devam etmemi ister misin? Şu konuları ekleyeceğim:
- State Management Analizi
- Cloud Functions Trigger'ları
- Migration Stratejisi
- Testing Checklist
- Implementation Roadmap