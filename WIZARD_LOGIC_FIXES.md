# 🔥 WIZARD MANTIK HATALARI - KAPSAMLI DÜZELTME PLANI

## SORUNLAR:

### 1. **OrderBookingWizard** (Sipariş/Restoran)
- ❌ **YANLIŞ**: Restoranlar için de konum isteniyor
- ✅ **DOĞRU**: Sadece `hasDelivery: true` ise konum iste
- ❌ **YANLIŞ**: Fiyat 0 TL olamaz kontrolü var mı?
- ✅ **DOĞRU**: Masa rezervasyonu 0 TL olabilir

### 2. **SlotBookingWizard** (Randevu)
- ❌ **YANLIŞ**: Tüm randevularda konum isteniyor
- ✅ **DOĞRU**: Sadece `isMobileService: true` ise konum iste

### 3. **ProjectBookingWizard** (Proje/Organizasyon)
- ❌ **YANLIŞ**: Konum isteniyor
- ✅ **DOĞRU**: Sadece `isMobileService: true` ise konum iste

### 4. **NightlyBookingWizard** (Konaklama)
- ❌ **YANLIŞ**: Konum istenmemeli
- ✅ **DOĞRU**: Müşteri otele/villaya gelir, konum asla istenmemeli

### 5. **DailyRentalWizard** (Kiralama)
- ❓ **BELİRSİZ**: Araç teslimata mı yoksa müşteri alacak mı?
- ✅ **DOĞRU**: Duruma göre (`hasDelivery` kontrolü)

---

## ÇÖZÜM PLANI:

### A. Capabilities Bazlı Mantık

```typescript
// Her wizard'da bu kontrolleri yapacağız:

const anySalon = salon as any;
const capabilities = anySalon?.capabilities;

// 1. Konum/Adres gerekli mi?
const requiresAddress = 
  capabilities?.hasDelivery === true ||  // Teslimat var
  capabilities?.isMobileService === true; // Mobil hizmet

// 2. Fiyat zorunlu mu?
const requiresPrice = 
  capabilities?.bookingModels?.includes('order'); // Sipariş modeli

// 3. Süre gerekli mi?
const requiresDuration = 
  capabilities?.isDurationBased === true; // Süre bazlı

// 4. Tarih aralığı mı?
const requiresDateRange = 
  capabilities?.isDateRangeBased === true; // Check-in/out
```

### B. Wizard-Specific Düzeltmeler

#### 1. OrderBookingWizard
```typescript
// ÖNCESİ (HATALI):
if (localDeliveryAddress.trim().length < 10) {
  addToast('Adres gerekli!', 'error');
}

// SONRASI (DOĞRU):
const requiresDeliveryAddress = capabilities?.hasDelivery === true;

if (requiresDeliveryAddress && localDeliveryAddress.trim().length < 10) {
  addToast('Teslimat adresi gerekli!', 'error');
}

// UI:
{requiresDeliveryAddress && (
  <div>
    <h4>Teslimat Adresi</h4>
    <textarea value={localDeliveryAddress} ... />
  </div>
)}
```

#### 2. SlotBookingWizard
```typescript
// ÖNCESİ (HATALI):
if (salon?.settings?.mobileService && !localAddress) {
  addToast('Adres gerekli!', 'error');
}

// SONRASI (DOĞRU):
const requiresAddress = capabilities?.isMobileService === true;

if (requiresAddress && !localAddress.trim()) {
  addToast('Hizmet adresi gerekli!', 'error');
}

// UI:
{requiresAddress && (
  <div>
    <h4>Hizmet Adresi</h4>
    <textarea value={localAddress} ... />
  </div>
)}
```

#### 3. Fiyat Kontrolü (Tüm Wizard'lar)
```typescript
// ÖNCESİ (HATALI):
if (totalPrice <= 0) {
  addToast('Fiyat 0 olamaz!', 'error');
  return;
}

// SONRASI (DOĞRU):
// Hiç kontrol etme! 0 TL rezervasyon geçerlidir.
// Örnek: Ücretsiz danışma, ücretsiz deneme, masa rezervasyonu vb.
```

#### 4. NightlyBookingWizard
```typescript
// Konum asla istenmemeli!
// Müşteri otele/villaya gelir.

// ❌ KALDIR:
{salon?.settings?.mobileService && (
  <div>Adres...</div>
)}

// ✅ YOK
```

---

## C. Validation Kuralları

### 1. Zorunlu Alanlar (Tüm Wizard'lar)
- ✅ `customerName` (her zaman)
- ✅ `customerPhone` (her zaman)
- ✅ `selectedDate` (randevu/rezervasyon için)
- ✅ `selectedTime` (randevu için, süre bazlıysa)
- ❌ `totalPrice > 0` (KALDIRILABİLİR - 0 TL geçerli!)

### 2. Duruma Göre Zorunlu
- ✅ `deliveryAddress` (SADECE `hasDelivery: true`)
- ✅ `serviceAddress` (SADECE `isMobileService: true`)
- ✅ `checkIn/checkOut` (SADECE `isDateRangeBased: true`)
- ✅ `selectedStaffId` (SADECE `hasStaff: true` VE staff seçimi zorunluysa)

### 3. Opsiyonel Alanlar
- ⚪ `customerEmail` (opsiyonel)
- ⚪ `customerNotes` (opsiyonel)
- ⚪ `guestCount` (opsiyonel, default 1)

---

## D. UI Mesajları

### Wizard Başlıkları (Capabilities'e göre)
```typescript
// OrderBookingWizard
const title = capabilities?.hasDelivery 
  ? "Sipariş & Teslimat" 
  : "Sipariş Ver";

// SlotBookingWizard  
const title = capabilities?.isMobileService
  ? "Randevu & Adres"
  : terminology.actionVerb; // "Randevu Al", "Rezervasyon Yap" vb.
```

### Step Başlıkları
```typescript
// Adres adımı
const addressStepTitle = capabilities?.hasDelivery
  ? "Teslimat Bilgileri"
  : capabilities?.isMobileService
  ? "Hizmet Adresi"
  : null; // Gösterme
```

---

## E. Örnek Senaryolar

### Senaryo 1: Restoran (Masa Rezervasyonu)
```
✅ Capabilities:
  - bookingModels: ['reservation']
  - hasDelivery: false
  - isMobileService: false
  - hasTables: true

✅ Wizard: ReservationWizard veya OrderBookingWizard
✅ Konum: ❌ İstenmemeli (müşteri restorana gelir)
✅ Fiyat: 0 TL olabilir (sadece rezervasyon)
✅ Masa: ✅ Seçilmeli
```

### Senaryo 2: Restoran (Eve Teslimat)
```
✅ Capabilities:
  - bookingModels: ['reservation', 'order']
  - hasDelivery: true
  - isMobileService: false

✅ Wizard: OrderBookingWizard
✅ Konum: ✅ İstenmeli (teslimat var)
✅ Fiyat: Minimum sipariş tutarı olabilir
```

### Senaryo 3: Kuaför (Salonda)
```
✅ Capabilities:
  - bookingModels: ['appointment']
  - hasDelivery: false
  - isMobileService: false
  - hasStaff: true

✅ Wizard: SlotBookingWizard
✅ Konum: ❌ İstenmemeli (müşteri salona gelir)
✅ Personel: ✅ Seçilmeli
```

### Senaryo 4: Kuaför (Evde Hizmet)
```
✅ Capabilities:
  - bookingModels: ['appointment']
  - hasDelivery: false
  - isMobileService: true
  - hasStaff: true

✅ Wizard: SlotBookingWizard
✅ Konum: ✅ İstenmeli (kuaför müşteriye gider)
✅ Personel: ✅ Seçilmeli
```

### Senaryo 5: Otel (Konaklama)
```
✅ Capabilities:
  - bookingModels: ['reservation']
  - isDateRangeBased: true
  - hasDelivery: false
  - isMobileService: false

✅ Wizard: NightlyBookingWizard
✅ Konum: ❌ ASLA istenmemeli (müşteri otele gelir)
✅ Tarih aralığı: ✅ Check-in / Check-out
```

---

## F. Öncelikli Düzeltmeler

### 1. ÖNCELİK 1 (KRİTİK): OrderBookingWizard
- [x] `requiresDeliveryAddress` kontrolü ekle
- [x] UI'da conditional render
- [ ] Fiyat 0 kontrolünü kaldır
- [ ] Step başlıklarını düzelt

### 2. ÖNCELİK 2: SlotBookingWizard
- [x] `requiresAddress` kontrolü ekle
- [ ] UI'da conditional render (devam ediyor)
- [ ] Fiyat 0 kontrolünü kaldır

### 3. ÖNCELİK 3: NightlyBookingWizard
- [ ] Konum input'unu tamamen kaldır
- [ ] Check-in/Check-out mantığını kontrol et

### 4. ÖNCELİK 4: ProjectBookingWizard
- [ ] `isMobileService` kontrolü ekle
- [ ] Conditional address input

### 5. ÖNCELİK 5: DailyRentalWizard
- [ ] `hasDelivery` kontrolü ekle
- [ ] Conditional address input

---

## G. Test Senaryoları

Her wizard için test etmemiz gerekenler:

1. **Capabilities doğru mu?**
   - Dashboard > İşletme Oluştur'da doğru sorular sorulmuş mu?
   - Capabilities doğru türetilmiş mi?

2. **Wizard doğru açılıyor mu?**
   - BookingWizardRouter doğru wizard'ı seçiyor mu?

3. **Konum kontrolü çalışıyor mu?**
   - `hasDelivery: false` → Konum input yok ✅
   - `hasDelivery: true` → Konum input var ✅
   - `isMobileService: true` → Konum input var ✅

4. **Validation çalışıyor mu?**
   - Gerekli alanlar dolu mu kontrolü
   - Gereksiz alanlar kontrol edilmiyor mu

5. **0 TL rezervasyon çalışıyor mu?**
   - Fiyat 0 olan hizmet seçilebiliyor mu?
   - Rezervasyon oluşturuluyor mu?

---

**SONRAKI ADIM**: Tüm wizard'ları tek tek düzeltip test etmek.
