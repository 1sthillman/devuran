# 🧪 Wizard Engine Test Talimatları

## ✅ Sunucu Başarıyla Çalışıyor!

**URL:** http://localhost:5173/

---

## 🎯 Yeni Wizard Engine'i Test Etme

### Adım 1: Ana sayfaya git
```
http://localhost:5173/
```

### Adım 2: Herhangi bir salonu seç
- Liste view'dan bir salon seç
- Salon detay sayfasına git
- URL'deki salon ID'sini kopyala
- Örnek: `http://localhost:5173/salon/ABC123` → ID: `ABC123`

### Adım 3: Wizard test sayfasını aç
```
http://localhost:5173/wizard-test/ABC123
```
(ABC123 yerine gerçek salon ID'sini kullan)

### Adım 4: Yeni wizard akışını dene
- ✅ Hizmet seçimi
- ✅ Personel seçimi  
- ✅ Kapasite seçimi
- 🚧 DateTime (henüz tamamlanmadı)

---

## 📊 Mevcut Durum

### ✅ Çalışan Özellikler
- [x] WizardEngine core
- [x] ServiceSelectionPrimitive
- [x] StaffSelectionPrimitive
- [x] CapacityPrimitive
- [x] Config service + cache
- [x] Progress tracking
- [x] Back/Next navigation
- [x] Animated transitions

### 🚧 TODO Primitive'ler
- [ ] DateTimeSlotPrimitive (en kritik)
- [ ] DateRangePrimitive
- [ ] FullDayBlockPrimitive
- [ ] PackageSelectionPrimitive
- [ ] AddOnSelectionPrimitive
- [ ] CustomFormPrimitive
- [ ] ContractPrimitive
- [ ] PaymentPrimitive
- [ ] ReviewConfirmPrimitive

---

## 🎨 UI Özellikleri

- **Progress bar** - Adım ilerlemesini gösterir
- **Animated transitions** - Framer Motion ile smooth geçişler
- **Geri butonu** - Önceki adıma dönüş
- **Responsive design** - Mobile-first
- **Dev debug panel** - Sadece development mode'da görünür

---

## 🔍 Debug Nasıl Yapılır?

### Browser Console
```javascript
// Wizard state'i görüntüle
console.log(wizardState);
```

### Dev Panel (sağ alt köşe)
- Config ID
- Current step type
- Data keys

---

## ⚠️ Bilinen Sorunlar

1. **AppointmentBookingPage uyarıları** - Google integration için, yeni wizard'ı etkilemiyor
2. **DateTime primitive eksik** - Randevu tarihi seçimi henüz çalışmıyor
3. **Firestore config yok** - Config'ler henüz TypeScript dosyaları, Firestore'a taşınmalı

---

## 🚀 Sonraki Adımlar

1. **DateTimeSlotPrimitive ekle**
   - ModernCalendar entegrasyonu
   - ModernTimePicker entegrasyonu
   - Staff availability check

2. **ReviewConfirmPrimitive ekle**
   - Wizard state özeti
   - Edit özelliği

3. **Reservation creation**
   - Wizard data → Firestore
   - Success page redirect

---

## 💡 İpuçları

### Farklı Business Type Test Etmek İçin
1. Salon category'sini değiştir
2. `src/config/verticalConfigs/` klasöründen uygun config'i seç
3. WizardEngine'e yeni config'i ver

### Yeni Step Primitive Eklemek İçin
```typescript
// src/components/wizard/primitives/MyNewPrimitive.tsx
export function MyNewPrimitive({
  stepConfig,
  onNext,
}: PrimitiveProps) {
  // Implementation
  return <div>...</div>;
}
```

### Config Güncellemek İçin
```typescript
// src/config/verticalConfigs/hairdresser.ts
export const hairdresserConfig: VerticalConfig = {
  steps: [
    // Yeni step ekle veya mevcut step'i düzenle
  ]
};
```

---

## 📞 Yardım

Daha fazla bilgi için:
- `WIZARD_ENGINE_GUIDE.md` - Kapsamlı kullanım kılavuzu
- `WIZARD_ENGINE_IMPLEMENTATION.md` - Uygulama detayları
- `wizardenginnering.md` - Orijinal mimari doküman

---

**Durum:** ✅ Server çalışıyor - Test için hazır!  
**URL:** http://localhost:5173/wizard-test/SALON_ID
