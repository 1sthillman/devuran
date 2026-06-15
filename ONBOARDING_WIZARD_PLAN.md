# 🎯 MODERN ONBOARDING VE İŞLETME KURULUM SİSTEMİ

## 📋 YENİ AKIŞ

### 1. KAYIT/GİRİŞ (Login.tsx)
**Mevcut Durum:** Basit form + rol seçimi (2 buton)
**Yeni Tasarım:**
- Modern, rezervasyon ayarları benzeri card'lar
- Gradient border, icon'lu seçenekler
- Animasyonlu geçiş
- Mobil uyumlu

```
┌─────────────────────────────────────┐
│         RANDEVU'YA HOŞ GELDİN       │
│                                      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   [ICON]     │  │   [ICON]     │ │
│  │   MÜŞTERİ    │  │   İŞLETME    │ │
│  │              │  │              │ │
│  │ Randevu Al   │  │ Yönet & Kazan│ │
│  └──────────────┘  └──────────────┘ │
│                                      │
│  [Email, Şifre, Kayıt Ol]           │
└─────────────────────────────────────┘
```

### 2. İŞLETME KURULUM WIZARD'I
**6 Step:**

#### Step 1: Kategori Seçimi
- İşletme tipi seçimi
- Grid layout, icon'lu kartlar
- Arama özelliği
- "İleri" butonu

#### Step 2: Temel Bilgiler
- İşletme adı *
- Telefon *
- WhatsApp
- Email
- Açıklama

#### Step 3: Adres & Konum
- Şehir, İlçe *
- Tam adres *
- GPS konum al butonu
- Harita önizleme

#### Step 4: Görseller
- Logo (opsiyonel)
- Kapak * 
- Galeri (opsiyonel)
- Sosyal medya linkler

#### Step 5: Çalışma Saatleri
- Haftalık çalışma saatleri
- Kapalı günler
- Özel saatler

#### Step 6: Rezervasyon Ayarları (Opsiyonel)
- Avans rezervasyon (kaç gün önceden)
- Oto onay
- İptal politikası
- Sıra sistemi
- **Banka hesabı bilgileri** (opsiyonel)
- **Kapora ayarları** (opsiyonel)

## 🎨 TASARIM STANDARDI

### Modern Card Seçimi
```css
- Gradient border (hover/selected)
- Icon container (oval/circular)
- Smooth animations
- Responsive grid
- Active state indicator
```

### Step Progress
```
[1]═══[2]───[3]───[4]───[5]───[6]
 Kategori  Bilgiler  Adres  Görsel  Saat  Ayarlar
```

### Mobil Optimizasyon
- Collapsible sections
- Touch-friendly buttons (min 44px)
- Swipe navigation
- Bottom sheet style

## 🔧 TEKNIK DETAYLAR

### Yeni Componentler
1. `OnboardingWizard.tsx` - Ana wizard container
2. `RoleSelectionCard.tsx` - Modern rol seçimi
3. `BusinessSetupSteps/` klasörü:
   - CategorySelection.tsx
   - BasicInfo.tsx
   - AddressInfo.tsx
   - MediaUpload.tsx
   - WorkingHours.tsx
   - ReservationSettings.tsx

### State Management
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [businessData, setBusinessData] = useState({
  category: '',
  name: '',
  phone: '',
  // ...
  workingHours: {},
  bankAccount: { optional: true },
  depositSettings: { optional: true }
});
```

### Validation
- Step-by-step validation
- Her step'te gerekli alanlar kontrol
- İleriye geç butonu aktif/pasif

## ✅ BAŞARI KRİTERLERİ

1. ✅ Modern ve profesyonel görünüm
2. ✅ Rezervasyon ayarları ile aynı tasarım dili
3. ✅ Mobil ve desktop uyumlu
4. ✅ Step-by-step akış
5. ✅ Tüm detaylar toplanıyor
6. ✅ Opsiyonel alanlar atlanabilir
7. ✅ Smooth animasyonlar
8. ✅ Her step'te geri dönülebilir

---

*Bu sistem, kullanıcı deneyimini baştan sona premium yapacak.*
