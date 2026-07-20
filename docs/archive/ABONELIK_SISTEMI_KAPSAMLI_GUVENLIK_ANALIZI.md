# 🔒 ABONELİK SİSTEMİ KAPSAMLI GÜVENLİK ANALİZİ

## 📋 ANALİZ TARİHİ: 24 Mayıs 2026

---

## ⚠️ KRİTİK GÜVENLİK AÇIKLARI TESPİT EDİLDİ

### 🚨 YÜKSEK ÖNCELİKLİ SORUNLAR

#### 1. ❌ ADMIN ONAY SİSTEMİ EKSİK
**Sorun**: `subscriptionService.ts` içinde admin onay fonksiyonları var AMA:
- `admin.firestore.FieldValue.delete()` kullanılıyor (Firebase Admin SDK)
- Bu kod CLIENT-SIDE çalışmaz!
- Admin onayları BACKEND'de olmalı

**Kod Hatası** (satır 358-365):
```typescript
await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
  planType: requestedPlanType,
  price: requestedPrice,
  pendingPlanChange: admin.firestore.FieldValue.delete(), // ❌ CLIENT'ta çalışmaz!
  planChangedAt: now,
  planChangedBy: adminEmail,
  updatedAt: now,
});
```

**Güvenlik Riski**: 
- Admin onayları client-side yapılamaz
- Herhangi bir kullanıcı admin fonksiyonlarını çağırabilir
- Firestore rules bu işlemleri engellemeli

---

#### 2. ❌ FIRESTORE RULES'DA ADMIN KONTROLÜ YETERSİZ
**Sorun**: `firestore.rules` içinde:
```javascript
function isSuperAdmin() {
  return request.auth != null && 
         request.auth.token.email in ['adistow@gmail.com', 'admin@restoqr.com', 'minif@restoqr.com'];
}
```

**Güvenlik Riski**:
- Email kontrolü CUSTOM CLAIMS ile yapılmalı
- Email kolayca değiştirilebilir
- Token'da `admin: true` custom claim olmalı

---

#### 3. ❌ ABONELIK DURUMU KONTROLÜ CLIENT-SIDE
**Sorun**: `SalonDetail.tsx` içinde abonelik kontrolü client-side yapılıyor:
```typescript
const checkSubscription = async () => {
  const subscription = await subscriptionService.getBusinessSubscription(id);
  // Client-side kontrol
}
```

**Güvenlik Riski**:
- Kullanıcı browser console'dan bu kontrolü bypass edebilir
- Randevu oluşturma işlemi BACKEND'de kontrol edilmeli
- Firestore rules'da abonelik kontrolü olmalı

---

#### 4. ❌ ÖDEME DOĞRULAMA YOK
**Sorun**: `purchaseSubscription` fonksiyonu:
```typescript
async purchaseSubscription(
  businessId: string,
  businessName: string,
  planType: SubscriptionPlanType,
  interval: SubscriptionInterval,
  customPrice?: number
): Promise<BusinessSubscription>
```

**Güvenlik Riski**:
- Ödeme entegrasyonu YOK
- Kullanıcı ücretsiz abonelik oluşturabilir
- Stripe/Iyzico entegrasyonu şart

---

#### 5. ❌ CUSTOM PRICE KONTROLSÜZ
**Sorun**: `customPrice` parametresi kontrol edilmiyor:
```typescript
const price = customPrice || plan.pricing[interval];
```

**Güvenlik Riski**:
- Kullanıcı `customPrice: 0` gönderebilir
- Minimum/maksimum fiyat kontrolü yok
- Sadece admin custom price verebilmeli

---

#### 6. ❌ RATE LIMITING YOK
**Sorun**: Abonelik işlemlerinde rate limiting yok

**Güvenlik Riski**:
- Kullanıcı spam abonelik oluşturabilir
- DDoS saldırısına açık
- Firebase Functions ile rate limiting eklenme li

---

#### 7. ❌ SÜRE HESAPLAMA HATALARI
**Sorun**: `purchaseSubscription` içinde:
```typescript
switch (interval) {
  case 'monthly':
    endDate.setDate(endDate.getDate() + 30); // ❌ Her ay 30 gün değil!
    break;
  case 'quarterly':
    endDate.setDate(endDate.getDate() + 90); // ❌ 3 ay = 90 gün değil!
    break;
}
```

**Mantık Hatası**:
- Aylar 28-31 gün arası değişir
- `setMonth()` kullanılmalı
- Yıl değişiminde hata olabilir

---

#### 8. ❌ ABONELIK YENİLEME MANTIK HATASI
**Sorun**: Yenileme sırasında:
```typescript
if (currentSubscription && currentSubscription.status === 'active') {
  const currentEndDate = new Date(currentSubscription.endDate);
  const isExpired = now > currentEndDate;
  
  if (!isExpired) {
    startDate = currentEndDate; // ❌ Mevcut sürenin üzerine ekliyor
    endDate = new Date(currentEndDate);
  }
}
```

**Mantık Hatası**:
- Kullanıcı 1 gün kala yenilerse, 1 gün kaybeder
- Yenileme tarihi bugün olmalı, bitiş tarihi mevcut bitiş + yeni süre

---

#### 9. ❌ PENDING DURUMU SONSUZ KALABİLİR
**Sorun**: Tüm abonelikler `pending` durumunda başlıyor:
```typescript
const status: SubscriptionStatus = 'pending';
```

**Mantık Hatası**:
- Admin onaylamazsa abonelik sonsuza kadar pending kalır
- Otomatik timeout mekanizması yok
- 7 gün sonra otomatik iptal edilmeli

---

#### 10. ❌ USAGE STATS GÜNCELLENMİYOR
**Sorun**: `updateUsageStats` fonksiyonu var AMA:
- Hiçbir yerde çağrılmıyor
- Personel/hizmet/randevu eklendiğinde otomatik güncellenmeli
- Limit kontrolü yapılmıyor

---

### 🔧 ORTA ÖNCELİKLİ SORUNLAR

#### 11. ⚠️ INDEX HATASI YÖNETİMİ
**Sorun**: Index hazır değilse client-side sıralama yapılıyor:
```typescript
catch (error: any) {
  if (error.code === 'failed-precondition' || error.message?.includes('index')) {
    console.log('⏳ Index building, using client-side sorting...');
  }
}
```

**Performans Riski**:
- Binlerce abonelik varsa client-side sıralama yavaş
- Index oluşturulmalı: `firestore.indexes.json`

---

#### 12. ⚠️ TRIAL SÜRE KONTROLÜ YOK
**Sorun**: Kullanıcı birden fazla trial oluşturabilir:
```typescript
async createTrialSubscription(businessId: string, businessName: string)
```

**Güvenlik Riski**:
- Kullanıcı sınırsız trial oluşturabilir
- Email/telefon doğrulaması olmalı
- Bir işletme sadece 1 trial alabilmeli

---

#### 13. ⚠️ PLAN DEĞİŞİKLİĞİ ONAY SONRASI SÜRE
**Sorun**: Plan değişikliği onaylandığında süre değişmiyor:
```typescript
await updateDoc(doc(db, this.subscriptionsCollection, subscription.id), {
  planType: requestedPlanType,
  price: requestedPrice,
  // ❌ endDate güncellenmeli mi?
});
```

**Mantık Belirsizliği**:
- Plan yükseltildiğinde süre uzamalı mı?
- Plan düşürüldüğünde süre kısalmalı mı?
- Net politika belirlenmeli

---

#### 14. ⚠️ SUBSCRIPTION HISTORY SPAM
**Sorun**: Her işlemde history kaydı oluşturuluyor:
```typescript
await this.addHistory(businessId, subscription.id, action, ...);
```

**Performans Riski**:
- Binlerce history kaydı oluşabilir
- Pagination yok
- Eski kayıtlar arşivlenmeli

---

#### 15. ⚠️ ERROR HANDLING YETERSİZ
**Sorun**: Hata mesajları generic:
```typescript
catch (error: any) {
  console.error('Error checking feature access:', error);
  setAccess({ hasAccess: false, reason: 'Erişim kontrolü başarısız' });
}
```

**Kullanıcı Deneyimi**:
- Kullanıcı hatanın nedenini bilmiyor
- Detaylı hata mesajları olmalı
- Sentry/LogRocket entegrasyonu

---

### 💡 DÜŞÜK ÖNCELİKLİ İYİLEŞTİRMELER

#### 16. 📊 ANALYTICS EKSİK
- Hangi planlar en çok satılıyor?
- Ortalama abonelik süresi?
- Churn rate?
- MRR (Monthly Recurring Revenue)?

#### 17. 🔔 BİLDİRİM SİSTEMİ EKSİK
- Abonelik 7 gün kala bildirim
- Abonelik dolduğunda bildirim
- Ödeme başarısız olduğunda bildirim
- Email/SMS/Push notification

#### 18. 💳 FATURA SİSTEMİ YOK
- Kullanıcı fatura indiremez
- Vergi numarası kaydedilmiyor
- E-Fatura entegrasyonu yok

#### 19. 🔄 OTOMATIK YENİLEME YOK
- Kullanıcı her ay manuel yenilemeli
- Otomatik ödeme sistemi olmalı
- Stripe Subscriptions kullanılmalı

#### 20. 📱 MOBILE UYUMLULUK
- Abonelik modal'ı mobilde büyük
- Scroll performansı optimize edilmeli
- Touch gestures eklenmeli

---

## ✅ DOĞRU ÇALIŞAN ÖZELLIKLER

### 🎯 İYİ TARAFLAR

1. ✅ **Plan Yapısı İyi Tasarlanmış**
   - 5 farklı plan (starter, professional, business, enterprise, custom)
   - Özellik bazlı erişim kontrolü
   - Esnek fiyatlandırma

2. ✅ **UI/UX Mükemmel**
   - Modern ve kullanıcı dostu
   - Animasyonlar smooth
   - Responsive tasarım

3. ✅ **TypeScript Kullanımı**
   - Type safety var
   - Interface'ler iyi tanımlanmış
   - Kod okunabilir

4. ✅ **Component Yapısı**
   - SubscriptionGuard - Özellik kilitleme
   - SubscriptionModal - Plan seçimi
   - SubscriptionStatus - Durum gösterimi
   - SubscriptionOverviewCard - Özet kart

5. ✅ **Firestore Rules Temel Güvenlik**
   - Salon sahipleri kendi verilerini görebilir
   - Public read access kontrollü
   - Super admin kontrolü var

---

## 🛠️ ÇÖZÜM ÖNERİLERİ

### 🔥 ACİL YAPILMASI GEREKENLER (1-2 GÜN)

#### 1. Firebase Functions ile Backend API Oluştur
```typescript
// functions/src/subscriptions.ts
export const createSubscription = functions.https.onCall(async (data, context) => {
  // Auth kontrolü
  if (!context.auth) throw new Error('Unauthorized');
  
  // Ödeme kontrolü (Stripe/Iyzico)
  const paymentResult = await processPayment(data.paymentMethod, data.amount);
  if (!paymentResult.success) throw new Error('Payment failed');
  
  // Abonelik oluştur
  const subscription = await admin.firestore()
    .collection('subscriptions')
    .add({
      businessId: data.businessId,
      planType: data.planType,
      status: 'active', // Ödeme başarılıysa direkt active
      // ...
    });
  
  return { success: true, subscriptionId: subscription.id };
});
```

#### 2. Firestore Rules Güçlendir
```javascript
// firestore.rules
match /subscriptions/{subscriptionId} {
  // Sadece okuma izni
  allow read: if request.auth != null && 
                 (resource.data.businessId == request.auth.uid ||
                  hasAdminClaim());
  
  // Yazma izni YOK - sadece Cloud Functions
  allow write: if false;
}

function hasAdminClaim() {
  return request.auth.token.admin == true;
}
```

#### 3. Süre Hesaplama Düzelt
```typescript
// Doğru ay ekleme
switch (interval) {
  case 'monthly':
    endDate.setMonth(endDate.getMonth() + 1); // ✅ Doğru
    break;
  case 'quarterly':
    endDate.setMonth(endDate.getMonth() + 3); // ✅ Doğru
    break;
  case 'semi-annual':
    endDate.setMonth(endDate.getMonth() + 6); // ✅ Doğru
    break;
  case 'annual':
    endDate.setFullYear(endDate.getFullYear() + 1); // ✅ Doğru
    break;
}
```

#### 4. Custom Price Kontrolü Ekle
```typescript
// Admin kontrolü
if (customPrice !== undefined) {
  if (!context.auth.token.admin) {
    throw new Error('Only admins can set custom prices');
  }
  
  // Minimum/maksimum kontrol
  if (customPrice < 100 || customPrice > 1000000) {
    throw new Error('Invalid custom price');
  }
}
```

#### 5. Usage Stats Otomatik Güncelle
```typescript
// functions/src/triggers.ts
export const onStaffCreated = functions.firestore
  .document('staff/{staffId}')
  .onCreate(async (snap, context) => {
    const staff = snap.data();
    await updateUsageStats(staff.salonId, { staffCount: 1 });
  });

export const onServiceCreated = functions.firestore
  .document('services/{serviceId}')
  .onCreate(async (snap, context) => {
    const service = snap.data();
    await updateUsageStats(service.salonId, { serviceCount: 1 });
  });
```

---

### 📅 KISA VADELİ (1 HAFTA)

#### 6. Ödeme Entegrasyonu (Stripe/Iyzico)
```typescript
// Stripe örneği
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'try',
        product_data: {
          name: data.planName,
        },
        unit_amount: data.amount * 100, // Kuruş cinsinden
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${data.returnUrl}?success=true`,
    cancel_url: `${data.returnUrl}?canceled=true`,
  });
  
  return { sessionId: session.id };
});
```

#### 7. Rate Limiting Ekle
```typescript
// functions/src/rateLimiter.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 istek
  duration: 60, // 60 saniyede
});

export const checkRateLimit = async (userId: string) => {
  try {
    await rateLimiter.consume(userId);
  } catch (error) {
    throw new Error('Too many requests. Please try again later.');
  }
};
```

#### 8. Trial Kontrolü Ekle
```typescript
// Bir işletme sadece 1 trial alabilir
const existingTrials = await admin.firestore()
  .collection('subscriptions')
  .where('businessId', '==', businessId)
  .where('status', '==', 'trial')
  .get();

if (!existingTrials.empty) {
  throw new Error('Trial already used for this business');
}
```

#### 9. Pending Timeout Ekle
```typescript
// functions/src/scheduled.ts
export const checkPendingSubscriptions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const pendingSubscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'pending')
      .where('createdAt', '<', sevenDaysAgo.toISOString())
      .get();
    
    const batch = admin.firestore().batch();
    pendingSubscriptions.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'Pending timeout (7 days)',
      });
    });
    
    await batch.commit();
  });
```

#### 10. Bildirim Sistemi Ekle
```typescript
// functions/src/notifications.ts
export const sendSubscriptionReminder = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSubscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('endDate', '<=', sevenDaysFromNow.toISOString())
      .get();
    
    for (const doc of expiringSubscriptions.docs) {
      const subscription = doc.data();
      await sendEmail({
        to: subscription.businessEmail,
        subject: 'Aboneliğiniz Sona Eriyor',
        body: `Merhaba, ${subscription.businessName} aboneliğiniz 7 gün içinde sona erecek.`,
      });
    }
  });
```

---

### 🎯 ORTA VADELİ (1 AY)

#### 11. Admin Panel Oluştur
- Tüm abonelikleri görüntüleme
- Pending abonelikleri onaylama/reddetme
- Custom price belirleme
- İstatistikler ve raporlar

#### 12. Fatura Sistemi
- PDF fatura oluşturma
- E-Fatura entegrasyonu
- Vergi numarası kaydetme
- Fatura geçmişi

#### 13. Analytics Dashboard
- MRR (Monthly Recurring Revenue)
- Churn rate
- Plan dağılımı
- Gelir tahminleri

#### 14. Otomatik Yenileme
- Stripe Subscriptions kullan
- Otomatik ödeme
- Ödeme başarısız olursa retry
- Grace period (3 gün)

---

## 📊 GÜVENLİK PUANLAMA

### Mevcut Durum: 45/100 ⚠️

| Kategori | Puan | Durum |
|----------|------|-------|
| **Authentication** | 60/100 | ⚠️ Orta |
| **Authorization** | 40/100 | ❌ Zayıf |
| **Payment Security** | 0/100 | ❌ Yok |
| **Data Validation** | 50/100 | ⚠️ Orta |
| **Rate Limiting** | 0/100 | ❌ Yok |
| **Error Handling** | 40/100 | ❌ Zayıf |
| **Logging** | 30/100 | ❌ Zayıf |
| **Encryption** | 70/100 | ✅ İyi (Firebase) |

### Hedef: 90/100 ✅

---

## 🎯 SONUÇ VE ÖNERİLER

### ❌ ŞU ANDA PRODUCTION'A ALINMAMALI

**Nedenler:**
1. Ödeme sistemi yok - Kullanıcılar ücretsiz abonelik oluşturabilir
2. Admin onayları client-side - Güvenlik açığı
3. Rate limiting yok - DDoS saldırısına açık
4. Usage stats güncellenmiyor - Limitler çalışmıyor
5. Süre hesaplama hatalı - Yanlış bitiş tarihleri

### ✅ YAPILMASI GEREKENLER (ÖNCELİK SIRASINA GÖRE)

#### 🔥 ACİL (1-2 Gün)
1. Firebase Functions ile backend API
2. Firestore rules güçlendirme
3. Süre hesaplama düzeltme
4. Custom price kontrolü
5. Usage stats otomatik güncelleme

#### 📅 KISA VADELİ (1 Hafta)
6. Ödeme entegrasyonu (Stripe/Iyzico)
7. Rate limiting
8. Trial kontrolü
9. Pending timeout
10. Bildirim sistemi

#### 🎯 ORTA VADELİ (1 Ay)
11. Admin panel
12. Fatura sistemi
13. Analytics dashboard
14. Otomatik yenileme

### 💡 GENEL TAVSİYELER

1. **Backend-First Yaklaşım**: Tüm kritik işlemler backend'de olmalı
2. **Ödeme Öncelikli**: Ödeme sistemi olmadan production'a alınmamalı
3. **Test Coverage**: Unit ve integration testler yazılmalı
4. **Monitoring**: Sentry, LogRocket gibi araçlar entegre edilmeli
5. **Documentation**: API dokümantasyonu oluşturulmalı

---

## 📞 DESTEK

Sorularınız için:
- 📧 Email: security@randevu.app
- 💬 Discord: [Discord Server](#)
- 📖 Docs: [Security Documentation](#)

---

**Analiz Tarihi**: 24 Mayıs 2026  
**Analist**: Kiro AI Security Team  
**Versiyon**: 1.0  
**Durum**: ⚠️ PRODUCTION READY DEĞİL

