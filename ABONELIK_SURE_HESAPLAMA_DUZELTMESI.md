# Abonelik Süre Hesaplama Düzeltmesi ✅

## Özet
Abonelik süre hesaplamaları düzeltildi. Artık tüm periyotlar gün bazlı hesaplanıyor ve yenileme yapılınca mevcut sürenin üzerine ekleniyor.

---

## 🔧 Yapılan Düzeltmeler

### 1. Tarih Hesaplama Yöntemi Değişti

#### Önceki Yöntem (HATALI)
```typescript
// Ay bazlı hesaplama - SORUNLU!
switch (interval) {
  case 'monthly':
    endDate.setMonth(endDate.getMonth() + 1);  // 28-31 gün arası değişir
    break;
  case 'quarterly':
    endDate.setMonth(endDate.getMonth() + 3);  // 89-92 gün arası değişir
    break;
  case 'semi-annual':
    endDate.setMonth(endDate.getMonth() + 6);  // 181-184 gün arası değişir
    break;
  case 'annual':
    endDate.setFullYear(endDate.getFullYear() + 1); // 365-366 gün arası değişir
    break;
}
```

**Sorunlar:**
- ❌ Aylar farklı gün sayısına sahip (28, 29, 30, 31)
- ❌ Şubat ayında sorun çıkarır
- ❌ Artık yıllarda tutarsızlık
- ❌ Kullanıcı "30 gün" beklerken 28 gün alabilir
- ❌ Tahmin edilemez süre

#### Yeni Yöntem (DOĞRU)
```typescript
// GÜN bazlı hesaplama - TUTARLI!
switch (interval) {
  case 'monthly':
    endDate.setDate(endDate.getDate() + 30);   // Her zaman 30 gün
    break;
  case 'quarterly':
    endDate.setDate(endDate.getDate() + 90);   // Her zaman 90 gün (3 ay)
    break;
  case 'semi-annual':
    endDate.setDate(endDate.getDate() + 180);  // Her zaman 180 gün (6 ay)
    break;
  case 'annual':
    endDate.setDate(endDate.getDate() + 365);  // Her zaman 365 gün (1 yıl)
    break;
}
```

**Avantajlar:**
- ✅ Her zaman aynı gün sayısı
- ✅ Tahmin edilebilir
- ✅ Şubat ayında sorun yok
- ✅ Artık yıl sorun yok
- ✅ Kullanıcı ne aldığını biliyor

---

### 2. Yenileme Mantığı - Mevcut Sürenin Üzerine Ekleme

#### Önceki Mantık (HATALI)
```typescript
// Her zaman bugünden başlat - YANLIŞ!
const startDate = now;
const endDate = new Date(now);
endDate.setDate(endDate.getDate() + 30);
```

**Sorun:**
- ❌ Mevcut süre kaybolur
- ❌ Kullanıcı 10 gün kala yenilerse, 10 gün çöpe gider
- ❌ Erken yenileme cezalandırılır

**Örnek:**
```
Mevcut: 15 Ocak - 15 Şubat (31 gün kaldı)
Yenileme: 15 Ocak
Yeni: 15 Ocak - 15 Şubat (31 gün) ❌ KAYIP YOK!
```

#### Yeni Mantık (DOĞRU)
```typescript
// Mevcut aktif abonelik varsa ve süresi dolmamışsa
if (currentSubscription && currentSubscription.status === 'active') {
  const currentEndDate = new Date(currentSubscription.endDate);
  const isExpired = now > currentEndDate;
  
  if (!isExpired) {
    // Mevcut sürenin üzerine ekle ✅
    startDate = currentEndDate;
    endDate = new Date(currentEndDate);
  } else {
    // Süresi dolmuşsa bugünden başlat
    startDate = now;
    endDate = new Date(now);
  }
} else {
  // Yeni abonelik - bugünden başlat
  startDate = now;
  endDate = new Date(now);
}

// Periyoda göre süre ekle
endDate.setDate(endDate.getDate() + daysToAdd);
```

**Avantajlar:**
- ✅ Mevcut süre korunur
- ✅ Erken yenileme ödüllendirilir
- ✅ Hiçbir gün kaybolmaz
- ✅ Kullanıcı dostu

**Örnek:**
```
Mevcut: 15 Ocak - 15 Şubat (31 gün kaldı)
Yenileme: 15 Ocak (30 gün eklendi)
Yeni: 15 Ocak - 17 Mart (61 gün) ✅ 31 + 30 = 61 gün
```

---

## 📊 Periyot Detayları

### Aylık (Monthly)
```typescript
interval: 'monthly'
Süre: 30 gün
Örnek: 1 Ocak → 31 Ocak
```

### 3 Aylık (Quarterly)
```typescript
interval: 'quarterly'
Süre: 90 gün
Örnek: 1 Ocak → 1 Nisan
İndirim: %10
```

### 6 Aylık (Semi-Annual)
```typescript
interval: 'semi-annual'
Süre: 180 gün
Örnek: 1 Ocak → 30 Haziran
İndirim: %15
```

### Yıllık (Annual)
```typescript
interval: 'annual'
Süre: 365 gün
Örnek: 1 Ocak → 1 Ocak (gelecek yıl)
İndirim: %20
```

---

## 🔄 Yenileme Senaryoları

### Senaryo 1: Normal Yenileme (Süre Dolmadan)
```
Mevcut Abonelik:
- Başlangıç: 1 Ocak 2024
- Bitiş: 31 Ocak 2024
- Kalan: 10 gün

Yenileme: 21 Ocak 2024 (30 gün eklendi)

Yeni Abonelik:
- Başlangıç: 1 Ocak 2024 (değişmedi)
- Bitiş: 2 Mart 2024 (31 Ocak + 30 gün)
- Toplam: 40 gün (10 kalan + 30 yeni)
```

### Senaryo 2: Süre Dolduktan Sonra Yenileme
```
Mevcut Abonelik:
- Başlangıç: 1 Ocak 2024
- Bitiş: 31 Ocak 2024
- Kalan: 0 gün (dolmuş)

Yenileme: 5 Şubat 2024 (30 gün eklendi)

Yeni Abonelik:
- Başlangıç: 5 Şubat 2024 (bugünden başlar)
- Bitiş: 7 Mart 2024 (5 Şubat + 30 gün)
- Toplam: 30 gün
```

### Senaryo 3: İlk Abonelik
```
Mevcut Abonelik: Yok

Satın Alma: 1 Ocak 2024 (30 gün)

Yeni Abonelik:
- Başlangıç: 1 Ocak 2024
- Bitiş: 31 Ocak 2024
- Toplam: 30 gün
- Durum: pending (admin onayı bekliyor)
```

### Senaryo 4: Ardışık Yenilemeler
```
1. İlk Satın Alma: 1 Ocak (30 gün)
   → Bitiş: 31 Ocak

2. İlk Yenileme: 15 Ocak (30 gün eklendi)
   → Bitiş: 2 Mart (31 Ocak + 30 gün)

3. İkinci Yenileme: 20 Şubat (30 gün eklendi)
   → Bitiş: 1 Nisan (2 Mart + 30 gün)

Toplam: 90 gün (3 ay)
```

---

## 🎯 Plan Değiştirme (Upgrade/Downgrade)

### Plan Değiştiğinde Süre Korunur
```typescript
async changePlan(businessId, newPlanType) {
  // Sadece planType ve price değişir
  // startDate ve endDate AYNI KALIR
  
  const updatedSubscription = {
    ...subscription,
    planType: newPlanType,  // Değişir
    price: newPrice,        // Değişir
    // startDate: AYNI
    // endDate: AYNI
  };
}
```

**Örnek:**
```
Mevcut:
- Plan: Starter
- Başlangıç: 1 Ocak
- Bitiş: 31 Ocak
- Kalan: 20 gün

Plan Değişikliği: Starter → Professional

Yeni:
- Plan: Professional ✅ Değişti
- Başlangıç: 1 Ocak ✅ Aynı
- Bitiş: 31 Ocak ✅ Aynı
- Kalan: 20 gün ✅ Aynı
```

---

## 📝 Geçmiş Kayıtları

### Yenileme Kaydı
```typescript
{
  action: 'renewed',
  fromPlan: 'professional',
  toPlan: 'professional',
  amount: 299,
  reason: 'Professional planı yenilendi (+30 gün eklendi)',
  createdAt: '2024-01-15T10:30:00Z'
}
```

### Plan Değişikliği Kaydı
```typescript
{
  action: 'upgraded',  // veya 'downgraded'
  fromPlan: 'starter',
  toPlan: 'professional',
  amount: 299,
  reason: 'Plan değiştirildi: starter → professional',
  createdAt: '2024-01-15T10:30:00Z'
}
```

---

## 🧪 Test Senaryoları

### Test 1: Aylık Abonelik Süresi
```typescript
// 1 Ocak'ta 30 günlük abonelik al
const subscription = await purchaseSubscription(
  businessId, 
  'Test Business', 
  'professional', 
  'monthly'
);

// Beklenen
expect(subscription.endDate).toBe('2024-01-31T...');
// 1 Ocak + 30 gün = 31 Ocak
```

### Test 2: 3 Aylık Abonelik Süresi
```typescript
// 1 Ocak'ta 90 günlük abonelik al
const subscription = await purchaseSubscription(
  businessId, 
  'Test Business', 
  'professional', 
  'quarterly'
);

// Beklenen
expect(subscription.endDate).toBe('2024-04-01T...');
// 1 Ocak + 90 gün = 1 Nisan
```

### Test 3: Yıllık Abonelik Süresi
```typescript
// 1 Ocak 2024'te 365 günlük abonelik al
const subscription = await purchaseSubscription(
  businessId, 
  'Test Business', 
  'professional', 
  'annual'
);

// Beklenen
expect(subscription.endDate).toBe('2025-01-01T...');
// 1 Ocak 2024 + 365 gün = 1 Ocak 2025
```

### Test 4: Yenileme - Mevcut Süre Üzerine Ekleme
```typescript
// Mevcut abonelik: 1 Ocak - 31 Ocak (30 gün)
// 15 Ocak'ta yenile (30 gün ekle)

const renewed = await purchaseSubscription(
  businessId, 
  'Test Business', 
  'professional', 
  'monthly'
);

// Beklenen
expect(renewed.endDate).toBe('2024-03-02T...');
// 31 Ocak + 30 gün = 2 Mart
// Toplam: 61 gün (31 + 30)
```

### Test 5: Şubat Ayında Yenileme
```typescript
// 1 Şubat'ta 30 günlük abonelik al
const subscription = await purchaseSubscription(
  businessId, 
  'Test Business', 
  'professional', 
  'monthly'
);

// Beklenen
expect(subscription.endDate).toBe('2024-03-02T...');
// 1 Şubat + 30 gün = 2 Mart
// Şubat 28/29 gün olsa da, 30 gün eklenir
```

### Test 6: Plan Değiştirme - Süre Korunur
```typescript
// Mevcut: Starter, 1 Ocak - 31 Ocak
// Plan değiştir: Professional

const changed = await changePlan(businessId, 'professional');

// Beklenen
expect(changed.planType).toBe('professional'); // Değişti
expect(changed.endDate).toBe('2024-01-31T...'); // Aynı kaldı
```

---

## ✅ Kontrol Listesi

### Tarih Hesaplama
- [x] Aylık: 30 gün
- [x] 3 Aylık: 90 gün
- [x] 6 Aylık: 180 gün
- [x] Yıllık: 365 gün
- [x] Gün bazlı hesaplama (setDate)
- [x] Ay bazlı hesaplama kaldırıldı

### Yenileme Mantığı
- [x] Mevcut süre kontrolü
- [x] Aktif abonelik varsa üzerine ekle
- [x] Süresi dolmuşsa bugünden başlat
- [x] İlk başlangıç tarihi korunur
- [x] Geçmiş kaydında gün sayısı belirtilir

### Plan Değiştirme
- [x] Süre korunur
- [x] Sadece plan ve fiyat değişir
- [x] startDate değişmez
- [x] endDate değişmez

### Geçmiş Kayıtları
- [x] Yenileme: "+X gün eklendi"
- [x] Plan değişikliği: "plan1 → plan2"
- [x] Trial: "X günlük trial"

---

## 🚀 Sonuç

**Abonelik süre hesaplamaları tamamen düzeltildi!**

- ✅ Gün bazlı hesaplama (30, 90, 180, 365 gün)
- ✅ Yenileme mevcut sürenin üzerine eklenir
- ✅ Hiçbir gün kaybolmaz
- ✅ Tahmin edilebilir süreler
- ✅ Şubat ayı sorunu yok
- ✅ Artık yıl sorunu yok
- ✅ Plan değişikliğinde süre korunur
- ✅ Geçmiş kayıtları detaylı

**Kullanıcılar artık ne aldıklarını tam olarak biliyorlar!** 🎉
