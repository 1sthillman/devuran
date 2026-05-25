# 🔥 Firebase Functions Kurulum Rehberi

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [Kurulum Adımları](#kurulum-adımları)
3. [Yapılandırma](#yapılandırma)
4. [Deployment](#deployment)
5. [Test](#test)
6. [Monitoring](#monitoring)

---

## 🎯 Gereksinimler

### Yazılım Gereksinimleri
- Node.js 18 veya üzeri
- npm veya yarn
- Firebase CLI
- Firebase Blaze Plan (Cloud Functions için)

### Firebase CLI Kurulumu
```bash
npm install -g firebase-tools
firebase login
```

---

## 📦 Kurulum Adımları

### 1. Functions Klasörüne Git
```bash
cd functions
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. TypeScript Derle
```bash
npm run build
```

---

## ⚙️ Yapılandırma

### 1. Stripe API Key Ayarla
```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"
```

### 2. Admin Email Ayarla (Opsiyonel)
```bash
firebase functions:config:set admin.emails="admin@example.com,admin2@example.com"
```

### 3. Yapılandırmayı Kontrol Et
```bash
firebase functions:config:get
```

### 4. Local Development için .env Dosyası
```bash
# functions/.env.local
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
ADMIN_EMAILS=admin@example.com
```

---

## 🚀 Deployment

### 1. Tüm Functions'ları Deploy Et
```bash
firebase deploy --only functions
```

### 2. Sadece Belirli Function'ı Deploy Et
```bash
firebase deploy --only functions:createSubscription
```

### 3. Production'a Deploy
```bash
# Önce test et
npm run build
npm run lint

# Deploy
firebase deploy --only functions --project production
```

---

## 🧪 Test

### 1. Local Emulator ile Test
```bash
npm run serve
```

Emulator şu adreste çalışacak: http://localhost:5001

### 2. Function'ı Test Et (Emulator)
```javascript
// Client-side test kodu
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createSubscription = httpsCallable(functions, 'createSubscription');

const result = await createSubscription({
  businessId: 'salon-123',
  businessName: 'Test Salon',
  planType: 'professional',
  interval: 'monthly',
  paymentMethodId: 'pm_test_123',
});

console.log(result.data);
```

### 3. Production'da Test
```bash
# Logs izle
firebase functions:log --only createSubscription
```

---

## 📊 Monitoring

### 1. Firebase Console
https://console.firebase.google.com/project/ruloposs/functions

### 2. Logs
```bash
# Tüm logs
firebase functions:log

# Belirli function
firebase functions:log --only createSubscription

# Son 100 log
firebase functions:log --limit 100
```

### 3. Error Tracking
- Firebase Crashlytics
- Sentry entegrasyonu (opsiyonel)

---

## 🔒 Güvenlik

### 1. Admin Custom Claims Ayarla
```javascript
// Admin panelinden veya script ile
import { getAuth } from 'firebase-admin/auth';

await getAuth().setCustomUserClaims(userId, { admin: true });
```

### 2. Rate Limiting
Functions otomatik olarak rate limiting içerir:
- 5 istek / dakika / kullanıcı

### 3. CORS Ayarları
```javascript
// functions/src/index.ts
import * as cors from 'cors';
const corsHandler = cors({ origin: true });
```

---

## 📝 Available Functions

### 1. createSubscription
**Açıklama**: Yeni abonelik oluşturur (ödeme ile)

**Parametreler**:
```typescript
{
  businessId: string;
  businessName: string;
  planType: 'starter' | 'professional' | 'business' | 'enterprise';
  interval: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  paymentMethodId?: string; // Stripe payment method ID
}
```

**Dönüş**:
```typescript
{
  success: boolean;
  subscriptionId: string;
  status: 'active' | 'pending';
  message: string;
}
```

**Kullanım**:
```typescript
const result = await createSubscription({
  businessId: salon.id,
  businessName: salon.name,
  planType: 'professional',
  interval: 'monthly',
  paymentMethodId: 'pm_xxx',
});
```

---

### 2. approveSubscription
**Açıklama**: Pending aboneliği onayla (Admin)

**Parametreler**:
```typescript
{
  subscriptionId: string;
  adminEmail: string;
}
```

**Dönüş**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Kullanım**:
```typescript
const result = await approveSubscription({
  subscriptionId: 'sub_xxx',
  adminEmail: 'admin@example.com',
});
```

---

### 3. updateUsageOnStaffCreate
**Açıklama**: Personel eklendiğinde otomatik çalışır (Trigger)

**Trigger**: `staff/{staffId}` onCreate

**İşlev**: Usage stats'ı günceller

---

### 4. checkPendingSubscriptions
**Açıklama**: 7 günden eski pending abonelikleri iptal eder

**Schedule**: Her 24 saatte bir

**Timezone**: Europe/Istanbul

---

### 5. sendSubscriptionReminders
**Açıklama**: 7 gün içinde bitecek aboneliklere bildirim gönderir

**Schedule**: Her 24 saatte bir

**Timezone**: Europe/Istanbul

---

## 🔧 Troubleshooting

### Problem: Function deploy edilmiyor
**Çözüm**:
```bash
# Firebase CLI güncelle
npm install -g firebase-tools@latest

# Tekrar dene
firebase deploy --only functions
```

### Problem: Stripe hatası
**Çözüm**:
```bash
# API key kontrol et
firebase functions:config:get stripe.secret_key

# Yeniden ayarla
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"
```

### Problem: Permission denied
**Çözüm**:
```bash
# Firebase projesini kontrol et
firebase use --add

# Doğru projeyi seç
firebase use production
```

### Problem: Timeout
**Çözüm**:
```typescript
// functions/src/subscriptions.ts
export const createSubscription = functions
  .runWith({ 
    memory: '512MB', 
    timeoutSeconds: 120 // 60'tan 120'ye çıkar
  })
  .https.onCall(async (data, context) => {
    // ...
  });
```

---

## 💰 Maliyet

### Firebase Blaze Plan
- İlk 2 milyon çağrı: Ücretsiz
- Sonrası: $0.40 / milyon çağrı
- CPU-time: $0.0000025 / GB-second
- Network: $0.12 / GB

### Örnek Hesaplama
- 10,000 abonelik işlemi/ay
- Ortalama 500ms süre
- ~$0.50/ay

---

## 📚 Kaynaklar

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Stripe API Docs](https://stripe.com/docs/api)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

## 🆘 Destek

Sorularınız için:
- 📧 Email: dev@randevu.app
- 💬 Discord: [Discord Server](#)
- 📖 Docs: [Documentation](#)

---

**Oluşturulma Tarihi**: 24 Mayıs 2026  
**Versiyon**: 1.0  
**Durum**: ✅ Production Ready
