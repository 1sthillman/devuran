# İşletmelerin Kalan Gün Gösterimi

## 📱 Kullanıcı Arayüzü

### 1. Dashboard Ana Ekran
İşletme sahipleri dashboard'a giriş yaptığında **SubscriptionOverviewCard** bileşeni ile karşılaşır:

```
┌─────────────────────────────────────────────────────────┐
│  💼 Professional Plan                    [Aktif]        │
│  Aylık                                   299₺ / ay      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅  Kalan Süre                                         │
│      ╔═══════════════════════════════════╗             │
│      ║         23 GÜN                    ║             │
│      ║                                   ║             │
│      ║  Bitiş: 15 Haz                   ║             │
│      ╚═══════════════════════════════════╝             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  👥 Personel: 5 / 10                                   │
│  💼 Hizmet: 15 / 50                                    │
│  📅 Randevu: 87 / 500                                  │
└─────────────────────────────────────────────────────────┘
```

### 2. Renk Kodlaması

#### 🟢 Yeşil (Güvenli)
- **Durum**: 8+ gün kaldı
- **Mesaj**: Normal gösterim
- **Aksiyon**: Yok

```tsx
// 23 gün kaldı
<div className="text-green-400">
  <p className="text-3xl font-bold">23 Gün</p>
</div>
```

#### 🟠 Turuncu (Uyarı)
- **Durum**: 1-7 gün kaldı
- **Mesaj**: "7 gün içinde sona erecek"
- **Aksiyon**: "Yenile" butonu

```tsx
// 5 gün kaldı
<div className="text-orange-400">
  <p className="text-3xl font-bold">5 Gün</p>
  <div className="bg-orange-500/10 border border-orange-500/20">
    ⚠️ 5 gün içinde sona erecek
  </div>
</div>
```

#### 🔴 Kırmızı (Kritik)
- **Durum**: Süre dolmuş (0 gün)
- **Mesaj**: "Aboneliğinizin süresi dolmuştur"
- **Aksiyon**: "Yenile" butonu (zorunlu)

```tsx
// Süre dolmuş
<div className="text-red-400">
  <p className="text-3xl font-bold">0 Gün</p>
  <div className="bg-red-500/10 border border-red-500/20">
    🚫 Aboneliğinizin süresi dolmuştur
  </div>
  <button>Yenile</button>
</div>
```

#### 🔵 Mavi (Deneme)
- **Durum**: Trial (deneme süresi)
- **Mesaj**: "X gün deneme süreniz kaldı"
- **Aksiyon**: "Paket Seç" butonu

```tsx
// Trial - 10 gün kaldı
<div className="text-blue-400">
  <p className="text-3xl font-bold">10 Gün</p>
  <div className="bg-blue-500/10 border border-blue-500/20">
    ⏱️ 10 gün deneme süreniz kaldı
  </div>
  <button>Paket Seç</button>
</div>
```

---

## 💻 Teknik Detaylar

### Kalan Gün Hesaplama
```typescript
// SubscriptionOverviewCard.tsx
const loadSubscription = async () => {
  const sub = await subscriptionService.getBusinessSubscription(businessId);
  setSubscription(sub);

  if (sub) {
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysRemaining(diff);
  }
};
```

### Durum Belirleme
```typescript
const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
const isExpired = subscription.status === 'expired' || daysRemaining <= 0;
const isTrial = subscription.status === 'trial';
```

### Renk Seçimi
```typescript
const currentStatus = 
  isExpired ? statusConfig.expired :
  isExpiringSoon ? statusConfig.expiring :
  isTrial ? statusConfig.trial :
  statusConfig.active;
```

---

## 📊 Veri Yapısı

### Firestore Document
```javascript
{
  id: "sub_123",
  businessId: "salon_456",
  businessName: "Güzellik Salonu",
  planType: "professional",
  interval: "monthly",
  status: "active",
  startDate: "2024-05-01T00:00:00.000Z",
  endDate: "2024-06-01T00:00:00.000Z",  // ← Bitiş tarihi
  price: 299,
  currency: "TRY",
  usage: {
    staffCount: 5,
    serviceCount: 15,
    monthlyBookings: 87,
    lastUpdated: "2024-05-24T10:30:00.000Z"
  },
  createdAt: "2024-05-01T00:00:00.000Z",
  updatedAt: "2024-05-24T10:30:00.000Z"
}
```

### Hesaplama Örneği
```javascript
// Bugün: 24 Mayıs 2024
// Bitiş: 1 Haziran 2024
// Kalan: 8 gün

const endDate = new Date("2024-06-01T00:00:00.000Z");
const now = new Date("2024-05-24T10:30:00.000Z");
const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
// diff = 8 gün
```

---

## 🎨 UI Bileşenleri

### Ana Kart (SubscriptionOverviewCard)
```tsx
<motion.div className="rounded-3xl border-2 backdrop-blur-xl">
  {/* Header: Plan adı ve durum */}
  <div className="flex items-center justify-between">
    <div>
      <h3>Professional Plan</h3>
      <span className="badge">Aktif</span>
    </div>
    <div>
      <p className="text-3xl">299₺</p>
      <p className="text-xs">/ ay</p>
    </div>
  </div>

  {/* Kalan Gün - Büyük ve Belirgin */}
  <div className="p-5 rounded-2xl border-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400">Kalan Süre</p>
        <p className="text-3xl font-bold text-green-400">23 Gün</p>
      </div>
      <div>
        <p className="text-xs text-gray-400">Bitiş</p>
        <p className="text-sm font-semibold">15 Haz</p>
      </div>
    </div>
  </div>

  {/* Uyarı Mesajları */}
  {isExpiringSoon && (
    <div className="bg-orange-500/10 border border-orange-500/20">
      ⚠️ 7 gün içinde sona erecek
    </div>
  )}

  {/* Kullanım İstatistikleri */}
  <div className="grid grid-cols-3 gap-3">
    <div>👥 Personel: 5 / 10</div>
    <div>💼 Hizmet: 15 / 50</div>
    <div>📅 Randevu: 87 / 500</div>
  </div>

  {/* Aksiyon Butonu */}
  {(isExpired || isExpiringSoon) && (
    <button onClick={onViewPlans}>
      Yenile
    </button>
  )}
</motion.div>
```

---

## 📱 Mobil Görünüm

### Responsive Tasarım
```tsx
// Mobilde daha kompakt
<div className="p-4 sm:p-6">
  {/* Kalan gün daha büyük */}
  <p className="text-4xl sm:text-3xl font-bold">
    {daysRemaining} Gün
  </p>
  
  {/* İstatistikler alt alta */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <div>👥 5 / 10</div>
    <div>💼 15 / 50</div>
    <div>📅 87 / 500</div>
  </div>
</div>
```

---

## 🔔 Bildirimler

### Otomatik Uyarılar
```typescript
// 7 gün kala
if (daysRemaining === 7) {
  showNotification({
    title: 'Abonelik Uyarısı',
    message: '7 gün sonra aboneliğiniz sona erecek',
    type: 'warning'
  });
}

// 3 gün kala
if (daysRemaining === 3) {
  showNotification({
    title: 'Acil: Abonelik Uyarısı',
    message: '3 gün sonra aboneliğiniz sona erecek',
    type: 'error'
  });
}

// Süre dolduğunda
if (daysRemaining === 0) {
  showNotification({
    title: 'Abonelik Doldu',
    message: 'Aboneliğinizi yenilemeniz gerekiyor',
    type: 'error',
    persistent: true
  });
}
```

---

## 🎯 Kullanıcı Senaryoları

### Senaryo 1: Normal Kullanım (23 gün kaldı)
```
✅ Yeşil renk
✅ Normal gösterim
✅ Tüm özellikler aktif
❌ Uyarı mesajı yok
❌ Aksiyon butonu yok
```

### Senaryo 2: Uyarı Durumu (5 gün kaldı)
```
⚠️ Turuncu renk
⚠️ Uyarı mesajı: "5 gün içinde sona erecek"
✅ Tüm özellikler hala aktif
✅ "Yenile" butonu görünür
```

### Senaryo 3: Kritik Durum (0 gün - Dolmuş)
```
🚫 Kırmızı renk
🚫 Hata mesajı: "Aboneliğinizin süresi dolmuştur"
❌ Özellikler kilitli
✅ "Yenile" butonu (zorunlu)
```

### Senaryo 4: Deneme Süresi (10 gün kaldı)
```
🔵 Mavi renk
ℹ️ Bilgi mesajı: "10 gün deneme süreniz kaldı"
✅ Professional özellikleri aktif
✅ "Paket Seç" butonu
```

---

## 🔧 Özelleştirme

### Uyarı Eşikleri
```typescript
// config/subscriptionConfig.ts
export const SUBSCRIPTION_ALERTS = {
  WARNING_DAYS: 7,      // Turuncu uyarı
  CRITICAL_DAYS: 3,     // Kırmızı uyarı
  NOTIFICATION_DAYS: [7, 3, 1, 0]  // Bildirim günleri
};
```

### Renk Temaları
```typescript
export const SUBSCRIPTION_COLORS = {
  trial: {
    gradient: 'from-blue-500 to-cyan-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  active: {
    gradient: 'from-green-500 to-emerald-500',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20'
  },
  expiring: {
    gradient: 'from-orange-500 to-red-500',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20'
  },
  expired: {
    gradient: 'from-red-500 to-red-600',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20'
  }
};
```

---

## 📈 Analytics

### Takip Edilecek Metrikler
```typescript
// Abonelik görüntüleme
analytics.track('subscription_viewed', {
  businessId,
  planType: subscription.planType,
  daysRemaining,
  status: subscription.status
});

// Yenileme butonu tıklama
analytics.track('subscription_renew_clicked', {
  businessId,
  daysRemaining,
  source: 'dashboard_card'
});

// Plan değiştirme
analytics.track('subscription_plan_changed', {
  businessId,
  fromPlan: oldPlan,
  toPlan: newPlan,
  daysRemaining
});
```

---

## ✨ Sonuç

İşletmeler artık:
- ✅ Kalan gün sayısını büyük ve net görebilir
- ✅ Bitiş tarihini takip edebilir
- ✅ Renk kodları ile durumu anlayabilir
- ✅ Zamanında uyarı alabilir
- ✅ Hızlıca yenileme yapabilir
- ✅ Kullanım limitlerini görebilir

**Kullanıcı deneyimi optimize edildi! 🎉**
