# ⚡ WIZARD SYSTEM QUICK REFERENCE

**Hızlı Referans Kılavuzu** - Geliştiriciler için

---

## 🚀 HIZLI BAŞLANGIÇ

### Yeni Kategori Ekleme (5 Adım)

1. **Preset Ekle** (`src/config/businessPresets.ts`)
```typescript
'yeni-kategori': {
  capabilities: {
    bookingType: 'slot', // veya 'nightly', 'project', 'consultation'
    features: {
      staffManagement: true, // Personel modülü
      timeSlots: true,
      nightlyBooking: false,
      consultation: false,
    }
  },
  services: [...],
  bookingSettings: {...}
}
```

2. **Category Config Ekle** (`src/config/categories.ts`)
```typescript
{
  id: 'yeni-kategori',
  name: 'Yeni Kategori',
  icon: YourIcon,
  gradient: 'from-purple-500 to-pink-500',
  description: 'Açıklama'
}
```

3. **Routing Kontrol** (`src/utils/bookingTypeResolver.ts`)
- Otomatik çalışır, değişiklik gerekmez ✅

4. **Dashboard Modül** (`src/pages/OwnerDashboard.tsx`)
- Otomatik çalışır, capabilities'e göre ✅

5. **Test Et** ✅

---

## 📁 DOSYA YAPISI

```
src/
├── config/
│   ├── businessPresets.ts       # Kategori presets (KRİTİK)
│   └── categories.ts            # Kategori listesi
│
├── utils/
│   └── bookingTypeResolver.ts   # Wizard routing logic (KRİTİK)
│
├── components/
│   ├── business/
│   │   └── BusinessSetupWizard.tsx  # Owner setup wizard
│   │
│   ├── booking/wizards/
│   │   ├── SlotBookingWizard.tsx     # Slot-based
│   │   ├── NightlyBookingWizard.tsx  # Nightly-based
│   │   └── ProjectBookingWizard.tsx  # Project/Consultation
│   │
│   └── dashboard/modules/
│       ├── OverviewModule.tsx
│       ├── ServicesModule.tsx
│       ├── StaffModule.tsx        # Sadece staffManagement=true
│       └── SettingsModule.tsx
│
└── pages/
    ├── BusinessSetup.tsx         # Kategori seçimi
    ├── OwnerDashboard.tsx        # Dashboard ana sayfa
    └── Booking.tsx               # Customer booking page
```

---

## 🔑 ANA KAVRAMLAR

### BusinessCapabilities
```typescript
interface BusinessCapabilities {
  bookingType: 'slot' | 'nightly' | 'project' | 'consultation';
  features: {
    staffManagement: boolean;
    timeSlots: boolean;
    nightlyBooking: boolean;
    consultation: boolean;
  };
}
```

**Kullanım:**
- `bookingType` → Hangi wizard açılacak
- `staffManagement` → Staff modülü gösterilsin mi
- `timeSlots` → Saat bazlı randevu
- `nightlyBooking` → Gecelik rezervasyon
- `consultation` → Danışmanlık modu

---

## 🎯 BOOKING TYPE ROUTING

| bookingType | Wizard | Örnekler |
|-------------|--------|----------|
| `slot` | SlotBookingWizard | Kuaför, Güzellik, Spor Salonu |
| `nightly` | NightlyBookingWizard | Otel, Bungalov, Apart |
| `project` | ProjectBookingWizard | Düğün, Video Prodüksiyon |
| `consultation` | ProjectBookingWizard | Psikolojik Danışmanlık, Koçluk |

**Önemli:** Consultation da ProjectBookingWizard kullanır (farklı mod)

---

## 💡 SÜREKLARIN KULLANAN FONKSIYONLAR

### 1. Preset Alma
```typescript
import { getBusinessPreset } from '@/config/businessPresets';

const preset = getBusinessPreset('hairdresser');
// ✅ Deep clone döner, güvenle modify edilebilir
```

### 2. Wizard Routing
```typescript
import { getBookingWizardComponent } from '@/utils/bookingTypeResolver';

const WizardComponent = getBookingWizardComponent(salon.capabilities);
// SlotBookingWizard | NightlyBookingWizard | ProjectBookingWizard
```

### 3. Dashboard Modül Kontrolü
```typescript
import { getDashboardModules } from '@/utils/bookingTypeResolver';

const modules = getDashboardModules(salon.capabilities);
if (modules.showStaff) {
  // Staff modülünü göster
}
```

### 4. Terminology
```typescript
import { getBookingTerminology } from '@/utils/bookingTypeResolver';

const term = getBookingTerminology(salon.capabilities);
// { singular: 'Randevu', plural: 'Randevular' }
// veya
// { singular: 'Proje', plural: 'Projeler' }
```

---

## 🔧 YAYGN SENARYOLAR

### Senaryo 1: Staff Modülünü Gizlemek
```typescript
// businessPresets.ts
'video-production': {
  capabilities: {
    bookingType: 'project',
    features: {
      staffManagement: false, // ✅ Staff modülü gizlenir
      // ...
    }
  }
}
```

### Senaryo 2: Gecelik Rezervasyon Eklemek
```typescript
'villa-rental': {
  capabilities: {
    bookingType: 'nightly', // ✅ NightlyBookingWizard kullanılır
    features: {
      nightlyBooking: true,
      // ...
    }
  },
  bookingSettings: {
    minNights: 2, // Minimum gece sayısı
    maxAdvanceBooking: 180, // 6 ay önceden
  }
}
```

### Senaryo 3: Danışmanlık Kategorisi
```typescript
'life-coaching': {
  capabilities: {
    bookingType: 'consultation', // ✅ Consultation mode
    features: {
      consultation: true,
      staffManagement: false,
    }
  },
  services: [
    {
      name: 'Online Seans',
      duration: 60,
      price: 500,
      type: 'online'
    }
  ]
}
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Wizard Açılmıyor
**Problem:** Dashboard'a gidince wizard açılmıyor  
**Çözüm:**
```typescript
// URL'de query param var mı?
/dashboard?show_setup=true&user_category=hairdresser

// OwnerDashboard.tsx'te kontrol
const showSetup = params.get('show_setup') === 'true';
if (showSetup && !salon) {
  setShowSalonSetup(true); // ✅
}
```

### Issue 2: Preset Services Yüklenmiyor
**Problem:** Wizard'da services boş geliyor  
**Çözüm:**
```typescript
// Deep clone kullanıldığından emin ol
const preset = getBusinessPreset(category); // ✅ Otomatik deep clone
// const preset = BUSINESS_PRESETS[category]; // ❌ Reference
```

### Issue 3: Staff Modülü Görünmüyor
**Problem:** Kuaför kategorisinde Staff modülü yok  
**Çözüm:**
```typescript
// capabilities kontrol
const modules = getDashboardModules(salon.capabilities);
console.log(modules.showStaff); // true olmalı

// businessPresets.ts kontrol
features: {
  staffManagement: true, // ✅ Bu true olmalı
}
```

### Issue 4: Yanlış Wizard Açılıyor
**Problem:** Otel kategorisi SlotBookingWizard açıyor  
**Çözüm:**
```typescript
// bookingType kontrol
console.log(salon.capabilities.bookingType);
// 'nightly' olmalı, 'slot' değil

// businessPresets.ts kontrol
capabilities: {
  bookingType: 'nightly', // ✅ Doğru type
}
```

---

## 🎨 UI CUSTOMIZATION

### Wizard Step Ekleme
```typescript
// BusinessSetupWizard.tsx
const STEPS = [
  { id: 'basic', label: 'Temel Bilgiler', component: BasicInfoStep },
  { id: 'services', label: 'Hizmetler', component: ServicesStep },
  { id: 'hours', label: 'Çalışma Saatleri', component: WorkingHoursStep },
  { id: 'media', label: 'Görseller', component: MediaStep },
  { id: 'new-step', label: 'Yeni Step', component: NewStep }, // ✅ Ekle
];
```

### Dashboard Tab Ekleme
```typescript
// src/constants/dashboard.ts
export const DASHBOARD_TABS = [
  { key: 'overview', label: 'Genel', icon: LayoutDashboard },
  { key: 'new-tab', label: 'Yeni Tab', icon: YourIcon }, // ✅ Ekle
];

// OwnerDashboard.tsx
{activeTab === 'new-tab' && <NewModule />}
```

---

## 🔐 GÜVENLİK

### Admin Kontrolü
```typescript
// ✅ DOĞRU
const isSuperAdmin = (user as any)?.customClaims?.admin === true;

// ❌ YANLIŞ (security risk)
const isSuperAdmin = user?.email === 'admin@example.com';
```

### Custom Claims Setup (Backend)
```javascript
// Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
```

---

## 📊 ANALYTICS

### Track Wizard Completion
```typescript
// Wizard complete event
analytics.track('wizard_completed', {
  category: salon.category,
  bookingType: salon.capabilities.bookingType,
  completionTime: Date.now() - startTime,
});
```

### Track Booking Creation
```typescript
// Booking created event
analytics.track('booking_created', {
  salonId: salon.id,
  bookingType: salon.capabilities.bookingType,
  serviceId: booking.serviceId,
});
```

---

## 🧪 TESTING

### Quick Test Command
```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Run dev server
npm run dev
```

### Test Kullanıcı
```typescript
// Test owner account
email: 'test@owner.com'
password: 'test123'
role: 'owner'

// Test customer account
email: 'test@customer.com'
password: 'test123'
role: 'customer'
```

---

## 📞 YARDIM

### Sorun Çözümü
1. **Console'u kontrol et** - Error mesajları
2. **Network tab** - API çağrıları
3. **Redux DevTools** - State değişimleri
4. **TypeScript errors** - `npx tsc --noEmit`
5. **Build errors** - `npm run build`

### Dokümantasyon
- `FINAL_WIZARD_SYSTEM_RAPOR.md` - Detaylı rapor
- `CERRAHI_DUZELTMELER_TAMAMLANDI_FAZ2.md` - Düzeltmeler
- `TEST_WIZARD_SYSTEM.md` - Test planı
- `WIZARD_SYSTEM_QUICK_REFERENCE.md` - Bu dosya

---

## 🎓 BEST PRACTICES

### DO ✅
- Preset kullanırken `getBusinessPreset()` fonksiyonunu kullan
- Deep clone ile çalış
- Capabilities-based visibility kullan
- Type-safe kod yaz
- Error handling ekle
- Loading states göster

### DON'T ❌
- Direct preset reference kullanma
- Hardcoded email ile admin kontrolü yapma
- Props spreading ile Framer Motion karıştırma
- Dead code bırakma
- Type casting'i abuse etme

---

**Quick Reference v1.0**  
**Son Güncelleme:** 2026-07-20  
**Durum:** ✅ READY TO USE
